# Face Detection Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check Python Service is Running
```powershell
# Check if service is running
curl http://localhost:5001/health

# Expected output:
# {"status":"ok","model":"Facenet","detectors":["ssd","opencv","mtcnn"],"python_version":"3.x"}
```

### Step 2: Update Dependencies
```bash
cd face_service
pip install --upgrade -r requirements.txt
```

### Step 3: Test Face Detection Directly
```bash
# Place a test image in face_service folder
python test_detection.py sample.jpg

# This will test all three detectors (ssd, opencv, mtcnn) and show which ones work
```

---

## Common Issues & Solutions

### Issue: "0 detected" - No Faces Found

**Cause 1: Image Quality Too Low**
- Resolution < 480p
- Students are too far from camera
- Poor lighting
- Image is blurry

**Solution:**
1. Take photo from closer distance (2-5 meters max)
2. Ensure good lighting (natural light preferred)
3. Position camera at eye level
4. Take multiple angles (front, left, right) - system will pick best

**Cause 2: Detector Installation Issue**
```bash
# Force reinstall detectors
pip uninstall opencv-python opencv-python-headless retina-face mtcnn -y
pip install opencv-python mtcnn retina-face
```

**Cause 3: Python Libraries Conflict**
```bash
# Create fresh virtual environment
python -m venv venv_face
venv_face\Scripts\activate

# Install clean
pip install -r requirements.txt
```

---

## How the Detection Works Now

### Multi-Detector Fallback System
1. **Try SSD** (best for multiple/distant faces)
2. **Try OpenCV** (good for close faces)
3. **Try MTCNN** (reliable baseline)
4. **If all fail** → 0 detected

### Image Enhancement Pipeline
1. **Upscaling**: If image < 1080p, automatically upscale to 1080p
2. **Contrast Boost**: Apply CLAHE to improve visibility
3. **Alignment**: Align faces for better embedding
4. **Quality**: Save at 95% JPEG quality

---

## Testing Checklist

- [ ] Run Python health check: `curl http://localhost:5001/health`
- [ ] Test with test_detection.py on a known good image
- [ ] Check logs for any detector errors
- [ ] Verify image is being uploaded (check file size in logs)
- [ ] Try retaking photo with better lighting/distance

---

## Backend Logs

Check for these messages:

✓ **Good Signs:**
```
========== MATCH START ==========
Detected 15 face(s) in class photo
✓ ssd: Detected 15 face(s)
Result: Matched 12 student(s) from 15 detected face(s)
```

✗ **Bad Signs:**
```
All detectors failed to detect any faces
No faces detected - returning empty match
✗ ssd failed: [error message]
```

---

## If All Else Fails

### Option 1: Manual Attendance
Staff can manually mark students as present if face detection isn't working.

### Option 2: Check Image Upload
```bash
# Verify images are actually uploading
ls -la backend/uploads/class-photos/
```

### Option 3: Debug with Specific Image
```bash
# Place test image in face_service directory
python test_detection.py test_image.jpg

# Compare detectors:
# - If all return 0: image quality issue
# - If ssd works: use ssd detector in app.py
# - If opencv works: use opencv detector in app.py
```

### Option 4: Adjust Threshold
If getting partial matches, adjust THRESHOLD in `app.py`:
```python
THRESHOLD = 0.75  # Lower = stricter matching (0.6-0.8 range)
```

---

## Performance Tips

1. **Upscale images before sending** - UI can do this
2. **Use good camera angle** - Top-down 45° is optimal
3. **Ensure 480p minimum** - Better results at 720p+
4. **Multiple photos** - Front + side views catch more faces
5. **Group photos** - Take photo when class is still (not moving)

---

## Contact / Further Help

Check logs at:
- Backend: `backend/target/` or console output
- Frontend: Browser DevTools Console
- Python: Terminal where `python app.py` is running
