import { useState } from 'react';
import { BookOpen, Clock, Play, Pencil, MapPin, Plus, X } from 'lucide-react';
import { Course, CourseSchedule } from '../../types';
import { updateCourse } from '../../services/api';

interface Props {
  courses: Course[];
  onStartAttendance: (course: Course) => void;
  onRefresh?: () => void;
}

const TIME_SLOTS = [
  '08:15 - 09:15',
  '09:15 - 10:15',
  '10:45 - 11:45',
  '11:45 - 12:45',
  '13:45 - 14:45',
];

const emptySlot = (): CourseSchedule => ({ dayOrder: 1, timeSlot: TIME_SLOTS[0], venue: '' });

export default function StaffCourses({ courses, onStartAttendance, onRefresh }: Props) {
  const [editModal, setEditModal] = useState<Course | null>(null);
  const [editSchedules, setEditSchedules] = useState<CourseSchedule[]>([]);
  const [saving, setSaving] = useState(false);

  const openEdit = (course: Course) => {
    setEditModal(course);
    setEditSchedules(course.schedules?.length ? [...course.schedules] : [emptySlot()]);
  };

  const updateRow = (i: number, field: keyof CourseSchedule, value: string | number) =>
    setEditSchedules((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await updateCourse(editModal.id, {
        name: editModal.name,
        code: editModal.code,
        department: editModal.department,
        semester: editModal.semester,
        schedules: editSchedules,
        staffId: editModal.staffId ?? null,
      });
      setEditModal(null);
      onRefresh?.();
    } catch { alert('Failed to save schedule.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No courses assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BookOpen size={18} className="text-indigo-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{course.code}</span>
                  <button
                    onClick={() => openEdit(course)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit schedule & venue"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{course.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{course.department}</p>

              {/* Schedule slots */}
              {course.schedules?.length > 0 ? (
                <div className="space-y-1.5 mb-4">
                  {course.schedules.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-indigo-50 rounded-lg px-3 py-1.5">
                      <Clock size={11} className="text-indigo-400 shrink-0" />
                      <span className="font-semibold text-indigo-700">Day {s.dayOrder}</span>
                      <span className="text-indigo-600">{s.timeSlot}</span>
                      {s.venue && (
                        <>
                          <span className="text-indigo-300">·</span>
                          <MapPin size={11} className="text-indigo-400 shrink-0" />
                          <span className="text-indigo-600">{s.venue}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">No schedule set</p>
              )}

              <button
                onClick={() => onStartAttendance(course)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
              >
                <Play size={14} /> Start Attendance
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule & Venue Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl my-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Schedule & Venue</h2>
                <p className="text-xs text-gray-500 mt-0.5">{editModal.name} · {editModal.code}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-1 mb-3">
              <div className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-2 text-xs font-semibold text-gray-400">
                <span>Day Order</span><span>Time Slot</span><span>Venue</span><span />
              </div>
              <div className="space-y-1.5">
                {editSchedules.map((row, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100 items-center">
                    <select
                      value={row.dayOrder}
                      onChange={(e) => updateRow(i, 'dayOrder', Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1,2,3,4,5].map((d) => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                    <select
                      value={row.timeSlot}
                      onChange={(e) => updateRow(i, 'timeSlot', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      value={row.venue}
                      onChange={(e) => updateRow(i, 'venue', e.target.value)}
                      placeholder="e.g. Lab 3"
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
              onClick={() => setEditSchedules((prev) => [...prev, emptySlot()])}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mb-5"
            >
              <Plus size={12} /> Add Slot
            </button>

            <p className="text-xs text-gray-400 mb-4">Break: 10:15–10:45 · Lunch: 12:45–13:45</p>

            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
