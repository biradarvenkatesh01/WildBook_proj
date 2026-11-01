import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';
import { LightningIcon } from '../../components/Icons';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [targetPortal, setTargetPortal] = useState(null);
  const [targetPortalText, setTargetPortalText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setReviewNote('');
    setTargetPortal(null);
    setTargetPortalText('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/auth/admin/login', { email, password });
      login(res.user, res.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      const errData = err.data || {};
      
      // If admin is PENDING, save token and navigate to /admin/pending
      if (errData.status === 'PENDING' && errData.token) {
        login(errData.user, errData.token);
        navigate('/admin/pending', { replace: true });
        return;
      }

      setError(errData.error || err.message || 'Admin login failed.');
      if (errData.review_note) {
        setReviewNote(errData.review_note);
      }
      if (errData.targetPortal) {
        setTargetPortal(errData.targetPortal);
        setTargetPortalText(errData.linkText || 'Switch portal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-admin min-h-screen flex flex-col md:flex-row bg-[#F6F1E7]">
      {/* ── Left Hero Panel (Design 13) ────────────────────────────────────── */}
      <div className="relative md:w-5/12 lg:w-1/2 min-h-[320px] md:min-h-screen flex flex-col justify-between p-8 md:p-14 text-white overflow-hidden bg-[#162B1D]">
        {/* Background image & gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c12]/95 via-[#162B1D]/80 to-[#162B1D]/55" />

        {/* Top: Admin Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="inline-block">
            <Logo portal="admin" size={38} light />
          </Link>
        </div>

        {/* Center: Value Proposition */}
        <div className="relative z-10 my-auto py-10 max-w-md">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#F6F1E7] leading-tight mb-4">
            Manage your sanctuary, share it with the world
          </h2>

          <div className="w-12 h-[1px] bg-[#D9A441]/50 mb-6" />

          <p className="text-sm lg:text-base text-white/80 leading-relaxed">
            WildBook Admin gives you the tools to run your sanctuary, manage schedules, vehicle capacities, and grow responsible wildlife tourism.
          </p>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-white/40 tracking-wider">
          WildBook Sanctuary Operator Portal
        </div>
      </div>

      {/* ── Right Form Panel (Design 13) ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white border border-[#E5DAC6] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1F3D2B]/5">
          
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1F3D2B]/70 block mb-1">
              Admin Portal
            </span>
            <h1 className="text-3xl font-serif text-[#1F3D2B]">
              Welcome back
            </h1>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <svg className="w-4 h-4 text-red-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
              {reviewNote && (
                <p className="text-red-800 bg-red-100/70 p-2 rounded mt-1 italic">
                  Note from authority: &ldquo;{reviewNote}&rdquo;
                </p>
              )}
              {targetPortal && (
                <div className="pt-1">
                  <Link
                    to={targetPortal}
                    className="inline-flex items-center gap-1.5 font-bold text-[#1F3D2B] underline hover:text-[#D9A441]"
                  >
                    <span>{targetPortalText}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Demo Helper Card */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#F6F1E7]/90 border border-[#D5C9B5] text-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#1F3D2B]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
                <span>Demo Admin Accounts</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Password: Admin@123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.nagarhole@wildbook.com');
                  setPassword('Admin@123');
                  setError('');
                }}
                className="p-2.5 rounded-xl bg-white border border-[#D5C9B5] hover:border-[#1F3D2B] hover:shadow-xs text-left transition flex flex-col cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <LightningIcon className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span className="text-[11px] font-bold text-[#1F3D2B] group-hover:text-[#D9A441] transition">
                    Nagarhole Admin
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 truncate">
                  admin.nagarhole@wildbook.com
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin.bandipur@wildbook.com');
                  setPassword('Admin@123');
                  setError('');
                }}
                className="p-2.5 rounded-xl bg-white border border-[#D5C9B5] hover:border-[#1F3D2B] hover:shadow-xs text-left transition flex flex-col cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <LightningIcon className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span className="text-[11px] font-bold text-[#1F3D2B] group-hover:text-[#D9A441] transition">
                    Bandipur Admin
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 truncate">
                  admin.bandipur@wildbook.com
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1.5" htmlFor="admin-email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter administrator email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1F3D2B]" htmlFor="admin-password">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact the site authority at owner@wildbook.com to recover your admin account.'); }} className="text-xs text-[#D9A441] hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#1F3D2B] text-white font-medium text-sm hover:bg-[#162B1D] active:scale-[0.99] transition shadow-md shadow-[#1F3D2B]/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Log in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5DAC6]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs text-gray-600 mb-6">
            New sanctuary?{' '}
            <Link to="/admin/signup" className="text-[#D9A441] hover:underline font-semibold">
              Register your sanctuary
            </Link>
          </div>

          <div className="text-center text-[11px] text-gray-400 border-t border-gray-100 pt-4">
            Authorised sanctuary operators only
          </div>
        </div>
      </div>
    </div>
  );
}
