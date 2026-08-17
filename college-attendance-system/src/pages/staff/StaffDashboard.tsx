import { useState, useEffect } from 'react';
import { User, BookOpen, Camera, MapPin, LayoutDashboard, Bell, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import StaffProfile from './StaffProfile';
import StaffCourses from './StaffCourses';
import AttendanceSession from './AttendanceSession';
import { getStaffProfile, getStaffCourses } from '../../services/api';
import { Staff, Course } from '../../types';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { id: 'attendance', label: 'Take Attendance', icon: <Camera size={17} /> },
  { id: 'courses', label: 'My Courses', icon: <BookOpen size={17} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={17} /> },
];

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Staff | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    Promise.all([getStaffProfile(), getStaffCourses()])
      .then(([p, c]) => { setProfile(p.data); setCourses(c.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleStartAttendance = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('attendance');
  };

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
      <Sidebar items={navItems} activeTab={activeTab} onTabChange={setActiveTab} title="GeoAttend" subtitle="Staff Portal" />

      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="hidden items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-sm md:flex">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-900">
              {activeTab === 'dashboard' ? `Welcome, ${profile?.name?.split(' ')[0]} 👋` :
               activeTab === 'attendance' ? 'Take Attendance' :
               activeTab === 'courses' ? 'My Courses' : 'My Profile'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{today}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 tabular-nums">{time}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">IST</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-400 font-bold text-white">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-700 p-6 text-white shadow-[0_20px_40px_rgba(59,130,246,0.25)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Operations Center</p>
                    <h1 className="text-3xl font-bold tracking-[-0.06em]">Attendance monitoring</h1>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-50">
                    <span className="live-pulse flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Live session tracking
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Assigned Courses" value={courses.length} icon={<BookOpen size={20} className="text-indigo-600" />} color="bg-indigo-50" subtitle="Active this term" />
                <StatCard title="Department" value={profile?.department ?? '—'} icon={<User size={20} className="text-violet-600" />} color="bg-violet-50" />
                <StatCard title="Employee ID" value={profile?.employeeId ?? '—'} icon={<MapPin size={20} className="text-emerald-600" />} color="bg-emerald-50" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <div className="soft-card p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Quick Start Attendance</h2>
                      <p className="mt-1 text-xs text-slate-500">Choose a course to begin a session</p>
                    </div>
                    <Camera size={20} className="text-slate-400" />
                  </div>
                  {courses.length === 0 ? (
                    <div className="py-10 text-center">
                      <BookOpen size={36} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm text-slate-400">No courses assigned yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{course.name}</p>
                              <p className="text-[11px] text-slate-500">{course.code}</p>
                            </div>
                          </div>
                          <button onClick={() => handleStartAttendance(course)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700">
                            Start
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="soft-card p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Session Health</h3>
                    <TrendingUp size={18} className="text-blue-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Verification ready</span>
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">GPS status stable</span>
                        <MapPin size={18} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4 text-amber-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Break controls active</span>
                        <Bell size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Break Management Active</p>
                    <p className="mt-2 text-sm text-indigo-100">
                      You can grant students a 10-minute break during live sessions. Students away without a break will trigger an alert automatically.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <AttendanceSession courses={courses} preSelectedCourse={selectedCourse} />
          )}
          {activeTab === 'courses' && (
            <StaffCourses courses={courses} onStartAttendance={handleStartAttendance}
              onRefresh={() => getStaffCourses().then(r => setCourses(r.data))} />
          )}
          {activeTab === 'profile' && <StaffProfile profile={profile} />}
        </div>
      </main>
    </div>
  );
}
