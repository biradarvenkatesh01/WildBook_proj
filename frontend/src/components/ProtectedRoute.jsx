import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication and role verification.
 *
 * Props:
 *  - allowedRoles: string[]  e.g. ['ADMIN'] or ['SITE_OWNER']
 *  - redirectTo:   string    Where to send unauthenticated visitors (default '/login')
 *
 * Behaviour:
 *  - Still verifying session → shows smooth loader
 *  - Not logged in          → redirects to redirectTo?redirect=<intended_path>
 *  - Pending admin          → redirects to '/admin/pending'
 *  - Wrong role             → redirects to user's portal home with a flash message
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for session restoration from /api/auth/me on refresh
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-[#D9A441] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#1F3D2B] font-semibold">
          Restoring WildBook Session...
        </p>
      </div>
    );
  }

  // 2. Not authenticated: redirect to login preserving the full target path
  if (!isAuthenticated) {
    const targetUrl = location.pathname + location.search;
    const loginUrl = `${redirectTo}${
      redirectTo.includes('?') ? '&' : '?'
    }redirect=${encodeURIComponent(targetUrl)}`;

    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  // 3. Admin status gate: PENDING admin can only view /admin/pending
  if (
    user?.role === 'ADMIN' &&
    user?.account_status === 'PENDING' &&
    location.pathname !== '/admin/pending'
  ) {
    return <Navigate to="/admin/pending" replace />;
  }

  // 4. Role check: logged-in user attempting to view a foreign portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const roleHome = {
      VISITOR: '/',
      ADMIN: user?.account_status === 'PENDING' ? '/admin/pending' : '/admin',
      SITE_OWNER: '/owner',
    }[user?.role] ?? '/';

    return (
      <Navigate
        to={roleHome}
        state={{
          flashMessage: `Access restricted. Redirected to your authorized ${
            user?.role === 'SITE_OWNER'
              ? 'Authority'
              : user?.role === 'ADMIN'
              ? 'Sanctuary Operator'
              : 'Traveller'
          } home.`,
        }}
        replace
      />
    );
  }

  return children;
}

/**
 * GuestRoute — wraps auth pages (login/signup) so already logged-in users are redirected to their home.
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#D9A441] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const roleHome = {
      VISITOR: '/',
      ADMIN: user.account_status === 'PENDING' ? '/admin/pending' : '/admin',
      SITE_OWNER: '/owner',
    }[user.role] ?? '/';

    return <Navigate to={roleHome} replace />;
  }

  return children;
}
