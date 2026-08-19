# Face Recognition Service

Python microservice using `face_recognition` (dlib) for accurate face detection and matching.

## Setup

```bash
cd face_service

# Install dependencies (requires cmake and dlib build tools)
pip install -r requirements.txt

# Run
python app.py
```

Runs on http://localhost:5001

## Endpoints

- `GET  /health`              — health check
- `POST /encode`              — register a face from image (student registration)
- `POST /match`               — match faces in a class photo against registered students

## Notes

- On Windows, install dlib via: `pip install dlib` (requires Visual Studio Build Tools)
- Or use a pre-built wheel: `pip install dlib-bin`
- The service must be running before starting the Spring Boot backend
