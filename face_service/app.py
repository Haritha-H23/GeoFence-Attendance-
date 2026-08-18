from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import json
import tempfile
import os
import cv2
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

MODEL = "Facenet"
# Try detectors in order of preference (most reliable first for multi-face detection)
DETECTORS_TO_TRY = ["ssd", "opencv", "mtcnn"]  # ssd best for multiple distant faces, fallback to opencv, then mtcnn
METRIC = "cosine"
THRESHOLD = 0.95  # Increased from 0.75 to be more lenient (handles different poses/lighting)


def save_temp(file_storage):
    """Save uploaded file to temp location."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.close()
    file_storage.save(tmp.name)
    logger.info(f"Saved temp file: {tmp.name}, size: {os.path.getsize(tmp.name)} bytes")
    return tmp.name


def enhance_image_for_detection(img_path):
    """
    Enhance image quality for better face detection.
    Returns tuple of (enhanced_path, should_cleanup)
    """
    try:
        img = cv2.imread(img_path)
        if img is None:
            logger.error(f"Could not read image: {img_path}")
            return img_path, False
        
        original_height, original_width = img.shape[:2]
        logger.info(f"Original image size: {original_width}x{original_height}")
        
        # Aggressive upscaling for better face detection
        height, width = img.shape[:2]
        if height < 1080:
            # Target 1080p minimum for detection
            scale_factor = max(1.5, 1080 / height)
            img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)
            logger.info(f"Upscaled image by {scale_factor:.2f}x to {img.shape[1]}x{img.shape[0]}")
        
        # Enhance contrast using CLAHE
        try:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            lab = cv2.merge([l, a, b])
            img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            logger.info("Applied CLAHE contrast enhancement")
        except Exception as e:
            logger.warning(f"CLAHE enhancement failed: {e}")
        
        # Save enhanced image
        enhanced_path = img_path.replace(".jpg", "_enh.jpg").replace(".JPG", "_enh.jpg")
        cv2.imwrite(enhanced_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        logger.info(f"Enhanced image saved: {enhanced_path}")
        return enhanced_path, True
        
    except Exception as e:
        logger.error(f"Image enhancement failed: {e}", exc_info=True)
        return img_path, False


def detect_faces_with_fallback(img_path):
    """
    Try multiple detectors to find faces.
    Returns list of face embeddings.
    """
    for detector in DETECTORS_TO_TRY:
        try:
            logger.info(f"Attempting face detection with {detector}...")
            result = DeepFace.represent(
                img_path=img_path,
                model_name=MODEL,
                detector_backend=detector,
                enforce_detection=False,
                align=True,
                normalization="base"
            )
            
            if result:
                logger.info(f"✓ {detector}: Detected {len(result)} face(s)")
                return result
            else:
                logger.info(f"✗ {detector}: No faces found")
                
        except Exception as e:
            logger.warning(f"✗ {detector} failed: {str(e)}")
            continue
    
    logger.error(f"All detectors failed to detect any faces")
    return []


def get_embedding(img_path):
    # Enhance image for better detection of distant faces
    enhanced_path = enhance_image_for_detection(img_path)
    
    result = DeepFace.represent(
        img_path=enhanced_path,
        model_name=MODEL,
        detector_backend=DETECTOR,
        enforce_detection=False   # let us handle 0-face case ourselves
    )
    
    # Clean up enhanced image if it's different from original
    if enhanced_path != img_path and os.path.exists(enhanced_path):
        try:
            os.unlink(enhanced_path)
        except:
            pass
    
    return result


@app.route("/health", methods=["GET"])
def health():
    logger.info("Health check requested")
    return jsonify({
        "status": "ok", 
        "model": MODEL, 
        "detectors": DETECTORS_TO_TRY,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}"
    })


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
    enhanced_path = None
    try:
        logger.info("========== REGISTRATION ENCODE START ==========")
        
        # Enhance image
        enhanced_path, should_cleanup = enhance_image_for_detection(path)
        
        # Detect faces with fallback
        faces = detect_faces_with_fallback(enhanced_path)
        
        logger.info(f"Face detection result: {len(faces)} face(s) found")
        
        if len(faces) == 0:
            logger.error("REJECT: No face detected")
            return jsonify({"error": "No face detected. Ensure good lighting and face the camera directly."}), 422
        if len(faces) > 1:
            logger.error(f"REJECT: Multiple faces detected ({len(faces)})")
            return jsonify({"error": f"Multiple faces detected ({len(faces)}). Please be alone in frame."}), 422
        
        logger.info("✓ ACCEPT: Single face detected and registered")
        return jsonify({"encoding": faces[0]["embedding"]})
        
    except Exception as e:
        logger.error(f"Exception in encode: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 422
    finally:
        if os.path.exists(path):
            os.unlink(path)
        if enhanced_path and enhanced_path != path and os.path.exists(enhanced_path):
            try:
                os.unlink(enhanced_path)
            except:
                pass
        logger.info("========== REGISTRATION ENCODE END ==========\n")


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
    enhanced_path = None
    try:
        logger.info("========== MATCH START ==========")
        logger.info(f"Matching against {len(students)} registered students")
        
        # Enhance image
        enhanced_path, should_cleanup = enhance_image_for_detection(path)
        
        # Detect faces with fallback
        faces = detect_faces_with_fallback(enhanced_path)
        
        logger.info(f"Detected {len(faces)} face(s) in class photo")

        if not faces:
            logger.warning("No faces detected - returning empty match")
            return jsonify({"matched_ids": [], "detected_count": 0})

        known_encodings = [np.array(s["encoding"]) for s in students]
        known_ids = [s["id"] for s in students]
        
        logger.info(f"Loaded {len(known_encodings)} student encodings")
        for j, enc in enumerate(known_encodings):
            enc_arr = np.array(enc)
            logger.info(f"  Student {known_ids[j]}: encoding len={len(enc_arr)}, norm={np.linalg.norm(enc_arr):.4f}")

        matched_ids = set()
        for i, face in enumerate(faces):
            detected = np.array(face["embedding"])
            detected_norm = np.linalg.norm(detected)
            logger.info(f"  Face {i+1}: embedding len={len(detected)}, norm={detected_norm:.4f}")
            
            # Compute cosine distances
            norms = np.linalg.norm(known_encodings, axis=1) * np.linalg.norm(detected)
            norms = np.where(norms == 0, 1e-10, norms)
            similarities = np.dot(known_encodings, detected) / norms
            distances = 1 - similarities
            
            best_idx = int(np.argmin(distances))
            best_distance = float(distances[best_idx])
            best_student_id = known_ids[best_idx]
            
            is_match = best_distance <= THRESHOLD
            status = "✓ MATCH" if is_match else "✗ NO MATCH"
            logger.info(f"  Face {i+1}: distance={best_distance:.4f} (threshold={THRESHOLD}) → {status} (student_id={best_student_id})")
            logger.info(f"         Distance stats: min={distances.min():.4f}, max={distances.max():.4f}, mean={distances.mean():.4f}")
            
            if is_match:
                matched_ids.add(best_student_id)

        logger.info(f"Result: Matched {len(matched_ids)} student(s) from {len(faces)} detected face(s)")
        return jsonify({
            "matched_ids": list(matched_ids),
            "detected_count": len(faces)
        })
        
    except Exception as e:
        logger.error(f"Match failed: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "matched_ids": [], "detected_count": 0}), 500
    finally:
        if os.path.exists(path):
            os.unlink(path)
        if enhanced_path and enhanced_path != path and os.path.exists(enhanced_path):
            try:
                os.unlink(enhanced_path)
            except:
                pass
        logger.info("========== MATCH END ==========\n")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
