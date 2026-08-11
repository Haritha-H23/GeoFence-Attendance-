from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import json
import tempfile
import os

app = Flask(__name__)

MODEL = "Facenet"          # accurate, fast, no compiler needed
DETECTOR = "mtcnn"       # reliable multi-scale detector
METRIC = "cosine"
THRESHOLD = 0.75           # same-person cosine distance is often higher with different lighting / camera angles


def save_temp(file_storage):
    # On Windows, NamedTemporaryFile holds an exclusive lock while open.
    # Must close it before writing into it via file_storage.save().
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.close()
    file_storage.save(tmp.name)
    return tmp.name


def get_embedding(img_path):
    result = DeepFace.represent(
        img_path=img_path,
        model_name=MODEL,
        detector_backend=DETECTOR,
        enforce_detection=False   # let us handle 0-face case ourselves
    )
    return result


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/encode", methods=["POST"])
def encode():
    """
    Registration endpoint.
    Accepts one face image, returns its 128-d embedding.
    Rejects if 0 or >1 faces found.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    path = save_temp(request.files["image"])
    try:
        faces = get_embedding(path)
        if len(faces) == 0:
            return jsonify({"error": "No face detected. Ensure good lighting and face the camera directly."}), 422
        if len(faces) > 1:
            return jsonify({"error": "Multiple faces detected. Please be alone in frame."}), 422
        return jsonify({"encoding": faces[0]["embedding"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 422
    finally:
        if os.path.exists(path):
            os.unlink(path)


@app.route("/match", methods=["POST"])
def match():
    """
    Matching endpoint.
    Accepts a class photo + registered student encodings.
    Returns matched student IDs.

    Form fields:
      image    — class photo file
      students — JSON: [{"id": 1, "encoding": [...]}, ...]
    """
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    if "students" not in request.form:
        return jsonify({"error": "No students data"}), 400

    students = json.loads(request.form["students"])
    if not students:
        return jsonify({"matched_ids": [], "detected_count": 0})

    path = save_temp(request.files["image"])
    try:
        faces = DeepFace.represent(
            img_path=path,
            model_name=MODEL,
            detector_backend=DETECTOR,
            enforce_detection=False
        )

        if not faces:
            return jsonify({"matched_ids": [], "detected_count": 0})

        known_encodings = [np.array(s["encoding"]) for s in students]
        known_ids = [s["id"] for s in students]

        matched_ids = set()
        for face in faces:
            detected = np.array(face["embedding"])
            norms = np.linalg.norm(known_encodings, axis=1) * np.linalg.norm(detected)
            norms = np.where(norms == 0, 1e-10, norms)
            similarities = np.dot(known_encodings, detected) / norms
            distances = 1 - similarities
            best_idx = int(np.argmin(distances))
            best_distance = float(distances[best_idx])
            print(f"face match debug: best_distance={best_distance}, best_idx={best_idx}, known_id={known_ids[best_idx]}")
            if best_distance <= THRESHOLD:
                matched_ids.add(known_ids[best_idx])

        return jsonify({
            "matched_ids": list(matched_ids),
            "detected_count": len(faces)
        })
    except Exception as e:
        return jsonify({"error": str(e), "matched_ids": [], "detected_count": 0}), 500
    finally:
        if os.path.exists(path):
            os.unlink(path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
