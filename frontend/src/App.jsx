import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';

// Dev
import DevComponents from './pages/dev/Components';

// User / Visitor
import Home from './pages/user/Home';
import VisitorLogin from './pages/user/Login';
import VisitorSignup from './pages/user/Signup';
import BrowseSanctuaries from './pages/user/BrowseSanctuaries';
import SanctuaryDetail from './pages/user/SanctuaryDetail';
import ActivitySlots from './pages/user/ActivitySlots';
import About from './pages/user/About';
import Conservation from './pages/user/Conservation';

import BookingDetails from './pages/user/BookingDetails';
import Payment from './pages/user/Payment';
import BookingConfirmed from './pages/user/BookingConfirmed';

import MyBookings from './pages/user/MyBookings';
import WriteReview from './pages/user/WriteReview';

// Admin
import {
  AdminDashboard,
  AdminLogin,
  AdminSignup,
  AdminPending,
  MySanctuaries,
  SanctuaryForm,
  ActivitiesSlots,
  AdminBookings,
  AdminReports,
} from './pages/admin/index';

// Owner
import {
  OwnerDashboard,
  OwnerLogin,
  OwnerAdminRequests,
  OwnerSanctuaryRequests,
  OwnerApprovedSanctuaries,
  OwnerSanctuaryReview,
  OwnerReports,
} from './pages/owner/index';

// 404
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Dev ─────────────────────────────────────────────────────── */}
          <Route path="/dev/components" element={<DevComponents />} />

          {/* ── Visitor (user) site ─────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <VisitorLogin />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <VisitorSignup />
              </GuestRoute>
            }
          />

          {/* Visitor browsing & informational routes */}
          <Route path="/sanctuaries" element={<BrowseSanctuaries />} />
          <Route path="/sanctuaries/:id" element={<SanctuaryDetail />} />
          <Route path="/activities/:id" element={<ActivitySlots />} />
          <Route path="/about" element={<About />} />
          <Route path="/conservation" element={<Conservation />} />

          {/* Visitor booking & payment routes (Phase 8) */}
          <Route
            path="/book/:slotId"
            element={
              <ProtectedRoute allowedRoles={['VISITOR']} redirectTo="/login">
                <BookingDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay/:bookingId"
            element={
              <ProtectedRoute allowedRoles={['VISITOR']} redirectTo="/login">
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:id/confirmed"
            element={
              <ProtectedRoute allowedRoles={['VISITOR']} redirectTo="/login">
                <BookingConfirmed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={['VISITOR']} redirectTo="/login">
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:bookingId"
            element={
              <ProtectedRoute allowedRoles={['VISITOR']} redirectTo="/login">
                <WriteReview />
              </ProtectedRoute>
            }
          />

          {/* ── Admin portal ─────────────────────────────────────────────── */}
          <Route
            path="/admin/login"
            element={
              <GuestRoute>
                <AdminLogin />
              </GuestRoute>
            }
          />
          <Route
            path="/admin/signup"
            element={
              <GuestRoute>
                <AdminSignup />
              </GuestRoute>
            }
          />
          <Route path="/admin/pending" element={<AdminPending />} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sanctuaries"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <MySanctuaries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sanctuaries/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <SanctuaryForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sanctuaries/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <SanctuaryForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activities-slots"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <ActivitiesSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/guides"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <ActivitiesSlots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Owner portal ─────────────────────────────────────────────── */}
          <Route
            path="/owner/login"
            element={
              <GuestRoute>
                <OwnerLogin />
              </GuestRoute>
            }
          />

          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/admin-requests"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerAdminRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/sanctuary-requests"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerSanctuaryRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/sanctuary-requests/:id"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerSanctuaryReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/sanctuaries"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerApprovedSanctuaries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/reports"
            element={
              <ProtectedRoute allowedRoles={['SITE_OWNER']} redirectTo="/owner/login">
                <OwnerReports />
              </ProtectedRoute>
            }
          />

          {/* ── 404 ─────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
