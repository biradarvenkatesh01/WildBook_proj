import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';

export default function OwnerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetPortal, setTargetPortal] = useState(null);
  const [targetPortalText, setTargetPortalText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTargetPortal(null);
    setTargetPortalText('');

    if (!email || !password) {
      setError('Please provide your authority credentials.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/auth/owner/login', { email, password });
      login(res.user, res.token);
      navigate('/owner', { replace: true });
    } catch (err) {
      const errData = err.data || {};
      setError(errData.error || err.message || 'Authentication failed');
      if (errData.targetPortal) {
        setTargetPortal(errData.targetPortal);
        setTargetPortalText(errData.linkText || 'Switch portal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-owner min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#162B1D]">
      {/* ── Background: Deep Redwood Forest (Design 21) ────────────────────── */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-[#162B1D]/80 backdrop-blur-[2px]" />

      {/* ── Centered Card (Design 21) ──────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/40 border border-white/20">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <Logo portal="owner" size={48} />
          </div>
          <h2 className="text-2xl font-serif text-[#162B1D] tracking-wide">
            WildBook
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8922A] block mt-0.5">
            Authority Portal
          </span>
        </div>

        <h1 className="text-xl font-medium text-center text-gray-800 mb-6">
          Authority Portal
        </h1>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
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
                  className="inline-flex items-center gap-1.5 font-bold text-[#162B1D] underline hover:text-[#C8922A]"
                >
                  <span>{targetPortalText}</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="owner-email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <input
                id="owner-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8922A] focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="owner-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                id="owner-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8922A] focus:border-transparent text-gray-900 placeholder-gray-400"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#162B1D] text-white font-medium text-sm hover:bg-[#0e1c12] active:scale-[0.99] transition shadow-md shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Log in'
            )}
          </button>
        </form>

        {/* Security Badge (Design 21) — Strictly NO signup link */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-gray-500 text-xs">
          <svg className="w-4 h-4 text-[#C8922A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="tracking-wide">Authorised personnel only</span>
        </div>
      </div>
    </div>
  );
}
