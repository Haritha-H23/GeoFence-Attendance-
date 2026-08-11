import { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart2, Settings } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import ManageStudents from './ManageStudents';
import ManageStaff from './ManageStaff';
import ManageCourses from './ManageCourses';
import { getStudents, getStaffs, getCourses } from '../../services/api';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={18} /> },
  { id: 'students', label: 'Students', icon: <Users size={18} /> },
  { id: 'staff', label: 'Staff', icon: <UserCheck size={18} /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen size={18} /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [counts, setCounts] = useState({ students: 0, staff: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const [s, st, c] = await Promise.all([getStudents(), getStaffs(), getCourses()]);
      setCounts({ students: s.data.length, staff: st.data.length, courses: c.data.length });
    } catch (e: any) {
      console.error('fetchCounts failed:', e.response?.status, e.response?.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCounts(); }, []);

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
        subtitle="Admin Portal"
      />

      <main className="flex-1 md:ml-0 pt-16 md:pt-0 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Manage students, staff, and courses</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Students"
                value={counts.students}
                icon={<Users size={20} className="text-indigo-600" />}
                color="bg-indigo-50"
              />
              <StatCard
                title="Total Staff"
                value={counts.staff}
                icon={<UserCheck size={20} className="text-green-600" />}
                color="bg-green-50"
              />
              <StatCard
                title="Total Courses"
                value={counts.courses}
                icon={<BookOpen size={20} className="text-blue-600" />}
                color="bg-blue-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Manage Students', desc: 'Add, edit, enroll students', tab: 'students', icon: <Users size={24} className="text-indigo-600" /> },
                { label: 'Manage Staff', desc: 'Add, edit, assign courses to staff', tab: 'staff', icon: <UserCheck size={24} className="text-green-600" /> },
                { label: 'Manage Courses', desc: 'Create courses, assign staff', tab: 'courses', icon: <BookOpen size={24} className="text-blue-600" /> },
              ].map((card) => (
                <button
                  key={card.tab}
                  onClick={() => setActiveTab(card.tab)}
                  className="bg-white rounded-2xl border border-gray-100 p-6 text-left hover:shadow-md transition hover:border-indigo-200"
                >
                  <div className="mb-3">{card.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{card.label}</h3>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && <ManageStudents onRefresh={fetchCounts} />}
        {activeTab === 'staff' && <ManageStaff onRefresh={fetchCounts} />}
        {activeTab === 'courses' && <ManageCourses onRefresh={fetchCounts} />}
      </main>
    </div>
  );
}
