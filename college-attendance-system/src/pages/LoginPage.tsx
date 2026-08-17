import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles, CheckCircle2, UserPlus, MapPin, ScanLine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../services/api';

type AuthMode = 'login' | 'register';

export default function LoginPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerApi({ name, email, password, role });
      const { user, token } = res.data;
      if (!user || !token) throw new Error('Invalid registration response from server.');
      login(user, token);
      navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'STAFF' ? '/staff' : '/student');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const featureList = [
    'GPS Verification',
    'Face Recognition',
    'Real-time Monitoring',
    'Cloud Attendance Reports',
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#172554_30%,#1d4ed8_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">GeoAttend</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-blue-100/80">Smart Geo Intelligence</p>
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-sm text-4xl font-extrabold leading-tight tracking-[-0.06em]"
            >
              Smart Geo-Fenced Attendance
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-4 max-w-md text-base text-blue-100/80"
            >
              Secure attendance intelligence with live location checks, verification, and automated monitoring.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative z-10 space-y-4"
          >
            {featureList.map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm font-medium text-blue-50">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-200">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">GeoAttend</h1>
              <p className="text-sm text-slate-500">Smart Attendance Intelligence</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Register
                </button>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2 text-blue-600">
                  {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">{mode === 'login' ? 'Welcome back' : 'Create account'}</span>
                </div>
                <h2 className="text-3xl font-bold tracking-[-0.06em] text-slate-900">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>
                <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Access your attendance workspace' : 'Set up your secure geo attendance profile'}</p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 text-base">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.25)] transition hover:brightness-105 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                      {mode === 'login' ? 'Login' : 'Create account'}
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  {mode === 'login' ? 'Register' : 'Login'}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
