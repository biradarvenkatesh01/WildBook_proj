import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';
import { LightningIcon } from '../../components/Icons';

export default function VisitorSignup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'phone') {
      const clean = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: clean }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/auth/user/signup', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      login(res.user, res.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.data?.error || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-user min-h-screen flex flex-col md:flex-row bg-[#F6F1E7]">
      {/* ── Left Hero Panel (Design 03) ────────────────────────────────────── */}
      <div className="relative md:w-5/12 lg:w-1/2 min-h-[340px] md:min-h-screen flex flex-col justify-between p-8 md:p-14 text-white overflow-hidden bg-[#162B1D]">
        {/* Background Image & Gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101F15]/95 via-[#162B1D]/75 to-[#162B1D]/45" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo portal="user" size={38} light />
          </Link>
        </div>

        {/* Center: Hero Heading & Description */}
        <div className="relative z-10 my-auto py-10 max-w-md">
          <h2 className="text-4xl lg:text-5xl font-serif text-[#F6F1E7] leading-tight mb-4">
            Your adventure begins here
          </h2>

          <div className="w-12 h-[1px] bg-[#D9A441]/50 mb-6" />

          <p className="text-sm lg:text-base text-white/85 leading-relaxed mb-8">
            Join WildBook and unlock unforgettable safari experiences, wildlife encounters, and nature&rsquo;s finest moments.
          </p>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="w-8 h-8 rounded-full bg-[#D9A441]/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#D9A441">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
              </svg>
            </div>
            <p className="text-xs text-white/90 font-medium">
              Conserve Nature. Cherish Wildlife. Create Memories.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} WildBook Conservation Platform
        </div>
      </div>

      {/* ── Right Form Panel (Design 03) ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-[#E5DAC6] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1F3D2B]/5">
          
          <h1 className="text-3xl font-serif text-[#1F3D2B] mb-1">
            Create your account
          </h1>
          <p className="text-xs text-[#666] mb-6">
            Sign up to start your wild journey with WildBook.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Demo Helper Card */}
          <div className="mb-5 p-3.5 rounded-2xl bg-[#F6F1E7]/90 border border-[#D5C9B5] text-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#1F3D2B]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
                <span>Demo Registration Details</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const rand = Math.floor(100 + Math.random() * 900);
                  setFormData({
                    name: 'Aditi Rao',
                    email: `aditi.rao${rand}@wildbook.com`,
                    phone: '9876543210',
                    password: 'Visitor@123',
                    confirmPassword: 'Visitor@123',
                    agreeTerms: true,
                  });
                  setError('');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#1F3D2B] text-white hover:bg-[#162B1D] font-medium text-[11px] transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LightningIcon className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>Auto-fill Demo Data</span>
              </button>
            </div>
            <p className="text-[11px] text-[#666]">
              Instantly fills valid visitor details with terms accepted for demonstration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="name">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="email">
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="phone">
                Phone number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="password">
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
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
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

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D9A441] focus:ring-[#D9A441]"
              />
              <label htmlFor="agreeTerms" className="text-xs text-gray-600">
                I agree to the <span className="text-[#1F3D2B] font-medium hover:underline cursor-pointer">Terms of Service</span> and <span className="text-[#1F3D2B] font-medium hover:underline cursor-pointer">Privacy Policy</span>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-sm hover:bg-[#c99534] active:scale-[0.99] transition shadow-md shadow-[#D9A441]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-[#1F3D2B]/30 border-t-[#1F3D2B] rounded-full animate-spin" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-xs text-gray-600 mt-6">
            Already have an account?{' '}
            <Link
              to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="text-[#1F3D2B] hover:underline font-semibold"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
