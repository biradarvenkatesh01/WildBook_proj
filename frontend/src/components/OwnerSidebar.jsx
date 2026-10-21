import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

/**
 * OwnerSidebar — fixed sidebar for the Site Owner (Authority) portal.
 * Items (from design-spec.md): Dashboard, Admin Requests, Sanctuary Requests,
 *                              Approved Sanctuaries, Reports
 */

const NAV_ITEMS = [
  { to: '/owner',                      label: 'Dashboard',            icon: <DashboardIcon /> },
  { to: '/owner/admin-requests',       label: 'Admin Requests',       icon: <AdminReqIcon />  },
  { to: '/owner/sanctuary-requests',   label: 'Sanctuary Requests',   icon: <SanctuaryReqIcon /> },
  { to: '/owner/sanctuaries',          label: 'Approved Sanctuaries', icon: <ApprovedIcon />  },
  { to: '/owner/reports',              label: 'Reports',              icon: <ReportsIcon />   },
];

export default function OwnerSidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  const linkClass = ({ isActive }) => [
    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150',
    isActive
      ? 'bg-[var(--bg-nav-active)] border-l-2 border-[var(--color-amber,#D9A441)] text-[var(--color-amber,#D9A441)] font-medium'
      : 'text-[var(--text-nav,#E8EDE9)] opacity-70 hover:opacity-100 hover:bg-white/8',
  ].join(' ');

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '230px',
        backgroundColor: 'var(--bg-nav, #162B1D)',
        color: 'var(--text-nav, #E8EDE9)',
        transition: 'width 0.25s ease',
      }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden"
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        {!collapsed && (
          <div>
            <Logo portal="owner" size="sm" light />
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Logo portal="owner" size="sm" light />
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
          <NavLink key={to} to={to} end={to === '/owner'} className={linkClass}>
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            {!collapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — authority badge */}
      <div className="border-t border-white/10 px-4 py-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#162B1D] font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-nav)] truncate">{user?.name ?? 'Authority Owner'}</p>
              <p className="text-xs opacity-50 text-[var(--text-nav)]">Super Owner</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#162B1D] font-bold text-sm mx-auto">
            {user?.name?.[0]?.toUpperCase() ?? 'O'}
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */
function DashboardIcon()    { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5"/></svg>; }
function AdminReqIcon()     { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><circle cx="9" cy="7" r="4" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path strokeLinecap="round" strokeWidth="1.5" d="M17 11l2 2 4-4"/></svg>; }
function SanctuaryReqIcon() { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth="1.5" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path strokeLinecap="round" strokeWidth="1.5" d="M17 21v-8H7v8M7 3v5h8"/></svg>; }
function ApprovedIcon()     { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>; }
function ReportsIcon()      { return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>; }
