import { User, Mail, Phone, BookOpen, Hash, Shield } from 'lucide-react';
import { Staff } from '../../types';

export default function StaffProfile({ profile }: { profile: Staff | null }) {
  if (!profile) return <p className="text-slate-400">Loading profile...</p>;

  const fields = [
    { icon: <Hash size={16} />, label: 'Employee ID', value: profile.employeeId },
    { icon: <Mail size={16} />, label: 'Email', value: profile.email },
    { icon: <Phone size={16} />, label: 'Phone', value: profile.phone },
    { icon: <BookOpen size={16} />, label: 'Department', value: profile.department },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-indigo-600 font-medium flex items-center gap-1"><Shield size={12} /> Staff Member</p>
          </div>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                {f.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="text-sm font-semibold text-slate-800">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
