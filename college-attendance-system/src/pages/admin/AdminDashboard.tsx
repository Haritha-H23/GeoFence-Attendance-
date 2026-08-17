import { useState, useEffect } from 'react';
import { Users, BookOpen, UserCheck, BarChart2, MapPinned, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import GoogleMapSelector from '../../components/maps/GoogleMapSelector';
import ManageStudents from './ManageStudents';
import ManageStaff from './ManageStaff';
import ManageCourses from './ManageCourses';
import AcademicCalendar from '../../components/shared/AcademicCalendar';
import { uploadAcademicCalendarPdf, getAcademicCalendar } from '../../services/api';
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
  const [selectedCampus, setSelectedCampus] = useState<{ latitude: number; longitude: number; address: string } | null>(null);

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
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        items={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="GeoAttend"
        subtitle="Admin Portal"
      />

      <main className="flex-1 overflow-y-auto p-6 pt-16 md:pt-6">
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-blue-950 to-blue-700 p-6 text-white shadow-[0_20px_50px_rgba(30,64,175,0.22)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Operations overview</p>
                  <h1 className="text-3xl font-bold tracking-[-0.06em]">Admin intelligence dashboard</h1>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-blue-50">
                  <span className="live-pulse flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  System healthy
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard title="Total Students" value={counts.students} icon={<Users size={20} className="text-indigo-600" />} color="bg-indigo-50" trend={{ value: 12, label: 'this month' }} />
              <StatCard title="Total Staff" value={counts.staff} icon={<UserCheck size={20} className="text-emerald-600" />} color="bg-emerald-50" trend={{ value: 8, label: 'this month' }} />
              <StatCard title="Total Courses" value={counts.courses} icon={<BookOpen size={20} className="text-blue-600" />} color="bg-blue-50" trend={{ value: 5, label: 'new' }} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
              <div className="soft-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Academic Calendar & Day Order</h2>
                    <p className="mt-1 text-xs text-slate-500">Manage academic days (Day order 1–5). Persisted locally.</p>
                  </div>
                  <BarChart2 size={20} className="text-blue-500" />
                </div>
                <AcademicCalendar />
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2">Upload academic calendar (PDF)</h4>
                  <div className="flex items-center gap-3">
                    <input id="calendarPdf" type="file" accept="application/pdf" className="text-sm" />
                    <button onClick={async () => {
                      const el = document.getElementById('calendarPdf') as HTMLInputElement | null;
                      if (!el || !el.files || el.files.length === 0) return;
                      const f = el.files[0];
                      const fd = new FormData(); fd.append('file', f);
                      try {
                        const res = await uploadAcademicCalendarPdf(fd);
                        // refresh counts or calendar by notifying the page (simple reload)
                        await getAcademicCalendar();
                        alert('Calendar parsed and updated.');
                      } catch (e) { console.error(e); alert('Failed to upload PDF'); }
                    }} className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm">Upload & Parse</button>
                  </div>
                </div>
              </div>

              <div className="soft-card p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Location intelligence</h3>
                    <p className="mt-1 text-xs text-slate-500">Operational status</p>
                  </div>
                  <MapPinned size={18} className="text-blue-500" />
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Active geofences', value: '24' },
                    { label: 'Live attendance', value: '94.5%' },
                    { label: 'Verified checks', value: '1,287' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-base font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="soft-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Campus map intelligence</h2>
                  <p className="mt-1 text-xs text-slate-500">Search for any campus and view nearby locations inside it</p>
                </div>
                <MapPinned size={20} className="text-blue-500" />
              </div>

              <GoogleMapSelector
                onLocationSelect={(location) => setSelectedCampus(location)}
                initialLocation={selectedCampus ?? { latitude: 12.9716, longitude: 77.5946 }}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-2"
              />

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Live campus status</p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedCampus?.address || 'Campus location selected'}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {selectedCampus ? `${selectedCampus.latitude.toFixed(5)}, ${selectedCampus.longitude.toFixed(5)}` : 'Waiting for campus selection'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="live-pulse flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Campus active
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Manage Students', desc: 'Add, edit, enroll students', tab: 'students', icon: <Users size={24} className="text-indigo-600" /> },
                { label: 'Manage Staff', desc: 'Assign courses and profiles', tab: 'staff', icon: <UserCheck size={24} className="text-emerald-600" /> },
                { label: 'Manage Courses', desc: 'Create courses and schedules', tab: 'courses', icon: <BookOpen size={24} className="text-blue-600" /> },
              ].map((card) => (
                <button
                  key={card.tab}
                  onClick={() => setActiveTab(card.tab)}
                  className="group rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_38px_rgba(37,99,235,0.12)]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 group-hover:bg-blue-50">
                    {card.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{card.label}</h3>
                  <p className="text-sm text-slate-500">{card.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                    Open <ArrowUpRight size={16} />
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="font-semibold">Attendance compliance is strong</p>
                  <p className="text-sm text-emerald-700">94.5% of students were verified successfully this week.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && <ManageStudents onRefresh={fetchCounts} />}
        {activeTab === 'staff' && <ManageStaff onRefresh={fetchCounts} />}
        {activeTab === 'courses' && <ManageCourses onRefresh={fetchCounts} />}
      </main>
    </div>
  );
}
