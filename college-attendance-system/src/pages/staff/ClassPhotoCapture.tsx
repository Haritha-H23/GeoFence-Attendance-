import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RotateCcw, CheckCircle } from 'lucide-react';
import { uploadClassPhoto } from '../../services/api';
import { Course } from '../../types';

interface Props {
  courses: Course[];
}

interface CapturedPhoto {
  blob: Blob;
  url: string;
  angle: string;
}

const ANGLES = ['Front View', 'Left Side', 'Right Side', 'Back View'];

export default function ClassPhotoCapture({ courses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      alert('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setPhotos((prev) => [...prev, { blob, url, angle: ANGLES[currentAngle] }]);
      if (currentAngle < ANGLES.length - 1) setCurrentAngle((prev) => prev + 1);
    }, 'image/jpeg', 0.92);
  };

  // Upload all photos one by one — Python detects faces in each and merges matches
  const uploadPhotos = async () => {
    if (!sessionId || photos.length === 0) return;
    setUploading(true);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('photo', photo.blob, `${photo.angle.replace(' ', '_')}.jpg`);
        await uploadClassPhoto(Number(sessionId), formData);
      }
      setUploadDone(true);
      stopCamera();
    } catch {
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setCurrentAngle(0);
    setUploadDone(false);
    stopCamera();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Class Photo Capture</h1>

      {/* Setup */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Session Setup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Enter active session ID"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Camera */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">
            Capture: <span className="text-indigo-600">{ANGLES[currentAngle] ?? 'Done'}</span>
          </h2>
          <div className="flex gap-2">
            {ANGLES.map((angle, i) => (
              <div key={angle} className={`w-2 h-2 rounded-full ${
                i < photos.length ? 'bg-green-500' : i === currentAngle ? 'bg-indigo-600' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>

        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4 aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {!streaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera size={40} className="mx-auto mb-2" />
                <p className="text-sm">Camera not started</p>
              </div>
            </div>
          )}
          {streaming && (
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg">
              📷 {ANGLES[currentAngle] ?? 'All captured'}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!streaming ? (
            <button onClick={startCamera} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
              <Camera size={16} /> Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={capturePhoto}
                disabled={currentAngle >= ANGLES.length}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                <Camera size={16} /> Capture {ANGLES[currentAngle] ?? ''}
              </button>
              <button onClick={stopCamera} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition">
                Stop
              </button>
            </>
          )}
          <button onClick={reset} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl text-sm transition">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Captured photos */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Captured Photos ({photos.length}/{ANGLES.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-gray-100">
                <img src={photo.url} alt={photo.angle} className="w-full aspect-video object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 text-center font-semibold">
                  {photo.angle}
                </div>
              </div>
            ))}
          </div>

          {uploadDone ? (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle size={20} /> Photos uploaded — attendance processed!
            </div>
          ) : (
            <button
              onClick={uploadPhotos}
              disabled={uploading || !sessionId}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
            >
              <Upload size={16} />
              {uploading ? 'Processing...' : 'Upload & Mark Attendance'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
