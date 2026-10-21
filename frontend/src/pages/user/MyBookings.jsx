import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import CancelBookingModal from '../../components/CancelBookingModal';
import client from '../../api/client';

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({ upcoming: 0, past: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchBookings = async (tab) => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.get(`/bookings/mine?tab=${tab}`);
      setBookings(res.bookings || []);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  const handleDownloadTicket = async (booking) => {
    try {
      setDownloadingId(booking.booking_id);
      const token = localStorage.getItem('wb_token');
      const response = await fetch(`/api/bookings/${booking.booking_id}/ticket`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF ticket');
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
      console.error('Download ticket error:', err);
      alert('Could not download ticket PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBookingCancelled = (cancelResult) => {
    setCancelSuccessMsg(
      `Booking cancelled successfully. A refund of ₹${Number(cancelResult.refund_amount).toLocaleString('en-IN')} has been initiated.`
    );
    fetchBookings(activeTab);
  };

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            My Bookings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your safari bookings
          </p>
        </div>

        {/* Success Alert */}
        {cancelSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{cancelSuccessMsg}</span>
            </div>
            <button
              onClick={() => setCancelSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-300 mb-8 space-x-6 sm:space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'upcoming'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>📅 Upcoming</span>
            {counts.upcoming > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-[10px]">
                {counts.upcoming}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'past'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>⏱ Past</span>
            {counts.past > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-gray-700 text-[10px]">
                {counts.past}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'cancelled'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>✕ Cancelled</span>
            {counts.cancelled > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">
                {counts.cancelled}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F3D2B]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs max-w-lg mx-auto my-8">
            <span className="text-4xl block mb-3">🌿</span>
            <h3 className="text-xl font-serif font-bold text-[#1F3D2B] mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? 'You do not have any upcoming safari reservations scheduled.'
                : activeTab === 'past'
                ? 'You have not completed any safari expeditions yet.'
                : 'You have no cancelled reservations.'}
            </p>
            <Link
              to="/sanctuaries"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-xs"
            >
              Explore Sanctuaries
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const isUpcoming = b.status === 'CONFIRMED' && !b.is_past;
              const isPast = b.status === 'CONFIRMED' && b.is_past;
              const isCancelled = b.status === 'CANCELLED';

              const dateFormatted = b.slot_date
                ? new Date(b.slot_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <div
                  key={b.booking_id}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200/80 hover:border-stone-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    {b.cover_image ? (
                      <img
                        src={b.cover_image}
                        alt={b.sanctuary_name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 border border-stone-200"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#1F3D2B]/10 flex items-center justify-center text-3xl shrink-0">
                        🐘
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#1F3D2B] truncate">
                        {b.sanctuary_name}
                      </h3>
                      <p className="text-xs font-medium text-stone-600 truncate">
                        {b.activity_name}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                        <span className="flex items-center gap-1">
                          <span>📅</span> {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>⏰</span> {b.slot_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👥</span> {b.number_of_people}{' '}
                          {b.number_of_people === 1 ? 'Adult' : 'Adults'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-gray-400 pt-0.5">
                        Booking ID: <span className="font-semibold text-gray-700">{b.booking_code}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge & Contextual Actions */}
                  <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                    {/* Status Badge */}
                    {isUpcoming && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                        <span>✓</span> Confirmed
                      </span>
                    )}
                    {isPast && (
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-gray-700 text-[11px] font-semibold flex items-center gap-1">
                        <span>⏱</span> Past
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold flex items-center gap-1">
                        <span>✕</span> Cancelled
                      </span>
                    )}

                    {/* Action Buttons based on state */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {/* View Ticket (All states get View Ticket) */}
                      <button
                        type="button"
                        onClick={() => handleDownloadTicket(b)}
                        disabled={downloadingId === b.booking_id}
                        className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {downloadingId === b.booking_id ? (
                          <span>Loading PDF...</span>
                        ) : (
                          <>
                            <span>📄</span>
                            <span>View ticket</span>
                          </>
                        )}
                      </button>

                      {/* Upcoming gets Cancel button */}
                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => setCancelModalId(b.booking_id)}
                          className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-red-300 text-red-600 font-semibold text-xs hover:bg-red-50 transition shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>✕</span>
                          <span>Cancel booking</span>
                        </button>
                      )}

                      {/* Past gets Write a Review button */}
                      {isPast && (
                        <Link
                          to={`/review/${b.booking_id}`}
                          className="flex-1 md:flex-none px-4 py-2 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-semibold text-xs hover:bg-[#1F3D2B]/5 transition shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>⭐</span>
                          <span>Write a review</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Page 11 Cancel Modal */}
      <CancelBookingModal
        isOpen={Boolean(cancelModalId)}
        bookingId={cancelModalId}
        onClose={() => setCancelModalId(null)}
        onCancelled={handleBookingCancelled}
      />

      <Footer />
    </div>
  );
}
