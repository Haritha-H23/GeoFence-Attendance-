#!/bin/bash
# Installation script for face detection fix
# Run this to apply all fixes

echo "==================================="
echo "Face Detection Fix Installation"
echo "==================================="
echo ""

# Step 1: Navigate to face service
echo "Step 1: Navigating to face_service directory..."
cd face_service || { echo "ERROR: face_service directory not found"; exit 1; }

# Step 2: Show current Python version
echo ""
echo "Step 2: Checking Python version..."
python --version
echo ""

# Step 3: Upgrade pip
echo "Step 3: Upgrading pip..."
python -m pip install --upgrade pip
echo "✓ pip upgraded"
echo ""

# Step 4: Install/upgrade requirements
echo "Step 4: Installing face detection packages..."
echo "   (This may take 5-10 minutes due to TensorFlow dependencies)"
echo ""
pip install --upgrade -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ All packages installed successfully"
else
    echo "❌ Package installation failed"
    exit 1
fi

echo ""
echo "Step 5: Verifying installation..."
python -c "
import cv2
import numpy as np
import deepface
print('✓ OpenCV:', cv2.__version__)
print('✓ NumPy:', np.__version__)
print('✓ DeepFace imported successfully')
" || { echo "❌ Verification failed"; exit 1; }

echo ""
echo "==================================="
echo "✓ Installation Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Test on sample image:"
echo "   python test_detection.py sample_photo.jpg"
echo ""
echo "2. Restart Python service:"
echo "   python app.py"
echo ""
echo "3. Try uploading a class photo in the UI"
echo ""
echo "If you get '0 detected':"
echo "1. Run test_detection.py on your photo"
echo "2. Try better lighting or closer distance"
echo "3. Check TROUBLESHOOTING.md for more help"
