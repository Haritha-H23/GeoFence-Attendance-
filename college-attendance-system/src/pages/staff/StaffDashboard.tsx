import { useState, useEffect } from 'react';
import { User, BookOpen, Camera, MapPin, LayoutDashboard, Bell } from 'lucide-react';
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
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading your portal...</p>
      </div>
    </div>
  );

  const today = currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={navItems} activeTab={activeTab} onTabChange={setActiveTab} title="SKCET" subtitle="Staff Portal" />

      <main className="flex-1 md:ml-0 pt-16 md:pt-0 overflow-y-auto">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg capitalize">
              {activeTab === 'dashboard' ? `Welcome, ${profile?.name?.split(' ')[0]} 👋` :
               activeTab === 'attendance' ? 'Take Attendance' :
               activeTab === 'courses' ? 'My Courses' : 'My Profile'}
            </h2>
            <p className="text-xs text-slate-400">{today}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 tabular-nums">{time}</p>
              <p className="text-xs text-slate-400">IST</p>
            </div>
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-sm">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard title="Assigned Courses" value={courses.length}
                  icon={<BookOpen size={20} className="text-indigo-600" />} color="bg-indigo-50" />
                <StatCard title="Department" value={profile?.department ?? '—'}
                  icon={<User size={20} className="text-violet-600" />} color="bg-violet-50" />
                <StatCard title="Employee ID" value={profile?.employeeId ?? '—'}
                  icon={<MapPin size={20} className="text-emerald-600" />} color="bg-emerald-50" />
              </div>

              {/* Quick start */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-slate-900">Quick Start Attendance</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Select a course to begin a session</p>
                  </div>
                  <Camera size={20} className="text-slate-300" />
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen size={36} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No courses assigned yet.</p>
                    <p className="text-slate-300 text-xs mt-1">Contact admin to assign courses.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courses.map((course) => (
                      <div key={course.id}
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center transition-colors">
                            <BookOpen size={16} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{course.name}</p>
                            <p className="text-xs text-slate-400">{course.code} · {course.department}</p>
                          </div>
                        </div>
                        <button onClick={() => handleStartAttendance(course)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm shadow-indigo-200">
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="font-bold mb-1">Break Management Active</p>
                    <p className="text-indigo-200 text-sm">
                      You can grant students a 10-minute break during live sessions. Students away without a break will trigger an alert automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
