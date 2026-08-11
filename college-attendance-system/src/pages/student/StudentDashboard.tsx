import { useState, useEffect } from 'react';
import { BookOpen, User, LayoutDashboard, MapPin, ScanFace, Coffee, Bell } from 'lucide-react';
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

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const totalCount = attendance.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

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
      <Sidebar items={navItems} activeTab={activeTab} onTabChange={setActiveTab} title="SKCET" subtitle="Student Portal" />

      <main className="flex-1 md:ml-0 pt-16 md:pt-0 overflow-y-auto">
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg capitalize">
              {activeTab === 'dashboard' ? `Welcome, ${profile?.name?.split(' ')[0]} 👋` :
               activeTab === 'attendance' ? 'Attendance Records' :
               activeTab === 'courses' ? 'My Courses' :
               activeTab === 'location' ? 'Live Location' :
               activeTab === 'face' ? 'Face Registration' : 'My Profile'}
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Overall Attendance" value={`${attendancePct}%`}
                  icon={<LayoutDashboard size={20} className="text-indigo-600" />} color="bg-indigo-50"
                  subtitle={`${presentCount} / ${totalCount} classes`} />
                <StatCard title="Enrolled Courses" value={profile?.enrolledCourses?.length ?? 0}
                  icon={<BookOpen size={20} className="text-emerald-600" />} color="bg-emerald-50" />
                <StatCard title="Present" value={presentCount}
                  icon={<LayoutDashboard size={20} className="text-blue-600" />} color="bg-blue-50" />
                <StatCard title="Absent" value={totalCount - presentCount}
                  icon={<LayoutDashboard size={20} className="text-red-600" />} color="bg-red-50" />
              </div>

              {/* Course-wise attendance */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-slate-900">Course-wise Attendance</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Your attendance percentage per course</p>
                  </div>
                  <BookOpen size={20} className="text-slate-300" />
                </div>
                {profile?.enrolledCourses?.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen size={36} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No courses enrolled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile?.enrolledCourses?.map((course) => {
                      const courseRecords = attendance.filter((a) => a.courseId === course.id);
                      const present = courseRecords.filter((a) => a.status === 'PRESENT').length;
                      const total = courseRecords.length;
                      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                      const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

                      return (
                        <div key={course.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-slate-800">{course.name}</span>
                              <span className="text-sm font-bold text-slate-700">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{present}/{total} classes attended</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Coffee size={18} />
                  </div>
                  <div>
                    <p className="font-bold mb-1">Break Request Feature</p>
                    <p className="text-indigo-200 text-sm">
                      You can request a break during live sessions. Staff can grant up to 20-minute breaks. If you're away without a break for 10+ minutes, you'll be marked absent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
