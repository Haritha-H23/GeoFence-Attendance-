import { useState, useEffect } from 'react';
import { BookOpen, User, BarChart2, MapPin, ScanFace } from 'lucide-react';
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
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={18} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={18} /> },
  { id: 'courses', label: 'My Courses', icon: <BookOpen size={18} /> },
  { id: 'attendance', label: 'Attendance', icon: <BarChart2 size={18} /> },
  { id: 'location', label: 'Live Location', icon: <MapPin size={18} /> },
  { id: 'face', label: 'Face Registration', icon: <ScanFace size={18} /> },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedLocationCourseId, setSelectedLocationCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudentProfile(), getStudentAttendance()])
      .then(([profileRes, attendanceRes]) => {
        setProfile(profileRes.data);
        setAttendance(attendanceRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const totalCount = attendance.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        items={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="GeoAttend"
        subtitle="Student Portal"
      />

      <main className="flex-1 md:ml-0 pt-16 md:pt-0 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {profile?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {profile?.rollNumber} · {profile?.department} · Semester {profile?.semester}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Overall Attendance"
                value={`${attendancePct}%`}
                icon={<BarChart2 size={20} className="text-indigo-600" />}
                color="bg-indigo-50"
                subtitle={`${presentCount} / ${totalCount} classes`}
              />
              <StatCard
                title="Enrolled Courses"
                value={profile?.enrolledCourses?.length ?? 0}
                icon={<BookOpen size={20} className="text-green-600" />}
                color="bg-green-50"
              />
              <StatCard
                title="Present"
                value={presentCount}
                icon={<BarChart2 size={20} className="text-blue-600" />}
                color="bg-blue-50"
              />
              <StatCard
                title="Absent"
                value={totalCount - presentCount}
                icon={<BarChart2 size={20} className="text-red-600" />}
                color="bg-red-50"
              />
            </div>

            {/* Course-wise attendance summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Course-wise Attendance</h2>
              {profile?.enrolledCourses?.length === 0 ? (
                <p className="text-gray-400 text-sm">No courses enrolled yet.</p>
              ) : (
                <div className="space-y-4">
                  {profile?.enrolledCourses?.map((course) => {
                    const courseRecords = attendance.filter((a) => a.courseId === course.id);
                    const present = courseRecords.filter((a) => a.status === 'PRESENT').length;
                    const total = courseRecords.length;
                    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                    const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

                    return (
                      <div key={course.id} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">{course.name}</span>
                            <span className="text-sm font-bold text-gray-700">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{present}/{total} classes attended</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
      </main>
    </div>
  );
}
