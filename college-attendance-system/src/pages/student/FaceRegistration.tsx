import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { registerFaceImage, getFaceStatus } from '../../services/api';

export default function FaceRegistration() {
  const [modelsReady] = useState(true); // no longer needed, kept for UI compat
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState(false);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load registration status on mount
  useEffect(() => {
    getFaceStatus()
      .then((r) => setRegistered(r.data.registered))
      .catch(() => {});
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      setMessage('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const captureAndRegister = async () => {
    if (!videoRef.current) return;
    setStatus('detecting');
    setMessage('');
    try {
      const video = videoRef.current;
      // Wait until video has actual dimensions
      let waited = 0;
      while ((video.videoWidth === 0 || video.videoHeight === 0) && waited < 3000) {
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }
      if (video.videoWidth === 0) throw new Error('Camera not ready — try again');

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Failed to capture image');

      setSaving(true);
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      await registerFaceImage(formData);
      setStatus('success');
      setMessage('Face registered successfully! You will now be automatically identified during attendance.');
      setRegistered(true);
      stopCamera();
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.error || err?.message || 'Face registration failed. Make sure your face is clearly visible.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Face Registration</h1>
      <p className="text-gray-500 text-sm mb-6">
        Register your face once. It will be used to automatically verify your presence during attendance sessions.
      </p>

      {/* Already registered banner */}
      {registered && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <ShieldCheck size={22} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Face already registered</p>
            <p className="text-xs text-green-600">You can re-register below to update your face data.</p>
          </div>
        </div>
      )}

      {/* Model loading */}
      {!modelsReady && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex items-center gap-3 text-sm text-blue-700">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          Loading face detection models...
        </div>
      )}

      {/* Camera box */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            muted
            playsInline
          />
          {/* Canvas overlay for face boxes */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full scale-x-[-1]"
            style={{ pointerEvents: 'none' }}
          />

          {!streaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera size={40} className="mx-auto mb-2" />
                <p className="text-sm">Camera not started</p>
              </div>
            </div>
          )}

          {/* Live face count badge */}
          {streaming && liveCount !== null && (
            <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-xl ${
              liveCount === 1 ? 'bg-green-600 text-white' :
              liveCount === 0 ? 'bg-red-600 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              {liveCount === 0 ? '❌ No face' :
               liveCount === 1 ? '✓ 1 face detected' :
               `⚠ ${liveCount} faces — be alone`}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500 space-y-1">
          <p>• Look directly at the camera</p>
          <p>• Make sure your face is well-lit</p>
          <p>• Only you should be in the frame</p>
          <p>• Remove glasses if detection fails</p>
        </div>

        <div className="flex gap-3">
          {!streaming ? (
            <button
              onClick={startCamera}
              disabled={!modelsReady}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
            >
              <Camera size={16} /> Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={captureAndRegister}
                disabled={status === 'detecting' || saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : status === 'detecting' ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Detecting...</>
                ) : (
                  <><CheckCircle size={16} /> Register My Face</>
                )}
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {message && (
        <div className={`rounded-xl p-4 flex items-start gap-3 text-sm ${
          status === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          status === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-100 text-blue-800'
        }`}>
          {status === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> :
           status === 'error' ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> : null}
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <button
          onClick={() => { setStatus('idle'); setMessage(''); }}
          className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}
