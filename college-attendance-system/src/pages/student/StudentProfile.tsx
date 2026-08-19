import { User, Mail, Phone, BookOpen, Hash } from 'lucide-react';
import { Student } from '../../types';

export default function StudentProfile({ profile }: { profile: Student | null }) {
  if (!profile) return <p className="text-gray-400">Loading profile...</p>;

  const fields = [
    { icon: <Hash size={16} />, label: 'Roll Number', value: profile.rollNumber },
    { icon: <Mail size={16} />, label: 'Email', value: profile.email },
    { icon: <Phone size={16} />, label: 'Phone', value: profile.phone },
    { icon: <BookOpen size={16} />, label: 'Department', value: profile.department },
    { icon: <User size={16} />, label: 'Semester', value: `Semester ${profile.semester}` },
    { icon: <Hash size={16} />, label: 'Section', value: profile.section || '-' },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 text-2xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-indigo-600 font-medium">Student</p>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                {f.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400">{f.label}</p>
                <p className="text-sm font-semibold text-gray-800">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
