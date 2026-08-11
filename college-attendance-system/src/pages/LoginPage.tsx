import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, MapPin, Scan } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { user, token } = res.data;
      if (!user || !token) throw new Error('Invalid login response from server.');
      login(user, token);
      navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'STAFF' ? '/staff' : '/student');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none">SKCET</p>
              <p className="text-indigo-200 text-xs">Sri Krishna College of Engineering</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Smart Attendance<br />Management System
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed">
            AI-powered geo-fenced attendance with face recognition for accurate, automated tracking.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: <MapPin size={18} />, title: 'Geo-Fenced Zones', desc: 'Campus-aware location tracking' },
            { icon: <Scan size={18} />, title: 'Face Recognition', desc: 'AI-powered identity verification' },
            { icon: <Shield size={18} />, title: 'Real-time Alerts', desc: 'Instant absence notifications' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-indigo-200 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg mb-3">
              <Shield size={26} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SKCET Attendance</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your portal</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-6 flex items-start gap-2">
                <span className="mt-0.5">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@skcet.ac.in"
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                ) : (
                  <><LogIn size={16} /> Sign In</>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-4">Role-based access portal</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'Student', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { role: 'Staff', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { role: 'Admin', color: 'bg-violet-50 text-violet-700 border-violet-100' },
                ].map((r) => (
                  <div key={r.role} className={`text-center text-xs font-semibold px-3 py-2 rounded-xl border ${r.color}`}>
                    {r.role}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2024 SKCET · Smart Attendance System
          </p>
        </div>
      </div>
    </div>
  );
}
