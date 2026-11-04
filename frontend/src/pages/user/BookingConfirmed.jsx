import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Stepper from '../../components/Stepper';
import client from '../../api/client';
import { WarningIcon, TentIcon, TicketIcon, CameraIcon, ClockIcon, UserIcon } from '../../components/Icons';

export default function BookingConfirmed() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Cancel & Erase state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    async function loadConfirmedBooking() {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get(`/bookings/${id}`);
        setBooking(res.booking);
      } catch (err) {
        console.error('Failed to load confirmation details:', err);
        setError(err.message || 'Unable to retrieve confirmed booking.');
      } finally {
        setLoading(false);
      }
    }
    loadConfirmedBooking();
  }, [id]);

  const handleDownloadTicket = async () => {
    if (!booking) return;
    try {
      setDownloading(true);
      const token = localStorage.getItem('wb_token');
      const response = await fetch(`/api/bookings/${booking.booking_id}/ticket`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download ticket PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WildBook_Ticket_${booking.booking_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Ticket download error:', err);
      alert('Could not download ticket PDF. Please try again or contact support.');
    } finally {
      setDownloading(false);
    }
  };

  // Erase and cancel booking directly (no separate table needed)
  const handleCancelAndErase = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      setCancelError(null);
      const res = await client.delete(`/bookings/${booking.booking_id}`);
      setIsCancelled(true);
      setShowCancelModal(false);
      setCancelSuccess(
        res?.message || 'Booking cancelled and erased successfully. Your seats have been released back to the sanctuary.'
      );
    } catch (err) {
      console.error('Cancel booking error:', err);
      setCancelError(err.data?.error || err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F3D2B]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking && !loading) {
    return (
      <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <WarningIcon className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Booking Not Found</h1>
          <p className="text-xs text-gray-600 mb-6">{error || 'This booking confirmation could not be found or has been cancelled.'}</p>
          <Link
            to="/sanctuaries"
            className="px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition"
          >
            Explore Sanctuaries
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const dateFormatted = booking.slot_date
    ? new Date(booking.slot_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Full Booking Stepper */}
        <div className="mb-10 max-w-2xl mx-auto">
          <Stepper
            steps={[
              'Choose Experience',
              'Select Date & Time',
              'Add Attendees',
              'Review & Pay',
              isCancelled ? 'Booking Cancelled' : 'Booking Confirmed',
            ]}
            currentStep={4}
          />
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-stone-200/80 text-center relative overflow-hidden">
          {/* Top Leaf Success Badge or Cancelled Badge */}
          {isCancelled ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 shadow-md mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1F3D2B] text-white shadow-md mb-6">
              <svg className="w-8 h-8 text-[#D9A441]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B] mb-2">
            {isCancelled ? 'Booking Cancelled' : 'Your adventure is booked!'}
          </h1>
          <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
            {isCancelled
              ? 'This reservation has been cancelled and erased from the system. Your reserved seats have been released.'
              : "We can't wait to welcome you to the wild. A confirmation permit has been generated."}
          </p>

          {/* Cancellation Success Alert Banner */}
          {cancelSuccess && (
            <div className="max-w-xl mx-auto mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">✓</span>
                <span>{cancelSuccess}</span>
              </div>
            </div>
          )}

          {/* Ticket Box */}
          <div
            className={`max-w-xl mx-auto mb-10 p-6 sm:p-7 rounded-2xl border-2 border-dashed relative ${
              isCancelled
                ? 'border-red-300 bg-red-50/40'
                : 'border-[#D9A441] bg-[#FCFBF7]'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 block mb-1">
              Your Booking ID
            </span>
            <div
              className={`text-3xl sm:text-4xl font-serif font-black tracking-wider ${
                isCancelled ? 'text-gray-500 line-through' : 'text-[#1F3D2B]'
              }`}
            >
              {booking.booking_code}
            </div>
            {isCancelled ? (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold tracking-wider uppercase">
                ✕ Cancelled & Erased
              </span>
            ) : (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
                Confirmed & Verified
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-10 text-xs">
            {/* Sanctuary */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
              <TentIcon className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Sanctuary
                </span>
                <span className="font-semibold text-gray-800 text-xs">
                  {booking.sanctuary_name}
                </span>
                <span className="text-gray-500 block text-[11px] mt-0.5">
                  {booking.sanctuary_location}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
              <TicketIcon className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Date
                </span>
                <span className="font-semibold text-gray-800 text-xs">
                  {dateFormatted}
                </span>
              </div>
            </div>

            {/* Activity */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
              <CameraIcon className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Activity
                </span>
                <span className="font-semibold text-gray-800 text-xs">
                  {booking.activity_name}
                </span>
                <span className="text-gray-500 block text-[11px] mt-0.5">
                  Duration: {booking.duration_minutes} mins
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
              <ClockIcon className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Departure Time
                </span>
                <span className="font-semibold text-gray-800 text-xs">
                  {booking.slot_time}
                </span>
              </div>
            </div>

            {/* Attendees */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3 sm:col-span-2">
              <UserIcon className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">
                  Attendees ({booking.number_of_people})
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {booking.attendees?.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-medium text-gray-700 text-[11px]"
                    >
                      {a.name} ({a.age}y, {a.id_type})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
            {isCancelled ? (
              <>
                <Link
                  to="/sanctuaries"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>Explore Sanctuaries</span>
                </Link>
                <Link
                  to="/my-bookings"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-300 text-gray-700 font-semibold text-xs hover:bg-stone-100 transition flex items-center justify-center gap-2"
                >
                  <span>Go to My Bookings</span>
                </Link>
              </>
            ) : (
              <>
                {/* 1. Download ticket */}
                <button
                  onClick={handleDownloadTicket}
                  disabled={downloading}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1F3D2B]" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>📥 Download ticket</span>
                    </>
                  )}
                </button>

                {/* 2. Cancel Booking Button */}
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-red-300 text-red-600 font-semibold text-xs hover:bg-red-50 hover:border-red-400 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Cancel and erase this booking"
                >
                  <span>✕</span>
                  <span>Cancel booking</span>
                </button>

                {/* 3. Explore more sanctuaries */}
                <Link
                  to="/sanctuaries"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-300 text-gray-700 font-semibold text-xs hover:bg-stone-100 transition flex items-center justify-center gap-2"
                >
                  <span>Explore sanctuaries</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal to Cancel & Erase Booking */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Badge */}
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-xl font-serif font-bold text-[#1F3D2B] mb-2">
              Cancel & Erase Booking?
            </h3>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to cancel your booking for <strong className="text-gray-900">{booking.sanctuary_name}</strong>?
              This will release your <strong>{booking.number_of_people} seat(s)</strong> back to the sanctuary and erase the booking record.
            </p>

            {cancelError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-gray-700 font-medium text-xs hover:bg-stone-50 transition cursor-pointer"
              >
                Keep My Booking
              </button>

              <button
                type="button"
                onClick={handleCancelAndErase}
                disabled={cancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel & Erase Booking</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
