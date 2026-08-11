import { useState, useEffect, useRef } from 'react';
import { MapPin, Play, Square, CheckCircle, XCircle, Clock, Camera, ShieldCheck } from 'lucide-react';
import {
  startAttendanceSession,
  endAttendanceSession,
  getSessionAttendance,
  updateStudentAttendance,
  uploadClassPhoto,
} from '../../services/api';
import { Course, AttendanceRecord, GeoLocation } from '../../types';

interface Props {
  courses: Course[];
  preSelectedCourse: Course | null;
}

type Step = 'setup' | 'location' | 'face' | 'active';

export default function AttendanceSession({ courses, preSelectedCourse }: Props) {
  const [step, setStep] = useState<Step>('setup');
  const [selectedCourse, setSelectedCourse] = useState<string>(
    preSelectedCourse ? String(preSelectedCourse.id) : ''
  );
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [radius, setRadius] = useState(50);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [faceCaptureDone, setFaceCaptureDone] = useState(false);
  const [faceCaptureCount, setFaceCaptureCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const takePreview = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setFaceCaptureDone(true);
    }, 'image/jpeg', 0.92);
  };

  useEffect(() => {
    if (preSelectedCourse) setSelectedCourse(String(preSelectedCourse.id));
  }, [preSelectedCourse]);

  // Step 1 → Step 2: Request location permission explicitly
  const requestLocation = () => {
    setLocationError('');
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
        setStep('face');
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access in your browser settings and try again.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location unavailable. Make sure GPS is enabled.');
        } else {
          setLocationError('Could not get location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Step 2 → Step 3: Start camera for face capture
  const startFaceCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      alert('Camera access denied. Please allow camera permissions to proceed.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const captureClassPhoto = async (activeSessionId: number) => {
    if (!videoRef.current || !canvasRef.current) return;
    try {
      const video = videoRef.current;
      // Wait until video has actual dimensions
      let waited = 0;
      while ((video.videoWidth === 0 || video.videoHeight === 0) && waited < 3000) {
        await new Promise((r) => setTimeout(r, 100));
        waited += 100;
      }
      if (video.videoWidth === 0) throw new Error('Camera not ready');

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append('photo', blob, 'class-photo.jpg');
      const res = await uploadClassPhoto(activeSessionId, formData);
      const detected = res.data?.detectedCount ?? 0;
      setFaceCaptureCount(detected);
      setFaceCaptureDone(true);
    } catch (error) {
      console.error('Failed to upload class photo', error);
    }
  };

  const confirmAndStart = async () => {
    if (!selectedCourse || !location) return;
    setLoading(true);
    try {
      const res = await startAttendanceSession({
        courseId: Number(selectedCourse),
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: radius,
      });
      const newSessionId = res.data.id;
      setSessionId(newSessionId);
      setSessionActive(true);
      await captureClassPhoto(newSessionId);  // pass directly, don't rely on state
      setStep('active');
    } catch {
      alert('Failed to start session. Please try again.');
    } finally {
      stopCamera();
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await endAttendanceSession(sessionId);
      setSessionActive(false);
    } catch {
      alert('Failed to end session.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!sessionId) return;
    const res = await getSessionAttendance(sessionId);
    setRecords(res.data);
  };

  useEffect(() => {
    if (sessionId) {
      fetchRecords();
      const interval = setInterval(fetchRecords, 15000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  useEffect(() => () => stopCamera(), []);

  const handleOverride = async (studentId: number, status: string) => {
    if (!sessionId) return;
    await updateStudentAttendance(sessionId, studentId, status);
    fetchRecords();
  };

  const present = records.filter((r) => r.status === 'PRESENT').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Take Attendance</h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { id: 'setup', label: '1. Course' },
          { id: 'location', label: '2. Location' },
          { id: 'face', label: '3. Face Scan' },
          { id: 'active', label: '4. Live' },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              step === s.id ? 'bg-indigo-600 text-white' :
              ['setup','location','face','active'].indexOf(step) > i ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {['setup','location','face','active'].indexOf(step) > i
                ? <CheckCircle size={12} />
                : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < arr.length - 1 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Course & Radius Setup */}
      {step === 'setup' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Select Course</h2>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No courses assigned to you yet.</p>
              <p className="text-gray-400 text-xs mt-1">Ask admin to assign courses to your account.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select a course --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Geo-fence Radius (meters)</label>
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    min={10} max={500}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep('location')}
                disabled={!selectedCourse}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                Next: Enable Location →
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Location Permission */}
      {step === 'location' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Enable Location Access</h2>
            <p className="text-gray-500 text-sm mb-2">
              Your current location will be used as the geo-fence center for this session.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Students must stay within <strong>{radius}m</strong> of this location throughout the class.
            </p>

            {locationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 text-left">
                <strong>Error:</strong> {locationError}
                <p className="text-xs mt-1 text-red-500">
                  To fix: Click the 🔒 lock icon in your browser address bar → Site settings → Allow Location.
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep('setup')} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                ← Back
              </button>
              <button
                onClick={requestLocation}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                <MapPin size={16} />
                {loading ? 'Getting Location...' : 'Allow & Get Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Face Capture */}
      {step === 'face' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Face Scan — Capture Class</h2>
          <p className="text-xs text-gray-500 mb-4">
            Take a photo of the class to detect and count students present.
            Location locked at: <span className="font-mono text-indigo-600">{location?.latitude.toFixed(5)}, {location?.longitude.toFixed(5)}</span>
          </p>

          {/* Camera preview */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4 aspect-video max-w-lg">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
            {!streaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Camera size={36} className="mx-auto mb-2" />
                  <p className="text-sm">Camera not started</p>
                </div>
              </div>
            )}
            {streaming && (
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                📷 Camera ready
              </div>
            )}
            {faceCaptureDone && (
              <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                ✓ Photo captured
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-6">
            {!streaming ? (
              <button onClick={startFaceCapture} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                <Camera size={16} /> Start Camera
              </button>
            ) : (
              <>
                <button onClick={takePreview} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                  <Camera size={16} /> Capture Photo
                </button>
                <button onClick={stopCamera} className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition">
                  Stop Camera
                </button>
              </>
            )}
          </div>

          {faceCaptureDone && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <ShieldCheck size={20} className="text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Photo captured — ready to start session</p>
                <p className="text-xs text-green-600">Face matching will run when the session starts.</p>
              </div>
              {previewUrl && <img src={previewUrl} className="ml-auto h-16 rounded-lg object-cover" alt="preview" />}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { stopCamera(); setStep('location'); }} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              ← Back
            </button>
            <button
              onClick={confirmAndStart}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
            >
              <Play size={16} />
              {loading ? 'Starting...' : faceCaptureDone ? 'Start Session' : 'Skip & Start Session'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Active Session */}
      {step === 'active' && (
        <div>
          {/* Session info bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin size={14} className="text-indigo-500" />
                {location?.latitude.toFixed(5)}, {location?.longitude.toFixed(5)} · {radius}m radius
              </div>
              {faceCaptureDone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Camera size={14} className="text-green-500" />
                  {faceCaptureCount} detected
                </div>
              )}
            </div>
            {sessionActive ? (
              <button
                onClick={handleEnd}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                <Square size={14} /> {loading ? 'Ending...' : 'End Session'}
              </button>
            ) : (
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">Session Ended</span>
            )}
          </div>

          {/* Live attendance table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                Live Attendance
                {sessionActive && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                  </span>
                )}
              </h2>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-semibold">✓ {present} Present</span>
                <span className="text-red-600 font-semibold">✗ {absent} Absent</span>
              </div>
            </div>

            {records.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No students enrolled in this course.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Verified By</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{r.studentName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            r.status === 'PRESENT' ? 'bg-green-50 text-green-700' :
                            r.status === 'ABSENT' ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {r.status === 'PRESENT' ? <CheckCircle size={12} /> :
                             r.status === 'ABSENT' ? <XCircle size={12} /> :
                             <Clock size={12} />}
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${r.geoVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              📍 Geo
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${r.faceVerified ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              👤 Face
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => handleOverride(r.studentId, 'PRESENT')} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg transition">
                              Present
                            </button>
                            <button onClick={() => handleOverride(r.studentId, 'ABSENT')} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded-lg transition">
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
