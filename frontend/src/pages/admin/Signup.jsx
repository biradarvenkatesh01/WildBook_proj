import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Logo from '../../components/Logo';
import { LightningIcon } from '../../components/Icons';

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

    if (formData.phone && formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
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
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl lg:max-w-3xl bg-white border border-[#E5DAC6] rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xl shadow-[#1F3D2B]/5 my-2 sm:my-3">
          
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1F3D2B] mb-0.5">
            Register your sanctuary
          </h1>
          <p className="text-xs text-gray-600 mb-4">
            Your account will be reviewed and approved by the authority before you can list.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Demo Helper Card */}
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F6F1E7]/90 border border-[#D5C9B5] text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#1F3D2B]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
                <span>Demo Operator Registration</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const rand = Math.floor(100 + Math.random() * 900);
                  setFormData({
                    name: 'Dr. Rajesh Kumar',
                    organisation_name: 'Kabini Wildlife Reserve',
                    designation: 'Field Director',
                    email: `director.kabini${rand}@wildbook.com`,
                    phone: '9876501234',
                    license_number: `KA-WLD-2026-${rand}`,
                    registered_address: 'Range Forest Office, Kabini Gate, H.D. Kote Taluk, Karnataka 571114',
                    website: 'https://kabini-reserve.gov.in',
                    password: 'AdminSecret@123',
                    confirmPassword: 'AdminSecret@123',
                    agreeTerms: true,
                  });

                  // Generate 3 sample dummy PDF documents for seamless upload testing
                  const dummyLicense = new File(['%PDF-1.4 demo operating license verification document'], 'demo_operator_license.pdf', { type: 'application/pdf' });
                  const dummyIdentity = new File(['%PDF-1.4 demo government identity proof document'], 'demo_identity_proof.pdf', { type: 'application/pdf' });
                  const dummyAuth = new File(['%PDF-1.4 demo forest department authorization letter'], 'demo_authorization_letter.pdf', { type: 'application/pdf' });

                  setFiles({
                    license: dummyLicense,
                    identity: dummyIdentity,
                    authorization: dummyAuth,
                  });

                  setError('');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1F3D2B] text-white hover:bg-[#162B1D] font-medium text-[11px] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LightningIcon className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>Auto-fill All Details & Documents</span>
              </button>
            </div>
            <p className="text-[11px] text-[#666]">
              Populates complete operator profile and attaches sample PDF proofs for instant demo submission.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C9B5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900 font-mono"
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
            <div className="p-5 rounded-2xl bg-[#F6F1E7]/70 border border-[#E5DAC6] space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                  Verification Documents (PDF or Images, max 10MB each) *
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  All 3 documents required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. License */}
                <label className="relative border-2 border-dashed border-[#C0B4A0] hover:border-[#D9A441] bg-white p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 group hover:bg-[#FAF8F5]">
                  <input
                    type="file"
                    name="license"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required={!files.license}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#1F3D2B]/5 text-[#1F3D2B] group-hover:bg-[#D9A441]/20 flex items-center justify-center mb-2 transition">
                    <svg className="w-5 h-5 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <span className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                    1. Operating License
                  </span>
                  {files.license ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md max-w-full truncate">
                      ✓ {files.license.name}
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] text-[#1F3D2B] font-medium py-1 px-3 rounded-lg bg-[#FAF8F5] border border-gray-200 group-hover:bg-[#D9A441] group-hover:text-[#1F3D2B] transition">
                      Choose file
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1.5">PDF, JPG, PNG</span>
                </label>

                {/* 2. Identity Proof */}
                <label className="relative border-2 border-dashed border-[#C0B4A0] hover:border-[#D9A441] bg-white p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 group hover:bg-[#FAF8F5]">
                  <input
                    type="file"
                    name="identity"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required={!files.identity}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#1F3D2B]/5 text-[#1F3D2B] group-hover:bg-[#D9A441]/20 flex items-center justify-center mb-2 transition">
                    <svg className="w-5 h-5 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  </div>
                  <span className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                    2. Identity Proof
                  </span>
                  {files.identity ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md max-w-full truncate">
                      ✓ {files.identity.name}
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] text-[#1F3D2B] font-medium py-1 px-3 rounded-lg bg-[#FAF8F5] border border-gray-200 group-hover:bg-[#D9A441] group-hover:text-[#1F3D2B] transition">
                      Choose file
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1.5">PDF, JPG, PNG</span>
                </label>

                {/* 3. Authorization Letter */}
                <label className="relative border-2 border-dashed border-[#C0B4A0] hover:border-[#D9A441] bg-white p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 group hover:bg-[#FAF8F5]">
                  <input
                    type="file"
                    name="authorization"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required={!files.authorization}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 rounded-full bg-[#1F3D2B]/5 text-[#1F3D2B] group-hover:bg-[#D9A441]/20 flex items-center justify-center mb-2 transition">
                    <svg className="w-5 h-5 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <span className="block text-xs font-semibold text-[#1F3D2B] mb-1.5">
                    3. Authorization Letter
                  </span>
                  {files.authorization ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md max-w-full truncate">
                      ✓ {files.authorization.name}
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] text-[#1F3D2B] font-medium py-1 px-3 rounded-lg bg-[#FAF8F5] border border-gray-200 group-hover:bg-[#D9A441] group-hover:text-[#1F3D2B] transition">
                      Choose file
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mt-1.5">PDF, JPG, PNG</span>
                </label>
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
              className="w-full py-2.5 px-4 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-sm hover:bg-[#c99534] active:scale-[0.99] transition shadow-md shadow-[#D9A441]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-[#1F3D2B]/30 border-t-[#1F3D2B] rounded-full animate-spin" />
              ) : (
                'Submit for approval'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-xs text-gray-600 mt-3.5">
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
