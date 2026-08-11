import { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { updateStudentLocation } from '../../services/api';
import { GeoLocation } from '../../types';

interface Props {
  selectedCourseId?: number | null;
}

export default function GeoFenceMonitor({ selectedCourseId }: Props) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [status, setStatus] = useState<'idle' | 'inside' | 'outside' | 'error'>('idle');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [tracking, setTracking] = useState(false);
  const [absentMinutes, setAbsentMinutes] = useState(0);
  const watchRef = useRef<number | null>(null);
  const absentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: GeoLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocation(loc);
        sendLocation(loc);
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (absentTimerRef.current) {
      clearInterval(absentTimerRef.current);
      absentTimerRef.current = null;
    }
    setTracking(false);
    setStatus('idle');
    setAbsentMinutes(0);
  };

  const sendLocation = async (loc: GeoLocation) => {
    try {
      const res = await updateStudentLocation({
        ...loc,
        courseId: selectedCourseId ?? undefined,
      });
      const { insideFence, message } = res.data;
      setStatus(insideFence ? 'inside' : 'outside');

      if (!insideFence) {
        if (!absentTimerRef.current) {
          absentTimerRef.current = setInterval(() => {
            setAbsentMinutes((prev) => {
              const next = prev + 1;
              if (next >= 10) {
                setAlerts((a) => [
                  `⚠️ You have been outside the class for ${next} minutes. Marked as absent.`,
                  ...a.slice(0, 4),
                ]);
              }
              return next;
            });
          }, 60000);
        }
        if (message) {
          setAlerts((a) => [message, ...a.slice(0, 4)]);
        }
      } else {
        if (absentTimerRef.current) {
          clearInterval(absentTimerRef.current);
          absentTimerRef.current = null;
        }
        setAbsentMinutes(0);
      }
    } catch {
      // Session may not be active
    }
  };

  useEffect(() => () => stopTracking(), []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Live Location Monitor</h1>

      {/* Status Card */}
      <div className={`rounded-2xl p-6 mb-6 border-2 transition-all ${
        status === 'inside' ? 'bg-green-50 border-green-200' :
        status === 'outside' ? 'bg-red-50 border-red-200' :
        status === 'error' ? 'bg-yellow-50 border-yellow-200' :
        'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            status === 'inside' ? 'bg-green-100' :
            status === 'outside' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            {status === 'inside' ? <CheckCircle size={28} className="text-green-600" /> :
             status === 'outside' ? <AlertTriangle size={28} className="text-red-600" /> :
             <MapPin size={28} className="text-gray-400" />}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {status === 'idle' ? 'Not Tracking' :
               status === 'inside' ? 'Inside Class Zone ✓' :
               status === 'outside' ? 'Outside Class Zone ⚠' :
               'Location Error'}
            </p>
            {location && (
              <p className="text-xs text-gray-500 mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {location.accuracy && ` · ±${Math.round(location.accuracy)}m`}
              </p>
            )}
            {status === 'outside' && absentMinutes > 0 && (
              <p className="text-sm text-red-600 font-semibold mt-1">
                Away for {absentMinutes} min{absentMinutes >= 10 ? ' — Marked Absent' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={startTracking}
          disabled={tracking}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
        >
          <Wifi size={16} /> Enable location for attendance
        </button>
        <button
          onClick={stopTracking}
          disabled={!tracking}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
        >
          <WifiOff size={16} /> Stop
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" /> Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm px-4 py-2.5 rounded-xl">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>How it works:</strong> Your location is tracked during active class sessions. If you leave the geo-fenced area for more than 10 minutes, you will be automatically marked absent.
      </div>
    </div>
  );
}
