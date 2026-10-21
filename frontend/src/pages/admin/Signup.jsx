import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';

export default function AdminSignup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    organisation_name: '',
    designation: '',
    email: '',
    phone: '',
    license_number: '',
    registered_address: '',
    website: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [files, setFiles] = useState({
    license: null,
    identity: null,
    authorization: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({
        ...prev,
        [name]: selectedFiles[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.name ||
      !formData.organisation_name ||
      !formData.designation ||
      !formData.email ||
      !formData.license_number ||
      !formData.registered_address ||
      !formData.password
    ) {
      setError('Please fill in all required text fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!files.license || !files.identity || !files.authorization) {
      setError('Please upload all three required verification documents (License, ID Proof, Authorization Letter).');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'confirmPassword' && key !== 'agreeTerms') {
          data.append(key, formData[key]);
        }
      });

      data.append('license', files.license);
      data.append('identity', files.identity);
      data.append('authorization', files.authorization);

      const res = await client.upload('/auth/admin/signup', data);
      login(res.user, res.token);
      navigate('/admin/pending', { replace: true });
    } catch (err) {
      setError(err.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-admin min-h-screen flex flex-col md:flex-row bg-[#F6F1E7]">
      {/* ── Left Hero Panel (Design 14) ────────────────────────────────────── */}
      <div className="relative md:w-5/12 lg:w-5/12 min-h-[360px] md:min-h-screen flex flex-col justify-between p-8 md:p-14 text-white overflow-hidden bg-[#162B1D]">
        {/* Background Image: Forest Elephant Trail */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c12]/95 via-[#162B1D]/80 to-[#162B1D]/55" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo portal="admin" size={38} light />
          </Link>
        </div>

        {/* Center: Hero Heading & Feature Badges */}
        <div className="relative z-10 my-auto py-10 max-w-md">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#F6F1E7] leading-tight mb-4">
            Bring your sanctuary to travellers everywhere
          </h2>

          <div className="w-12 h-[1px] bg-[#D9A441]/50 mb-8" />

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#D9A441">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white/90">
                Reach thousands of wildlife enthusiasts and tourists
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#D9A441">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white/90">
                Manage safari schedules, vehicle capacities & bookings easily
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#D9A441">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-white/90">
                Verified authority-backed operator listing
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-white/40">
          Official Sanctuary Partner Program
        </div>
      </div>

      {/* ── Right Form Panel (Design 14) ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl bg-white border border-[#E5DAC6] rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1F3D2B]/5 my-6">
          
          <h1 className="text-3xl font-serif text-[#1F3D2B] mb-1">
            Register your sanctuary
          </h1>
          <p className="text-xs text-gray-600 mb-6">
            Your account will be reviewed and approved by the authority before you can list.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="admin-name">
                  Full name *
                </label>
                <input
                  id="admin-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Official Representative Name"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="designation">
                  Designation *
                </label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. Park Director / Field Manager"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>
            </div>

            {/* Organisation & License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="organisation_name">
                  Organisation or sanctuary name *
                </label>
                <input
                  id="organisation_name"
                  name="organisation_name"
                  type="text"
                  value={formData.organisation_name}
                  onChange={handleInputChange}
                  placeholder="Sanctuary or Trust Name"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="license_number">
                  License / Registration number *
                </label>
                <input
                  id="license_number"
                  name="license_number"
                  type="text"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="e.g. KA-WLD-2026-XXXX"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="admin-signup-email">
                  Email address *
                </label>
                <input
                  id="admin-signup-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="official@sanctuary.org"
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="admin-phone">
                  Phone number
                </label>
                <input
                  id="admin-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
              </div>
            </div>

            {/* Address & Website */}
            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="registered_address">
                Registered Office Address *
              </label>
              <textarea
                id="registered_address"
                name="registered_address"
                rows="2"
                value={formData.registered_address}
                onChange={handleInputChange}
                placeholder="Full official office postal address"
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="website">
                Official Website (Optional)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://sanctuary.gov.in"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="admin-signup-password">
                  Password (min 8 chars) *
                </label>
                <div className="relative">
                  <input
                    id="admin-signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    required
                    className="w-full px-3.5 pr-10 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-gray-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-gray-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-gray-200'}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1F3D2B] mb-1" htmlFor="admin-confirm-password">
                  Confirm password *
                </label>
                <div className="relative">
                  <input
                    id="admin-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required
                    className="w-full px-3.5 pr-10 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
            </div>

            {/* Document Uploads (3 required private documents) */}
            <div className="p-4 rounded-2xl bg-[#F6F1E7]/70 border border-[#E5DAC6] space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#1F3D2B]">
                Verification Documents (PDF or Images, max 10MB each) *
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. License */}
                <div className="border border-dashed border-[#C0B4A0] bg-white p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-gray-700 mb-1">
                    1. Operating License
                  </span>
                  <input
                    type="file"
                    name="license"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                    className="text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#1F3D2B] file:text-white hover:file:bg-[#162B1D] cursor-pointer"
                  />
                  {files.license && (
                    <span className="block text-[10px] text-emerald-700 mt-1 truncate">
                      ✓ {files.license.name}
                    </span>
                  )}
                </div>

                {/* 2. Identity Proof */}
                <div className="border border-dashed border-[#C0B4A0] bg-white p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-gray-700 mb-1">
                    2. Identity Proof
                  </span>
                  <input
                    type="file"
                    name="identity"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                    className="text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#1F3D2B] file:text-white hover:file:bg-[#162B1D] cursor-pointer"
                  />
                  {files.identity && (
                    <span className="block text-[10px] text-emerald-700 mt-1 truncate">
                      ✓ {files.identity.name}
                    </span>
                  )}
                </div>

                {/* 3. Authorization Letter */}
                <div className="border border-dashed border-[#C0B4A0] bg-white p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-gray-700 mb-1">
                    3. Authorization Letter
                  </span>
                  <input
                    type="file"
                    name="authorization"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                    className="text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-[#1F3D2B] file:text-white hover:file:bg-[#162B1D] cursor-pointer"
                  />
                  {files.authorization && (
                    <span className="block text-[10px] text-emerald-700 mt-1 truncate">
                      ✓ {files.authorization.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="adminAgreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D9A441] focus:ring-[#D9A441]"
              />
              <label htmlFor="adminAgreeTerms" className="text-xs text-gray-600">
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
                'Submit for approval'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-xs text-gray-600 mt-6">
            Already registered?{' '}
            <Link to="/admin/login" className="text-[#1F3D2B] hover:underline font-semibold">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
