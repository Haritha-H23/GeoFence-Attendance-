import { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Wifi, WifiOff, Coffee, Clock } from 'lucide-react';
import { updateStudentLocation } from '../../services/api';
import { reverseGeocode, searchNearbyBuildings } from '../../services/googleMaps';
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
  const [breakRequested, setBreakRequested] = useState(false);
  const [breakRemaining, setBreakRemaining] = useState(0);
  const [geoPlace, setGeoPlace] = useState('Current location');
  const watchRef = useRef<number | null>(null);
  const absentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setTracking(true);
    try { localStorage.setItem('geoTrackingActive', '1'); } catch {}
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
    if (breakTimerRef.current) {
      clearInterval(breakTimerRef.current);
      breakTimerRef.current = null;
    }
    setTracking(false);
    setStatus('idle');
    try { localStorage.removeItem('geoTrackingActive'); localStorage.setItem('geoStatus','idle'); localStorage.removeItem('geoPlace'); } catch {}
    setAbsentMinutes(0);
    setBreakRequested(false);
    setBreakRemaining(0);
  };

  const sendLocation = async (loc: GeoLocation) => {
    try {
      const res = await updateStudentLocation({
        ...loc,
        locationName: await (async () => {
          try {
            const places = await searchNearbyBuildings(loc.latitude, loc.longitude, 200);
<<<<<<< HEAD
            if (places && places.length > 0) return places[0].name || places[0].address || '';
=======
            if (places && places.length > 0) return places[0].name || places[0].address || 'Current location';
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
          } catch {}
          try {
            return await reverseGeocode(loc.latitude, loc.longitude);
          } catch {}
<<<<<<< HEAD
          return '';
=======
          return 'Current location';
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
        })(),
        courseId: selectedCourseId ?? undefined,
      });
      const { insideFence, message } = res.data;
      setStatus(insideFence ? 'inside' : 'outside');
      try { localStorage.setItem('geoStatus', insideFence ? 'inside' : 'outside'); localStorage.setItem('geoCoords', JSON.stringify(loc)); } catch {}

      // Attempt to resolve nearby building/place name using Google Maps
      (async () => {
        try {
          const places = await searchNearbyBuildings(loc.latitude, loc.longitude, 200);
          if (places && places.length > 0) {
            const label = places[0].name || places[0].address || 'Nearby';
            try { localStorage.setItem('geoPlace', label); } catch {}
            setGeoPlace(label);
            return;
          }
        } catch (e) {}
        try {
          const addr = await reverseGeocode(loc.latitude, loc.longitude);
          try { localStorage.setItem('geoPlace', addr); } catch {}
          setGeoPlace(addr);
        } catch (e) {
<<<<<<< HEAD
          const latlng = `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
          try { localStorage.setItem('geoPlace', latlng); } catch {}
          setGeoPlace(latlng);
=======
          try {
            const osm = await (await import('../../services/googleMaps')).reverseGeocodeOSM(loc.latitude, loc.longitude);
            try { localStorage.setItem('geoPlace', osm); } catch {}
            setGeoPlace(osm);
          } catch (ee) {
            // last resort: store lat,lng
            const latlng = `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
            try { localStorage.setItem('geoPlace', latlng); } catch {}
            setGeoPlace(latlng);
          }
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
        }
      })();

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

  const requestBreak = () => {
    setBreakRequested(true);
    setBreakRemaining(10); // 10 minutes
    setAlerts(prev => [
      '✅ Break request sent to staff. You have 10 minutes.',
      ...prev.slice(0, 3)
    ]);
    
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    breakTimerRef.current = setInterval(() => {
      setBreakRemaining(prev => {
        if (prev <= 1) {
          clearInterval(breakTimerRef.current!);
          setBreakRequested(false);
          setAlerts(a => [
            '⚠️ Your break time has expired. Return to class zone.',
            ...a.slice(0, 3)
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);
  };

  useEffect(() => () => stopTracking(), []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Live Location Monitor</h1>

      {/* Status Card */}
      <div className={`rounded-2xl p-6 mb-6 border-2 transition-all ${
        status === 'inside' ? 'bg-emerald-50 border-emerald-200' :
        status === 'outside' ? 'bg-red-50 border-red-200' :
        status === 'error' ? 'bg-amber-50 border-amber-200' :
        'bg-white border-slate-200'
      }`}>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
          <MapPin size={14} />
          <span>{geoPlace}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            status === 'inside' ? 'bg-emerald-100' :
            status === 'outside' ? 'bg-red-100' :
            'bg-slate-100'
          }`}>
            {status === 'inside' ? <CheckCircle size={28} className="text-emerald-600" /> :
             status === 'outside' ? <AlertTriangle size={28} className="text-red-600" /> :
             <MapPin size={28} className="text-slate-400" />}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">
              {status === 'idle' ? 'Not Tracking' :
               status === 'inside' ? 'Inside Class Zone ✓' :
               status === 'outside' ? 'Outside Class Zone ⚠' :
               'Location Error'}
            </p>
<<<<<<< HEAD
=======
            {location && (
              <p className="text-xs text-slate-500 mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {location.accuracy && ` · ±${Math.round(location.accuracy)}m`}
              </p>
            )}
>>>>>>> 2ff4898e648de7eafa85b9492fb899cc39d82065
            {status === 'outside' && absentMinutes > 0 && (
              <p className="text-sm text-red-600 font-semibold mt-1">
                Away for {absentMinutes} min{absentMinutes >= 10 ? ' — Marked Absent' : ''}
              </p>
            )}
            {breakRequested && (
              <p className="text-sm text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <Coffee size={14} /> Break active: {breakRemaining} min remaining
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
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-sm"
        >
          <Wifi size={16} /> Enable location for attendance
        </button>
        <button
          onClick={stopTracking}
          disabled={!tracking}
          className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
        >
          <WifiOff size={16} /> Stop
        </button>
        {tracking && status === 'outside' && !breakRequested && (
          <button
            onClick={requestBreak}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Coffee size={16} /> Request Break
          </button>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 text-amber-800 text-sm px-4 py-2.5 rounded-xl">
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 text-sm text-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-bold mb-1">How it works:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Your location is tracked during active class sessions</li>
              <li>If you leave the geo-fenced area for more than 10 minutes, you will be automatically marked absent</li>
              <li>You can request a 10-minute break when outside the zone</li>
              <li>Staff will be notified of your break request</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
