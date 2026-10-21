import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';

export default function VisitorLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetPortal, setTargetPortal] = useState(null);
  const [targetPortalText, setTargetPortalText] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTargetPortal(null);
    setTargetPortalText('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/auth/user/login', { email, password });
      login(res.user, res.token);
      navigate(from, { replace: true });
    } catch (err) {
      const errData = err.data || {};
      setError(errData.error || err.message || 'Failed to log in');
      if (errData.targetPortal) {
        setTargetPortal(errData.targetPortal);
        setTargetPortalText(errData.linkText || 'Switch portal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-user min-h-screen flex flex-col md:flex-row bg-[#F6F1E7]">
      {/* ── Left Hero Panel (Design 02) ────────────────────────────────────── */}
      <div className="relative md:w-5/12 lg:w-1/2 min-h-[320px] md:min-h-screen flex flex-col justify-between p-8 md:p-14 text-white overflow-hidden bg-[#162B1D]">
        {/* Background Image & Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101F15]/95 via-[#162B1D]/75 to-[#162B1D]/50" />

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo portal="user" size={38} light />
          </Link>
        </div>

        {/* Center: Quote & Brand Typography */}
        <div className="relative z-10 my-auto py-12 max-w-md">
          <div className="w-16 h-16 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.5">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.5 8.4V22l3.3-1.8C10.6 20.3 11.3 20.4 12 20.4c5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-serif text-[#F6F1E7] tracking-wider mb-2 uppercase">
            WildBook
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-[#D9A441] font-semibold mb-8">
            Wildlife Sanctuary & Safari Bookings
          </p>

          <div className="w-12 h-[1px] bg-[#D9A441]/40 mb-6" />

          <p className="text-lg lg:text-xl font-serif italic text-white/90 leading-relaxed mb-3">
            &ldquo;In every walk with nature, one receives far more than he seeks.&rdquo;
          </p>
          <span className="text-xs uppercase tracking-widest text-[#D9A441] font-medium">
            — John Muir
          </span>
        </div>

        {/* Bottom footer credit */}
        <div className="relative z-10 text-xs text-white/50 tracking-wider">
          © {new Date().getFullYear()} WildBook Conservation Platform
        </div>
      </div>

      {/* ── Right Form Panel (Design 02) ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-[#E5DAC6] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1F3D2B]/5">
          
          {/* Header Label */}
          <div className="flex items-center gap-1.5 justify-center mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1F3D2B">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1F3D2B]">
              Welcome Back
            </span>
          </div>

          <h1 className="text-3xl font-serif text-center text-[#1F3D2B] mb-2">
            Welcome back, <span className="italic font-normal">Explorer</span>
          </h1>
          <p className="text-xs text-center text-[#555] mb-8">
            Log in to continue your journey into the wild.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <span>{error}</span>
              </div>
              {targetPortal && (
                <div className="pl-6.5">
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1.5" htmlFor="email">
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
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1F3D2B]" htmlFor="password">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact support@wildbook.com to reset your password.'); }} className="text-xs text-[#D9A441] hover:underline font-medium">
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
                  id="password"
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1F3D2B] text-white font-medium text-sm hover:bg-[#162B1D] active:scale-[0.99] transition shadow-md shadow-[#1F3D2B]/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                  </svg>
                  Log in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5DAC6]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* Signup Link */}
          <div className="text-center text-xs text-gray-600">
            New here?{' '}
            <Link
              to={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup'}
              className="text-[#D9A441] hover:underline font-semibold"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
