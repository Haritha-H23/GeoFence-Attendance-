import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search, UserCheck, Clock, MapPin, ChevronDown } from 'lucide-react';
import { getCourses, createCourse, updateCourse, deleteCourse, getStaffs, assignCourseToStaff } from '../../services/api';
import { Course, Staff, CourseSchedule } from '../../types';

// Valid time slots: 8:15–2:45, 1hr each, excluding 10:15–10:45 break and 12:45–1:45 lunch
const TIME_SLOTS = [
  '08:15 - 09:15',
  '09:15 - 10:15',
  '10:45 - 11:45',
  '11:45 - 12:45',
  '13:45 - 14:45',
];

const DAY_ORDERS = [1, 2, 3, 4, 5];

const emptyBasicForm = { name: '', code: '', department: '', semester: '' };
const emptySchedule = (): CourseSchedule => ({ dayOrder: 1, timeSlot: TIME_SLOTS[0], venue: '' });

export default function ManageCourses({ onRefresh }: { onRefresh: () => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allStaffs, setAllStaffs] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [basicForm, setBasicForm] = useState(emptyBasicForm);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([emptySchedule()]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [scheduleEditModal, setScheduleEditModal] = useState<Course | null>(null);
  const [editSchedules, setEditSchedules] = useState<CourseSchedule[]>([]);

  const load = async () => {
    const [c, s] = await Promise.all([getCourses(), getStaffs()]);
    setCourses(c.data);
    setAllStaffs(s.data);
  };

  useEffect(() => { load(); }, []);

  // Staff filtered by selected department
  const deptStaffs = allStaffs.filter(
    (s) => !basicForm.department || s.department.toLowerCase() === basicForm.department.toLowerCase()
  );

  const openAdd = () => {
    setEditing(null);
    setBasicForm(emptyBasicForm);
    setSchedules([emptySchedule()]);
    setSelectedStaffId('');
    setShowForm(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setBasicForm({ name: c.name, code: c.code, department: c.department, semester: c.semester });
    setSchedules(c.schedules?.length ? c.schedules : [emptySchedule()]);
    setSelectedStaffId(c.staffId ?? '');
    setShowForm(true);
  };

  const addScheduleRow = () => setSchedules((prev) => [...prev, emptySchedule()]);
  const removeScheduleRow = (i: number) => setSchedules((prev) => prev.filter((_, idx) => idx !== i));
  const updateScheduleRow = (i: number, field: keyof CourseSchedule, value: string | number) =>
    setSchedules((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = async () => {
    if (!basicForm.name || !basicForm.code || !basicForm.department) {
      alert('Name, code and department are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...basicForm, schedules, staffId: selectedStaffId || null };
      if (editing) await updateCourse(editing.id, payload);
      else await createCourse(payload);
      setShowForm(false);
      await load();
      onRefresh();
    } catch { alert('Failed to save course.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course?')) return;
    await deleteCourse(id);
    await load();
    onRefresh();
  };

  // Inline schedule edit (staff can also use this)
  const openScheduleEdit = (c: Course) => {
    setScheduleEditModal(c);
    setEditSchedules(c.schedules?.length ? [...c.schedules] : [emptySchedule()]);
  };

  const saveScheduleEdit = async () => {
    if (!scheduleEditModal) return;
    await updateCourse(scheduleEditModal.id, {
      name: scheduleEditModal.name,
      code: scheduleEditModal.code,
      department: scheduleEditModal.department,
      semester: scheduleEditModal.semester,
      schedules: editSchedules,
      staffId: scheduleEditModal.staffId ?? null,
    });
    setScheduleEditModal(null);
    await load();
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Course</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Dept / Sem</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Staff</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Schedule</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-gray-600">{c.code}</td>
                <td className="px-5 py-3 text-gray-600 text-xs">{c.department}{c.semester ? ` · Sem ${c.semester}` : ''}</td>
                <td className="px-5 py-3">
                  {c.staffName
                    ? <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">{c.staffName}</span>
                    : <span className="text-xs text-gray-400">Unassigned</span>}
                </td>
                <td className="px-5 py-3">
                  {c.schedules?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {c.schedules.map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          D{s.dayOrder} · {s.timeSlot}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No schedule</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit course">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openScheduleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit schedule & venue">
                      <Clock size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-12 text-center text-gray-400">No courses found.</div>}
      </div>

      {/* Add / Edit Course Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl my-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: 'name', label: 'Course Name', full: true },
                { key: 'code', label: 'Course Code' },
                { key: 'department', label: 'Department' },
                { key: 'semester', label: 'Semester' },
              ].map(({ key, label, full }) => (
                <div key={key} className={full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    value={(basicForm as any)[key]}
                    onChange={(e) => setBasicForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* Staff assignment — filtered by dept */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Assign Staff {basicForm.department && <span className="text-indigo-500">({basicForm.department} dept)</span>}
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">-- Select Staff --</option>
                  {deptStaffs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.employeeId})</option>
                  ))}
                  {deptStaffs.length === 0 && basicForm.department && (
                    <option disabled>No staff in this department</option>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Schedule builder */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Weekly Schedule</label>
                <button onClick={addScheduleRow} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                  <Plus size={12} /> Add Slot
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-1">
                {/* Header */}
                <div className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-2 text-xs font-semibold text-gray-400">
                  <span>Day Order</span><span>Time Slot</span><span>Venue</span><span />
                </div>
                <div className="space-y-1.5">
                  {schedules.map((row, i) => (
                    <div key={i} className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 items-center">
                      <select
                        value={row.dayOrder}
                        onChange={(e) => updateScheduleRow(i, 'dayOrder', Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {DAY_ORDERS.map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <select
                        value={row.timeSlot}
                        onChange={(e) => updateScheduleRow(i, 'timeSlot', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        value={row.venue}
                        onChange={(e) => updateScheduleRow(i, 'venue', e.target.value)}
                        placeholder="e.g. Lab 3, Room 201"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeScheduleRow(i)}
                        disabled={schedules.length === 1}
                        className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Break: 10:15–10:45 · Lunch: 12:45–13:45 (excluded from slots)
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {loading ? 'Saving...' : 'Save Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule & Venue Edit Modal (standalone — staff can also use) */}
      {scheduleEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl my-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Schedule & Venue</h2>
                <p className="text-xs text-gray-500 mt-0.5">{scheduleEditModal.name} · {scheduleEditModal.code}</p>
              </div>
              <button onClick={() => setScheduleEditModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-1 mb-4">
              <div className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-2 text-xs font-semibold text-gray-400">
                <span>Day Order</span><span>Time Slot</span><span>Venue</span><span />
              </div>
              <div className="space-y-1.5">
                {editSchedules.map((row, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 items-center">
                    <select
                      value={row.dayOrder}
                      onChange={(e) => setEditSchedules((prev) => prev.map((s, idx) => idx === i ? { ...s, dayOrder: Number(e.target.value) } : s))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DAY_ORDERS.map((d) => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                    <select
                      value={row.timeSlot}
                      onChange={(e) => setEditSchedules((prev) => prev.map((s, idx) => idx === i ? { ...s, timeSlot: e.target.value } : s))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      value={row.venue}
                      onChange={(e) => setEditSchedules((prev) => prev.map((s, idx) => idx === i ? { ...s, venue: e.target.value } : s))}
                      placeholder="Venue"
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => setEditSchedules((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={editSchedules.length === 1}
                      className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setEditSchedules((prev) => [...prev, emptySchedule()])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mb-5"
            >
              <Plus size={12} /> Add Slot
            </button>

            <div className="flex gap-3">
              <button onClick={() => setScheduleEditModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={saveScheduleEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
