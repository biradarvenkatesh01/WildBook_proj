import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

export default function AdminPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const isRejected = user?.account_status === 'REJECTED';

  return (
    <div className="theme-admin min-h-screen bg-[#F6F1E7] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Logo portal="admin" size={32} />
        <div className="text-xs text-gray-500 font-medium">
          Logged in as: <span className="text-[#1F3D2B] font-semibold">{user?.email || 'Admin'}</span>
        </div>
      </header>

      {/* ── Centered Card (Design 15) ──────────────────────────────────────── */}
      <main className="w-full max-w-3xl mx-auto my-auto">
        <div className="bg-white border border-[#E5DAC6] rounded-3xl p-8 sm:p-12 md:p-16 shadow-xl shadow-[#1F3D2B]/5 text-center">
          
          {/* Hourglass Illustration */}
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center relative">
            <div className="w-28 h-28 rounded-full bg-[#D9A441]/10 flex items-center justify-center animate-pulse">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D9A441" strokeWidth="1.5">
                <path d="M5 22h14"/>
                <path d="M5 2h14"/>
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
              </svg>
            </div>
            {/* Animated sand grains */}
            <span className="absolute bottom-10 w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-ping" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-serif text-[#1F3D2B] mb-3">
            {isRejected ? 'Application status: Rejected' : 'Your account is under review'}
          </h1>

          {/* Subtitle */}
          <div className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto space-y-1 mb-10 leading-relaxed">
            {isRejected ? (
              <p className="text-red-700 font-medium">
                The wildlife authority has reviewed and rejected this registration.
                {user?.review_note && (
                  <span className="block mt-2 italic bg-red-50 p-3 rounded-xl border border-red-200">
                    &ldquo;{user.review_note}&rdquo;
                  </span>
                )}
              </p>
            ) : (
              <>
                <p>Thank you for registering with WildBook Admin.</p>
                <p>Our authority team is verifying your credentials and documents.</p>
                <p>You will be notified once your account is approved.</p>
              </>
            )}
          </div>

          {/* Status Stepper (Image 15) */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="flex items-center justify-between relative">
              {/* Connector Lines */}
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-0">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: isRejected ? '50%' : '50%' }}
                />
              </div>

              {/* Step 1: Submitted */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-900 mt-2">Submitted</span>
                <span className="text-[10px] text-gray-500 text-center max-w-[120px]">
                  Application received
                </span>
              </div>

              {/* Step 2: Under Review */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    isRejected
                      ? 'bg-red-600 text-white'
                      : 'bg-[#D9A441] text-[#1F3D2B]'
                  }`}
                >
                  {isRejected ? (
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-900 mt-2">
                  {isRejected ? 'Rejected' : 'Under review'}
                </span>
                <span className="text-[10px] text-gray-500 text-center max-w-[120px]">
                  {isRejected ? 'Decision completed' : 'Authority verifying details'}
                </span>
              </div>

              {/* Step 3: Approved */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-400 mt-2">Approved</span>
                <span className="text-[10px] text-gray-400 text-center max-w-[120px]">
                  Access sanctuary dashboard
                </span>
              </div>
            </div>
          </div>

          {/* Log out Button (Design 15) */}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 py-2.5 px-8 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-sm hover:bg-[#c99534] active:scale-[0.99] transition shadow-md shadow-[#D9A441]/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="text-center text-[11px] text-gray-400 py-2">
        WildBook Sanctuary Operator Gateway • Support: support@wildbook.com
      </footer>
    </div>
  );
}
