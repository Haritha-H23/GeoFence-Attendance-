#!/usr/bin/env python3
"""
Face Detection Tester - Simple version
Tests face detection on provided image
"""

import sys
import os

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_image(img_path):
    """Test face detection on image"""
    
    # Check file exists
    if not os.path.exists(img_path):
        print(f"ERROR: File not found: {img_path}")
        return False
    
    size = os.path.getsize(img_path)
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(img_path)} ({size} bytes)")
    print(f"{'='*60}\n")
    
    # Test imports
    try:
        import cv2
        import numpy as np
        from deepface import DeepFace
        print("[OK] All packages imported successfully\n")
    except ImportError as e:
        print(f"[ERROR] Missing package: {e}")
        return False
    
    # Read image
    try:
        img = cv2.imread(img_path)
        if img is None:
            print(f"[ERROR] Could not read image")
            return False
        h, w = img.shape[:2]
        print(f"[OK] Image size: {w}x{h} pixels\n")
    except Exception as e:
        print(f"[ERROR] Could not read image: {e}")
        return False
    
    # Test each detector
    detectors = ["ssd", "opencv", "mtcnn"]
    results = {}
    
    print("Testing detectors...\n")
    
    for detector in detectors:
        print(f"[TESTING] {detector.upper()}...", end=" ", flush=True)
        try:
            faces = DeepFace.represent(
                img_path=img_path,
                model_name="Facenet",
                detector_backend=detector,
                enforce_detection=False,
                align=True,
                normalization="base"
            )
            count = len(faces)
            results[detector] = count
            print(f"FOUND {count} face(s)")
            
        except Exception as e:
            print(f"ERROR")
            results[detector] = -1
            print(f"  Details: {str(e)[:100]}")
    
    # Summary
    print(f"\n{'='*60}")
    print("RESULTS:")
    print(f"{'='*60}")
    
    for detector, count in sorted(results.items(), key=lambda x: -x[1] if x[1] >= 0 else -999):
        if count > 0:
            print(f"  [FOUND] {detector:10s}: {count} face(s)")
        elif count == 0:
            print(f"  [NONE]  {detector:10s}: 0 faces")
        else:
            print(f"  [ERROR] {detector:10s}: Failed")
    
    # Best detector
    best = max((k, v) for k, v in results.items() if v >= 0)
    if best[1] > 0:
        print(f"\n[SUCCESS] Best detector: {best[0]} ({best[1]} faces)")
        return True
    else:
        print(f"\n[WARNING] No detectors found faces")
        return False


def main():
    print("\n" + "="*60)
    print("FACE DETECTION TESTER")
    print("="*60)
    
    if len(sys.argv) < 2:
        # List images in current directory
        images = [f for f in os.listdir('.') if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if images:
            print(f"\nFound {len(images)} image(s) in current directory:")
            for img in images:
                size = os.path.getsize(img)
                print(f"  - {img} ({size} bytes)")
            print(f"\nUsage: python test_detection.py <image_name>")
            print(f"Example: python test_detection.py {images[0]}")
            return False
        else:
            print("\nNo image files found in current directory")
            print("\nUsage: python test_detection.py <image_path>")
            print("Example: python test_detection.py my_photo.jpg")
            print("Example: python test_detection.py /path/to/photo.jpg")
            return False
    
    # Test provided image
    img_path = sys.argv[1]
    success = test_image(img_path)
    
    if not success:
        print("\n[TIPS]")
        print("- Make sure image is a valid JPG or PNG")
        print("- Image should contain visible faces")
        print("- Good lighting helps detection")
        print("- Try different images to compare")
    
    return success


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FATAL ERROR]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
