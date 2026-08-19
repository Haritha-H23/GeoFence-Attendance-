"""
Comprehensive face detection testing script.
Tests all detectors and shows debug info about what's working.

Usage: python test_detection.py [image_path]
"""

import sys
import os
from pathlib import Path
import logging

# Fix encoding on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_detectors_on_image(img_path):
    """Test all detectors on a single image."""
    
    if not os.path.exists(img_path):
        print(f"[ERROR] Image not found: {img_path}")
        print(f"   Full path: {os.path.abspath(img_path)}")
        return False
    
    print(f"\n{'='*60}")
    print(f"Testing face detection on: {Path(img_path).name}")
    print(f"File size: {os.path.getsize(img_path)} bytes")
    print(f"{'='*60}\n")
    
    try:
        import cv2
        img = cv2.imread(img_path)
        if img is None:
            print("[ERROR] Could not read image with cv2")
            print(f"   This usually means the file is corrupted or not a valid image")
            return False
        height, width = img.shape[:2]
        print(f"[OK] Image dimensions: {width}x{height}")
    except Exception as e:
        print(f"⚠️  Could not read image with cv2: {e}")
        return False
    
    try:
        from deepface import DeepFace
    except ImportError:
        print("[ERROR] deepface not installed. Run: pip install deepface")
        return False
    
    # Test each detector
    detectors = ["opencv", "ssd", "mtcnn"]
    results = {}
    
    for detector in detectors:
        print(f"\n--- Testing {detector.upper()} ---")
        try:
            logger.info(f"Detecting with {detector}...")
            faces = DeepFace.represent(
                img_path=img_path,
                model_name="Facenet",
                detector_backend=detector,
                enforce_detection=False,
                align=True,
                normalization="base"
            )
            
            if faces:
                print(f"[FOUND] {detector}: Detected {len(faces)} face(s)")
                for i, face in enumerate(faces):
                    conf = face.get("face_confidence", "N/A")
                    print(f"   Face {i+1}: confidence={conf}")
                results[detector] = len(faces)
            else:
                print(f"[NOT FOUND] {detector}: No faces detected")
                results[detector] = 0
                
        except Exception as e:
            print(f"[ERROR] {detector}: {str(e)}")
            results[detector] = -1
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY:")
    print(f"{'='*60}")
    
    successful = {k: v for k, v in results.items() if v >= 0}
    if not successful:
        print("[ERROR] All detectors failed!")
        return False
    
    for detector, count in sorted(successful.items(), key=lambda x: -x[1] if x[1] > 0 else 0):
        status = "[OK]" if count > 0 else "[NONE]"
        print(f"{status} {detector:12s}: {count} face(s)")
    
    best_detector = max(successful.items(), key=lambda x: x[1])
    if best_detector[1] > 0:
        print(f"\n[BEST] BEST DETECTOR: {best_detector[0]} ({best_detector[1]} faces)")
        return True
    else:
        print(f"\n[WARN] No detector found any faces")
        return False


def create_sample_image():
    """Create a simple test image to verify detection pipeline."""
    try:
        import cv2
        import numpy as np
        
        print("\n" + "="*60)
        print("Creating sample test image...")
        print("="*60)
        
        # Create a blank image
        img = np.ones((480, 640, 3), dtype=np.uint8) * 200
        
        # Add some shapes to simulate content
        cv2.rectangle(img, (50, 50), (150, 150), (100, 100, 255), 2)
        cv2.circle(img, (320, 240), 50, (100, 255, 100), 2)
        cv2.putText(img, "Sample Image - No Real Faces", (150, 400), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Save it
        sample_path = "sample_test_image.jpg"
        cv2.imwrite(sample_path, img)
            print(f"[OK] Created: {sample_path}")
        return sample_path
        
    except Exception as e:
        print(f"[ERROR] Could not create sample image: {e}")
        return None


def list_available_images():
    """List image files in current directory."""
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG']
    images = []
    
    print("\n" + "="*60)
    print("Searching for images in current directory...")
    print("="*60)
    
    for file in os.listdir('.'):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            size = os.path.getsize(file)
            images.append((file, size))
            print(f"  [OK] {file} ({size} bytes)")
    
    if not images:
        print(f"  [INFO] No image files found in current directory")
        print("     Place a .jpg or .png file here and run again")
    
    return images


def test_import():
    """Test if all required packages are importable."""
    print("\n" + "="*60)
    print("Testing package imports...")
    print("="*60)
    
    packages = [
        ('cv2', 'OpenCV'),
        ('numpy', 'NumPy'),
        ('deepface', 'DeepFace'),
        ('flask', 'Flask'),
    ]
    
    all_ok = True
    for module_name, display_name in packages:
        try:
            __import__(module_name)
            print(f"[OK] {display_name:15s} - OK")
        except ImportError:
            print(f"[MISSING] {display_name:15s} - (run: pip install {module_name})")
            all_ok = False
    
    return all_ok


if __name__ == "__main__":
    print("[TEST] Face Detection Test Suite\n")
    
    # Test imports first
    if not test_import():
        print("\n[ERROR] Missing required packages. Install them first:")
        print("   pip install --upgrade -r requirements.txt")
        sys.exit(1)
    
    print("\n" + "="*60)
    
    # Test on provided image or show usage
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        success = test_detectors_on_image(img_path)
        sys.exit(0 if success else 1)
    else:
        # List available images
        images = list_available_images()
        
        if images:
            print(f"\n[INFO] Found {len(images)} image(s). Testing first one...")
            first_image = images[0][0]
            print(f"   python test_detection.py {first_image}")
            success = test_detectors_on_image(first_image)
            sys.exit(0 if success else 1)
        else:
            print(f"\n{'='*60}")
            print("Usage: python test_detection.py <image_path>")
            print(f"{'='*60}\n")
            print("How to test:\n")
            print("Option 1: Test with specific image")
            print("  python test_detection.py /path/to/class_photo.jpg\n")
            print("Option 2: Place image in this directory")
            print("  1. Copy a classroom photo here (e.g., class.jpg)")
            print("  2. Run: python test_detection.py class.jpg\n")
            print("Option 3: Create sample test image")
            print("  1. Run: python test_detection.py --create-sample")
            print("  2. Then: python test_detection.py sample_test_image.jpg\n")
            print("What the test does:")
            print("  • Tests OpenCV detector")
            print("  • Tests SSD detector")
            print("  • Tests MTCNN detector")
            print("  • Shows which detector finds the most faces")
            print("  • Helps identify which detector works best for your camera\n")
            
            # Check for --create-sample flag
            if len(sys.argv) > 1 and sys.argv[1] == "--create-sample":
                sample = create_sample_image()
                if sample:
                    print(f"\nTesting with created sample image...")
                    test_detectors_on_image(sample)

