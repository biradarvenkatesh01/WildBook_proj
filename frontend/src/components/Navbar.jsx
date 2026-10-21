import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar — Visitor site header with dual dropdowns, role awareness, and keyboard navigation.
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loginRef = useRef(null);
  const signupRef = useRef(null);
  const avatarRef = useRef(null);

  const [flash, setFlash] = useState(location.state?.flashMessage || null);

  useEffect(() => {
    if (location.state?.flashMessage) {
      setFlash(location.state.flashMessage);
    }
  }, [location.state?.flashMessage]);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setLoginOpen(false);
      }
      if (signupRef.current && !signupRef.current.contains(event.target)) {
        setSignupOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setAvatarOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setLoginOpen(false);
        setSignupOpen(false);
        setAvatarOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    const targetUrl = logout();
    setAvatarOpen(false);
    setMobileMenuOpen(false);
    navigate(targetUrl || '/');
  };

  // Experiences link handler (smooth scrolls if on home, otherwise navigates to /#experiences)
  const handleExperiencesClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('experiences');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', '#experiences');
        return;
      }
    }
    navigate('/#experiences');
  };

  const isExperiencesActive = location.pathname === '/' && location.hash === '#experiences';

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-[#D9A441] font-semibold' : 'text-[#F6F1E7]/80 hover:text-[#D9A441]'
    }`;

  const isVisitor = user?.role === 'VISITOR';
  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.role === 'SITE_OWNER';

  return (
    <nav
      style={{ backgroundColor: 'var(--bg-nav, #1F3D2B)', color: 'var(--text-nav, #F6F1E7)' }}
      className="sticky top-0 z-50 w-full border-b border-white/10 shadow-sm"
    >
      {flash && (
        <div className="bg-[#D9A441] text-[#1F3D2B] px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-[#b88528]">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span>ℹ️</span>
            <span>{flash}</span>
          </div>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-xs px-2 py-0.5 rounded hover:bg-black/10 font-bold"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="WildBook Home">
            <Logo portal="user" size="md" light />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/sanctuaries" className={navLinkClass}>
              Sanctuaries
            </NavLink>
            <a
              href="/#experiences"
              onClick={handleExperiencesClick}
              className={`text-sm font-medium transition-colors duration-150 ${
                isExperiencesActive ? 'text-[#D9A441] font-semibold' : 'text-[#F6F1E7]/80 hover:text-[#D9A441]'
              }`}
            >
              Experiences
            </a>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/conservation" className={navLinkClass}>
              Conservation
            </NavLink>

            {/* If logged-in visitor, also provide direct link to My Bookings */}
            {isAuthenticated && isVisitor && (
              <NavLink to="/my-bookings" className={navLinkClass}>
                My Bookings
              </NavLink>
            )}
          </div>

          {/* Right Action / Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              // ── Logged In States ──────────────────────────────────────────
              isVisitor ? (
                // Visitor Logged In: My Bookings & Avatar Menu
                <div className="flex items-center gap-4">
                  <Link
                    to="/my-bookings"
                    className="text-xs font-semibold text-[#D9A441] hover:underline"
                  >
                    My Bookings
                  </Link>

                  <div className="relative" ref={avatarRef}>
                    <button
                      type="button"
                      onClick={() => setAvatarOpen(o => !o)}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition focus:outline-none"
                      aria-haspopup="true"
                      aria-expanded={avatarOpen}
                      aria-label="User profile menu"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#D9A441] text-[#1F3D2B] font-bold text-sm flex items-center justify-center">
                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                      <span className="text-xs font-medium text-[#F6F1E7]">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {avatarOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1.5 border border-gray-200 z-50 text-gray-800 text-xs">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/my-bookings"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-[#F6F1E7]/70 text-gray-700"
                        >
                          <span>🎫</span>
                          <span>My Bookings</span>
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                        >
                          <span>🚪</span>
                          <span>Log out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Admin or Owner viewing Visitor site: "Go to dashboard" and "Log out"
                <div className="flex items-center gap-3">
                  <Link
                    to={isAdmin ? (user?.account_status === 'PENDING' ? '/admin/pending' : '/admin') : '/owner'}
                    className="px-4 py-2 rounded-lg bg-[#D9A441] hover:bg-[#c99534] text-[#1F3D2B] font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>📊</span>
                    <span>Go to dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-xs text-[#F6F1E7] hover:bg-white/10 transition"
                  >
                    Log out
                  </button>
                </div>
              )
            ) : (
              // ── Logged Out State: Dual Dropdowns (Log in & Sign up) ────────
              <div className="flex items-center gap-2.5">
                
                {/* 1. Log In Dropdown */}
                <div className="relative" ref={loginRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginOpen(o => !o);
                      setSignupOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#F6F1E7] hover:text-[#D9A441] transition rounded-lg hover:bg-white/5"
                    aria-haspopup="true"
                    aria-expanded={loginOpen}
                  >
                    <span>Log in</span>
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {loginOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-1.5 border border-gray-200 z-50 text-xs">
                      <Link
                        to="/login"
                        onClick={() => setLoginOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#F6F1E7]/70 text-gray-800 transition"
                      >
                        <span className="text-base">🎒</span>
                        <div>
                          <div className="font-semibold text-gray-900">Visitor login</div>
                          <div className="text-[10px] text-gray-400">Explore & book safaris</div>
                        </div>
                      </Link>
                      <Link
                        to="/admin/login"
                        onClick={() => setLoginOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#F6F1E7]/70 text-gray-800 transition"
                      >
                        <span className="text-base">🌲</span>
                        <div>
                          <div className="font-semibold text-gray-900">Sanctuary admin login</div>
                          <div className="text-[10px] text-gray-400">Operator portal</div>
                        </div>
                      </Link>
                      <Link
                        to="/owner/login"
                        onClick={() => setLoginOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#F6F1E7]/70 text-gray-800 transition"
                      >
                        <span className="text-base">🛡️</span>
                        <div>
                          <div className="font-semibold text-gray-900">Authority login</div>
                          <div className="text-[10px] text-gray-400">Site authority clearance</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. Sign Up Dropdown (Amber Button Style) */}
                <div className="relative" ref={signupRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupOpen(o => !o);
                      setLoginOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-semibold text-sm hover:bg-[#c99534] transition shadow-xs"
                    aria-haspopup="true"
                    aria-expanded={signupOpen}
                  >
                    <span>Sign up</span>
                    <svg className="w-3.5 h-3.5 text-[#1F3D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {signupOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-1.5 border border-gray-200 z-50 text-xs">
                      <Link
                        to="/signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#F6F1E7]/70 text-gray-800 transition"
                      >
                        <span className="text-base">👤</span>
                        <div>
                          <div className="font-semibold text-gray-900">Visitor signup</div>
                          <div className="text-[10px] text-gray-400">Create traveller account</div>
                        </div>
                      </Link>
                      <Link
                        to="/admin/signup"
                        onClick={() => setSignupOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-[#F6F1E7]/70 text-gray-800 transition"
                      >
                        <span className="text-base">🏛️</span>
                        <div>
                          <div className="font-semibold text-gray-900">Register your sanctuary</div>
                          <div className="text-[10px] text-gray-400">Operator application</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(o => !o)}
              className="p-2 rounded-lg text-[#F6F1E7] hover:bg-white/10 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 space-y-3 bg-[#1F3D2B]">
          <NavLink
            to="/sanctuaries"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClass}
          >
            Sanctuaries
          </NavLink>
          <a
            href="/#experiences"
            onClick={handleExperiencesClick}
            className="block text-sm font-medium text-[#F6F1E7]/80 hover:text-[#D9A441]"
          >
            Experiences
          </a>
          <NavLink
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClass}
          >
            About
          </NavLink>
          <NavLink
            to="/conservation"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClass}
          >
            Conservation
          </NavLink>

          <hr className="border-white/10 my-2" />

          {isAuthenticated ? (
            isVisitor ? (
              <div className="space-y-2">
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-[#D9A441]"
                >
                  My Bookings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left text-sm text-red-400 font-medium pt-2"
                >
                  Log out ({user?.name})
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to={isAdmin ? '/admin' : '/owner'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-[#D9A441]"
                >
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left text-sm text-red-400 font-medium pt-2"
                >
                  Log out
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Log in to WildBook
              </div>
              <div className="grid grid-cols-1 gap-1 pl-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-white hover:text-amber-300 py-1">
                  &bull; Visitor login
                </Link>
                <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-white hover:text-amber-300 py-1">
                  &bull; Sanctuary admin login
                </Link>
                <Link to="/owner/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-white hover:text-amber-300 py-1">
                  &bull; Authority login
                </Link>
              </div>

              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 pt-2">
                Create an account
              </div>
              <div className="grid grid-cols-1 gap-1 pl-2">
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm text-amber-300 font-medium py-1">
                  &bull; Visitor signup
                </Link>
                <Link to="/admin/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm text-amber-300 font-medium py-1">
                  &bull; Register your sanctuary
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
