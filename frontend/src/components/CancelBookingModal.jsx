import { useState, useEffect } from 'react';
import client from '../api/client';

export default function CancelBookingModal({ isOpen, bookingId, onClose, onCancelled }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [eraseRecord, setEraseRecord] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    async function loadPreview() {
      try {
        setLoading(true);
        setError(null);
        const data = await client.get(`/bookings/${bookingId}/cancel-preview`);
        setPreview(data);
      } catch (err) {
        console.error('Failed to load cancel preview:', err);
        setError(err.message || 'Unable to retrieve cancellation breakdown.');
      } finally {
        setLoading(false);
      }
    }

    loadPreview();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      setError(null);
      const res = eraseRecord
        ? await client.delete(`/bookings/${bookingId}`)
        : await client.post(`/bookings/${bookingId}/cancel`);
      if (res.success) {
        onCancelled(res);
        onClose();
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-lg transition cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-1.5">
          Cancel this booking?
        </h2>
        <p className="text-xs text-gray-600 max-w-sm mx-auto mb-6">
          You're about to cancel this booking. Please review the details and cancellation charges below.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3D2B]" />
          </div>
        ) : preview ? (
          <div className="space-y-5 text-left">
            {/* Mini Booking Preview Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-3.5">
              {preview.cover_image ? (
                <img
                  src={preview.cover_image}
                  alt={preview.sanctuary_name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#1F3D2B]/10 flex items-center justify-center text-xl shrink-0">
                  🌿
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-sm text-[#1F3D2B] truncate">
                  {preview.sanctuary_name}
                </h4>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  <span>{new Date(preview.slot_date).toLocaleDateString()}</span>
                  <span className="mx-1">•</span>
                  <span>{preview.number_of_people} Guests</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                  Booking ID: {preview.booking_code}
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FCFBF7] border border-stone-200/90 space-y-3 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Amount paid</span>
                <span className="font-medium text-gray-900">
                  ₹{Number(preview.amount_paid).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between text-red-600 font-medium">
                <span>Cancellation fee (40%)</span>
                <span>- ₹{Number(preview.fee_amount).toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-stone-200 pt-2.5 flex items-center justify-between text-sm font-bold text-emerald-700">
                <span>Refund amount (60%)</span>
                <span>₹{Number(preview.refund_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Erase Booking Option (No separate table) */}
            <label className="flex items-center gap-2.5 text-xs text-gray-700 bg-stone-50 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-100 transition">
              <input
                type="checkbox"
                checked={eraseRecord}
                onChange={(e) => setEraseRecord(e.target.checked)}
                className="rounded text-[#1F3D2B] focus:ring-[#D9A441] w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] font-medium">
                Erase booking record completely & immediately release seats
              </span>
            </label>

            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              Refund will be processed to the original payment method within 7–10 business days.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1F3D2B] text-white font-semibold text-xs hover:bg-[#162d20] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🌿</span>
                <span>Keep booking</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 px-4 rounded-xl border border-red-300 text-red-600 font-semibold text-xs hover:bg-red-50 transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {cancelling ? (
                  <span>Cancelling...</span>
                ) : (
                  <>
                    <span>✕</span>
                    <span>Confirm cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
