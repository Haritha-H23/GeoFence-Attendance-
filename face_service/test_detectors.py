"""
Run this script directly: python test_detectors.py
It tests every deepface detector backend on a real image.
"""
import sys, os

# ── 1. Download a real face image ──────────────────────────────────────────
img_path = "test_human.jpg"
if not os.path.exists(img_path):
    print(f"ERROR: Place a clear face photo as '{img_path}' in this folder.")
    sys.exit(1)
print(f"Using {img_path} ({os.path.getsize(img_path)} bytes)")

# ── 2. Try every detector ───────────────────────────────────────────────────
from deepface import DeepFace

detectors = ["opencv", "ssd", "mtcnn", "retinaface", "mediapipe", "yunet"]

print("\n--- Testing detectors with Facenet model ---")
for det in detectors:
    try:
        result = DeepFace.represent(
            img_path=img_path,
            model_name="Facenet",
            detector_backend=det,
            enforce_detection=False
        )
        confident = [r for r in result if r.get("face_confidence", 1) > 0.5]
        print(f"  {det:12s} → {len(result)} face(s) raw, {len(confident)} confident")
    except Exception as e:
        print(f"  {det:12s} → ERROR: {e}")

# ── 3. Also test the temp file save pattern ─────────────────────────────────
print("\n--- Testing Windows temp file save pattern ---")
import tempfile
tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
tmp.close()
import shutil
shutil.copy(img_path, tmp.name)
print(f"Temp file size after copy: {os.path.getsize(tmp.name)}")
result = DeepFace.represent(tmp.name, model_name="Facenet", detector_backend="opencv", enforce_detection=False)
print(f"Faces from temp file: {len(result)}")
os.unlink(tmp.name)

print("\nDone.")
