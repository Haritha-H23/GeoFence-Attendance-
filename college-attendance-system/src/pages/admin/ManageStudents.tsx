import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { getStudents, createStudent, updateStudent, deleteStudent, getCourses, enrollStudentInCourse } from '../../services/api';
import { Student, Course } from '../../types';

const emptyForm = { name: '', email: '', password: '', rollNumber: '', department: '', semester: '', section: '', phone: '' };

export default function ManageStudents({ onRefresh }: { onRefresh: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [enrollModal, setEnrollModal] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [s, c] = await Promise.all([getStudents(), getCourses()]);
    setStudents(s.data);
    setCourses(c.data);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: '', rollNumber: s.rollNumber, department: s.department, semester: s.semester, section: s.section ?? '', phone: s.phone });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editing) await updateStudent(editing.id, form);
      else await createStudent(form);
      setShowForm(false);
      await load();
      onRefresh();
    } catch { alert('Failed to save student.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this student?')) return;
    await deleteStudent(id);
    await load();
    onRefresh();
  };

  const handleEnroll = async (courseId: number) => {
    if (!enrollModal) return;
    try {
      await enrollStudentInCourse(courseId, enrollModal.id);
      const [s, c] = await Promise.all([getStudents(), getCourses()]);
      setStudents(s.data);
      setCourses(c.data);
      const updated = s.data.find((st: Student) => st.id === enrollModal.id);
      if (updated) setEnrollModal(updated);
    } catch (err: any) {
      alert(`Enroll failed: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);
    }
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Roll No</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Department</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Semester</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Section</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Courses</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-5 py-3 text-gray-600 font-mono text-xs">{s.rollNumber}</td>
                <td className="px-5 py-3 text-gray-600">{s.department}</td>
                <td className="px-5 py-3 text-gray-600">{s.semester}</td>
                <td className="px-5 py-3">
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-mono">{s.section || '-'}</span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setEnrollModal(s)} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition">
                    {s.enrolledCourses?.length ?? 0} courses
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400">No students found.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {([
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: editing ? 'New Password (leave blank to keep)' : 'Password', type: 'password' },
                { key: 'rollNumber', label: 'Roll Number', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'semester', label: 'Semester', type: 'text' },
                { key: 'section', label: 'Section (e.g. IT-A)', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
              ] as { key: keyof typeof form; label: string; type: string }[]).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={key === 'password' && editing ? '••••••••' : ''}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Enroll: {enrollModal.name}</h2>
              <button onClick={() => setEnrollModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {courses.map((c) => {
                const enrolled = enrollModal.enrolledCourses?.some((ec) => ec.id === c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.code}</p>
                    </div>
                    {enrolled ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-semibold">Enrolled</span>
                    ) : (
                      <button onClick={() => handleEnroll(c.id)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition">
                        Enroll
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
