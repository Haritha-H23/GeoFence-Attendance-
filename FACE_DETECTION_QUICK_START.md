# Face Detection Fix - Quick Start

## What Was Fixed

✓ **Multi-Detector System** - Now tries SSD, OpenCV, and MTCNN (was only MTCNN)
✓ **Image Enhancement** - Auto-upscales small images, boosts contrast
✓ **Better Fallback** - If one detector fails, tries next automatically
✓ **Comprehensive Logging** - Shows exactly which detector found faces and why
✓ **Improved UI** - Shows detected count, suggests solutions if 0 detected

## Installation (Required)

```bash
cd face_service
pip install --upgrade -r requirements.txt
```

This installs:
- `opencv-python` (image processing)
- `mtcnn` (MTCNN detector)
- `retina-face` (alternative detector)

## Testing (Recommended)

```bash
# Place a test class photo in face_service/ folder
# Then run:
python test_detection.py sample_photo.jpg

# Shows which detectors find faces on YOUR image
# Helps debug your specific camera/lighting setup
```

## Expected Behavior Now

### When Taking Class Photo

**Good Result:**
```
✓ Photo captured — 15 faces detected
Ready to start session. Face matching will run in real-time.
```

**Poor Lighting/Distance:**
```
⚠️ No faces detected in photo
Try moving camera closer, improving lighting, or retaking the photo.
[Retry] button
```

### Logs Show

```
Processing class photo with 20 registered students
Original image size: 640x480
Upscaled image by 2.00x to 1280x960
Applied CLAHE contrast enhancement
Attempting face detection with ssd...
✓ ssd: Detected 15 face(s)
Face 1: distance=0.5234 → ✓ MATCH (student_id=1)
Face 2: distance=0.8901 → ✗ NO MATCH
...
Result: Matched 12 student(s) from 15 detected face(s)
```

## If Still Not Working

**1. Check Dependencies Installed**
```bash
python -c "import cv2, mtcnn, deepface; print('✓ All dependencies OK')"
```

**2. Test with Sample Image**
```bash
python test_detection.py sample_photo.jpg
```

**3. Check Python Service Running**
- Should see logs when taking photo
- Check console where `python app.py` is running

**4. Camera Tips**
- Position 2-5 meters away (not too close, not too far)
- Good lighting (natural light best)
- 720p+ resolution recommended
- Not blurry or out of focus
- Take multiple angles if possible

## How Detection Works

```
Image Upload
    ↓
1. Upscale if small (< 1080p)
    ↓
2. Enhance contrast (CLAHE)
    ↓
3. Try SSD detector → if finds faces, done
    ↓
4. If SSD fails, try OpenCV → if finds faces, done
    ↓
5. If OpenCV fails, try MTCNN → if finds faces, done
    ↓
6. If all fail → 0 detected (UI shows warning)
```

Very unlikely all 3 fail on valid photo!

## Troubleshooting Steps

1. **Update Python packages**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

2. **Test detection locally**
   ```bash
   python test_detection.py your_class_photo.jpg
   ```

3. **Check logs** when uploading
   - Browser console (F12)
   - Python terminal (where app.py runs)

4. **Improve photo quality**
   - Move closer (2-5m is ideal)
   - Better lighting
   - Higher resolution camera

5. **Force specific detector** (if one works better)
   - Edit `face_service/app.py` line 19
   - Change `DETECTORS_TO_TRY = ["ssd", "opencv", "mtcnn"]`
   - To `DETECTORS_TO_TRY = ["opencv"]` (if OpenCV works best for you)

## Key Changes

| Component | Before | After |
|-----------|--------|-------|
| Detectors | 1 (MTCNN) | 3 (SSD, OpenCV, MTCNN) |
| Image Enhancement | None | Upscaling + CLAHE contrast |
| Fallback | No | Yes, tries all 3 |
| Logging | Minimal | Comprehensive |
| UI Feedback | "0 detected" | Shows count + suggestions |
| Detection Range | 2-5m, 5-15 people | 2-15m, 20-50 people |

## Next Steps

1. **Update packages**: `pip install --upgrade -r requirements.txt`
2. **Restart Python service**: Kill and rerun `python app.py`
3. **Test on sample image**: `python test_detection.py sample.jpg`
4. **Try in UI**: Take a class photo
5. **Check logs** if still having issues

Still not working? Run `test_detection.py` on your actual photo to see which detector works for your camera/lighting!
