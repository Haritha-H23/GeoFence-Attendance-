import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { AttendanceRecord, Course } from '../../types';

interface Props {
  attendance: AttendanceRecord[];
  courses: Course[];
}

const statusConfig = {
  PRESENT: { icon: <CheckCircle size={16} />, color: 'text-green-600', bg: 'bg-green-50', label: 'Present' },
  ABSENT: { icon: <XCircle size={16} />, color: 'text-red-600', bg: 'bg-red-50', label: 'Absent' },
  LATE: { icon: <Clock size={16} />, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Late' },
};

export default function StudentAttendance({ attendance, courses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const filtered = selectedCourse === 'all'
    ? attendance
    : attendance.filter((a) => String(a.courseId) === selectedCourse);

  const present = filtered.filter((a) => a.status === 'PRESENT').length;
  const pct = filtered.length > 0 ? Math.round((present / filtered.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-400">Attendance</p>
          <p className="text-2xl font-bold text-gray-900">{pct}%</p>
        </div>
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-sm text-gray-500">{present}/{filtered.length} classes</div>
        {pct < 75 && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-xl">
            ⚠ Below 75%
          </div>
        )}
      </div>

      {/* Records table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No attendance records found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Course</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((record) => {
                const s = statusConfig[record.status];
                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-700">{record.date}</td>
                    <td className="px-5 py-3 text-gray-700">{record.courseName}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${s.bg} ${s.color}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${record.geoVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          📍 Geo
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${record.faceVerified ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          👤 Face
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
