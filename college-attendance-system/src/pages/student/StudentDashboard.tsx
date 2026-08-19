import { useState, useEffect } from 'react';
import { BookOpen, User, LayoutDashboard, MapPin, ScanFace, Coffee, Bell, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import StudentProfile from './StudentProfile';
import StudentCourses from './StudentCourses';
import StudentAttendance from './StudentAttendance';
import GeoFenceMonitor from './GeoFenceMonitor';
import FaceRegistration from './FaceRegistration';
import { getStudentProfile, getStudentAttendance } from '../../services/api';
import { Student, AttendanceRecord } from '../../types';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { id: 'attendance', label: 'Attendance', icon: <LayoutDashboard size={17} /> },
  { id: 'courses', label: 'My Courses', icon: <BookOpen size={17} /> },
  { id: 'location', label: 'Live Location', icon: <MapPin size={17} /> },
  { id: 'face', label: 'Face Registration', icon: <ScanFace size={17} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={17} /> },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedLocationCourseId, setSelectedLocationCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trackingActive, setTrackingActive] = useState(false);
  const [geoPlace, setGeoPlace] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getStudentProfile(), getStudentAttendance()])
      .then(([profileRes, attendanceRes]) => {
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const read = () => {
      try {
        setTrackingActive(localStorage.getItem('geoTrackingActive') === '1');
        setGeoPlace(localStorage.getItem('geoPlace'));
        setGeoStatus(localStorage.getItem('geoStatus'));
      } catch (e) { }
    };
    read();
    const iv = setInterval(read, 2000);
    return () => clearInterval(iv);
  }, []);

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const totalCount = attendance.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading your portal...</p>
      </div>
    </div>
  );

  const today = currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar items={navItems} activeTab={activeTab} onTabChange={setActiveTab} title="GeoAttend" subtitle="Student Portal" />

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="hidden items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-sm md:flex">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-900">
              {activeTab === 'dashboard' ? `Welcome, ${profile?.name?.split(' ')[0]} 👋` :
               activeTab === 'attendance' ? 'Attendance Records' :
               activeTab === 'courses' ? 'My Courses' :
               activeTab === 'location' ? 'Live Location' :
               activeTab === 'face' ? 'Face Registration' : 'My Profile'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{today}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 tabular-nums">{time}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">IST</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-950 to-blue-700 p-6 text-white shadow-[0_20px_40px_rgba(30,64,175,0.28)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Geo Attendance</p>
                    <h1 className="text-3xl font-bold tracking-[-0.06em]">Hello, {profile?.name?.split(' ')[0] || 'Student'}.</h1>
                  </div>
                  {trackingActive ? (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-50">
                      <span className="live-pulse flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      Live attendance active
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-50 opacity-60">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-slate-300" />
                      Not tracking
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="Attendance" value={`${attendancePct}%`} icon={<TrendingUp size={20} className="text-blue-600" />} color="bg-blue-50" subtitle={`${presentCount} / ${totalCount} classes`} />
                <StatCard title="Courses" value={profile?.enrolledCourses?.length ?? 0} icon={<BookOpen size={20} className="text-emerald-600" />} color="bg-emerald-50" />
                <StatCard title="Present" value={presentCount} icon={<CheckCircle2 size={20} className="text-cyan-600" />} color="bg-cyan-50" />
                <StatCard title="Absent" value={totalCount - presentCount} icon={<Bell size={20} className="text-red-600" />} color="bg-red-50" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
                <div className="soft-card p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Course-wise Attendance</h2>
                      <p className="mt-1 text-xs text-slate-500">Performance across enrolled subjects</p>
                    </div>
                    <BookOpen size={20} className="text-slate-300" />
                  </div>
                  {profile?.enrolledCourses?.length === 0 ? (
                    <div className="py-10 text-center">
                      <BookOpen size={36} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm text-slate-400">No courses enrolled yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {profile?.enrolledCourses?.map((course) => {
                        const courseRecords = attendance.filter((a) => a.courseId === course.id);
                        const present = courseRecords.filter((a) => a.status === 'PRESENT').length;
                        const total = courseRecords.length;
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

                        return (
                          <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-800">{course.name}</span>
                              <span className="text-sm font-bold text-slate-700">{pct}%</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">{present}/{total} attended</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="soft-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Live GeoFence</h3>
                      <p className="text-xs text-slate-500">Campus status summary</p>
                    </div>
                    <MapPin size={18} className="text-blue-500" />
                  </div>
                  <div className="map-grid relative flex h-52 items-center justify-center overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-50">
                    <div className="absolute h-32 w-32 rounded-full border border-blue-400/40" />
                    <div className="absolute h-20 w-20 rounded-full border border-blue-300/50" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                      <MapPin size={18} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl px-3 py-2 text-sm">
                    <span className="font-semibold">{geoPlace ? geoPlace : (trackingActive ? 'Campus location' : 'Campus status')}</span>
                    <span className={`flex h-2.5 w-2.5 rounded-full ${geoStatus === 'inside' ? 'bg-emerald-500 animate-pulse' : geoStatus === 'outside' ? 'bg-red-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Coffee size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Break Request Feature</p>
                    <p className="mt-2 text-sm text-indigo-100">
                      You can request a break during live sessions. Staff can grant up to 20-minute breaks. If you're away without a break for 10+ minutes, you'll be marked absent.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && <StudentProfile profile={profile} />}
          {activeTab === 'courses' && (
            <StudentCourses
              courses={profile?.enrolledCourses ?? []}
              onEnableLocation={(courseId) => {
                setSelectedLocationCourseId(courseId);
                setActiveTab('location');
              }}
            />
          )}
          {activeTab === 'attendance' && <StudentAttendance attendance={attendance} courses={profile?.enrolledCourses ?? []} />}
          {activeTab === 'location' && <GeoFenceMonitor selectedCourseId={selectedLocationCourseId} />}
          {activeTab === 'face' && <FaceRegistration />}
        </div>
      </main>
    </div>
  );
}
