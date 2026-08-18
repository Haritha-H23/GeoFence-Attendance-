@echo off
REM Installation script for face detection fix (Windows)
REM Run this to apply all fixes

echo ===================================
echo Face Detection Fix Installation
echo ===================================
echo.

REM Step 1: Navigate to face service
echo Step 1: Navigating to face_service directory...
cd face_service
if errorlevel 1 (
    echo ERROR: face_service directory not found
    exit /b 1
)

REM Step 2: Show current Python version
echo.
echo Step 2: Checking Python version...
python --version
echo.

REM Step 3: Upgrade pip
echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 goto :error
echo ✓ pip upgraded
echo.

REM Step 4: Install/upgrade requirements
echo Step 4: Installing face detection packages...
echo    (This may take 5-10 minutes due to TensorFlow dependencies)
echo.
pip install --upgrade -r requirements.txt
if errorlevel 1 goto :error
echo ✓ All packages installed successfully

echo.
echo Step 5: Verifying installation...
python -c "import cv2, numpy, deepface; print('✓ All libraries imported successfully')"
if errorlevel 1 goto :error

echo.
echo ===================================
echo ✓ Installation Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Test on sample image:
echo    python test_detection.py sample_photo.jpg
echo.
echo 2. Restart Python service:
echo    python app.py
echo.
echo 3. Try uploading a class photo in the UI
echo.
echo If you get '0 detected':
echo 1. Run test_detection.py on your photo
echo 2. Try better lighting or closer distance
echo 3. Check TROUBLESHOOTING.md for more help
echo.
pause
exit /b 0

:error
echo.
echo ❌ Installation failed
echo Check error messages above
pause
exit /b 1
