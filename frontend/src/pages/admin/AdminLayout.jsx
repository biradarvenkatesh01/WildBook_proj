import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import NotificationDropdown from '../../components/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { InfoIcon, CloseIcon } from '../../components/Icons';

export default function AdminLayout({ children, activeTitle = 'Sanctuary Admin' }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [flash, setFlash] = useState(location.state?.flashMessage || null);

  useEffect(() => {
    if (location.state?.flashMessage) {
      setFlash(location.state.flashMessage);
    }
  }, [location.state?.flashMessage]);

  const handleLogout = () => {
    const targetUrl = logout();
    navigate(targetUrl || '/admin/login', { replace: true });
  };

  return (
    <div className="theme-admin flex h-screen overflow-hidden bg-[#F6F1E7]">
      {/* ── Fixed Collapsible Admin Sidebar (6 items per design-spec.md) ──── */}
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300"
        style={{
          marginLeft: collapsed ? '68px' : '220px',
        }}
      >
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#E5DAC6] px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-serif text-[#1F3D2B] font-semibold hidden sm:block">
              {activeTitle}
            </h1>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Notifications icon */}
            <NotificationDropdown portal="admin" />

            {/* Operator Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-semibold text-gray-900">{user?.name || 'Sanctuary Admin'}</span>
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider">
                  {user?.profile?.organisation_name || 'Sanctuary Operator'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center font-bold text-sm shadow-inner">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#F6F1E7]">
          {flash && (
            <div className="bg-[#D9A441] text-[#1F3D2B] px-6 py-3 text-xs font-semibold flex items-center justify-between border-b border-[#c8922a] shadow-xs">
              <div className="flex items-center gap-2">
                <InfoIcon className="w-4 h-4 shrink-0 text-[#1F3D2B]" />
                <span>{flash}</span>
              </div>
              <button
                type="button"
                onClick={() => setFlash(null)}
                className="p-1 rounded hover:bg-black/10 transition"
                aria-label="Dismiss alert"
              >
                <CloseIcon className="w-3.5 h-3.5 text-[#1F3D2B]" />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
