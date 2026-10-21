import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

/**
 * AdminSidebar — fixed sidebar for the Admin (sanctuary operator) portal.
 * Items (from design-spec.md): Dashboard, My Sanctuaries, Activities & Slots,
 *                              Guides & Vehicles, Bookings, Reports
 */

const NAV_ITEMS = [
  { to: '/admin',             label: 'Dashboard',           icon: <DashboardIcon /> },
  { to: '/admin/sanctuaries', label: 'My Sanctuaries',      icon: <SanctuaryIcon /> },
  { to: '/admin/activities-slots', label: 'Activities & Slots', icon: <ActivitiesIcon /> },
  { to: '/admin/guides',      label: 'Guides & Vehicles',   icon: <GuidesIcon /> },
  { to: '/admin/bookings',    label: 'Bookings',            icon: <BookingsIcon /> },
  { to: '/admin/reports',     label: 'Reports',             icon: <ReportsIcon /> },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) => [
    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group',
    isActive
      ? 'bg-[var(--bg-nav-active)] border-l-2 border-[var(--color-amber,#D9A441)] text-[var(--color-amber,#D9A441)] font-medium'
      : 'text-[var(--text-nav,#F6F1E7)] opacity-70 hover:opacity-100 hover:bg-white/8',
  ].join(' ');

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '220px',
        backgroundColor: 'var(--bg-nav, #1F3D2B)',
        color: 'var(--text-nav, #F6F1E7)',
        transition: 'width 0.25s ease',
      }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden"
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && <Logo portal="admin" size="sm" light />}
        {collapsed && (
          <div className="mx-auto">
            <Logo portal="admin" size="sm" light />
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded hover:bg-white/10 text-[var(--text-nav)] opacity-60 hover:opacity-100 flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/admin'} className={linkClass}>
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            {!collapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className="border-t border-white/10 px-4 py-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#1F3D2B] font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-nav)] truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-xs opacity-50 text-[var(--text-nav)]">Admin</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#1F3D2B] font-bold text-sm mx-auto">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function DashboardIcon()  { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/></svg>; }
function SanctuaryIcon()  { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2C6.5 2 2 7 2 12c0 4.4 2.9 8.1 6.9 9.5M12 2c5.5 0 10 5 10 10s-4.5 10-10 10M12 2v20M2 12h20"/></svg>; }
function ActivitiesIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function GuidesIcon()     { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><circle cx="9" cy="7" r="4" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M19 8l2 2-2 2M21 10h-5"/></svg>; }
function BookingsIcon()   { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>; }
function ReportsIcon()    { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>; }
