import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import client from '../../api/client';

export default function SanctuaryReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sanctuary, setSanctuary] = useState(null);
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [slotsSummary, setSlotsSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Review Checklist state
  const [checks, setChecks] = useState({
    imagesVerified: false,
    detailsAccurate: false,
    pricingReasonable: false,
  });

  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Lightbox modal

  const allChecksPassed = checks.imagesVerified && checks.detailsAccurate && checks.pricingReasonable;

  useEffect(() => {
    async function fetchSanctuaryReviewData() {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await client.get(`/owner/sanctuaries/${id}`);
        setSanctuary(res.sanctuary);
        setImages(res.images || []);
        setActivities(res.activities || []);
        setSlotsSummary(res.slots_summary || []);
      } catch (err) {
        setErrorMsg(err.data?.error || err.message || 'Failed to load sanctuary submission');
      } finally {
        setLoading(false);
      }
    }
    fetchSanctuaryReviewData();
  }, [id]);

  const handleDecision = async (decision) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (decision === 'REJECTED' && (!reviewNote || reviewNote.trim().length === 0)) {
      setErrorMsg('A review note is required when rejecting a sanctuary submission.');
      return;
    }

    if (decision === 'APPROVED' && !allChecksPassed) {
      setErrorMsg('All three checklist items must be verified before approving.');
      return;
    }

    setProcessing(true);
    try {
      const res = await client.patch(`/owner/sanctuaries/${id}`, {
        decision,
        note: reviewNote,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        navigate('/owner/sanctuary-requests');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.data?.error || err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout activeTitle="Sanctuary Review">
        <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#162B1D]" />
        </div>
      </OwnerLayout>
    );
  }

  if (errorMsg && !sanctuary) {
    return (
      <OwnerLayout activeTitle="Sanctuary Review">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {errorMsg}
          </div>
          <div className="mt-4">
            <Link to="/owner/sanctuary-requests" className="text-xs font-semibold text-[#162B1D] underline">
              &larr; Back to sanctuary requests
            </Link>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  const coverImage = images.find((i) => i.is_cover) || images[0];
  const submittedDate = sanctuary.created_at
    ? new Date(sanctuary.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <OwnerLayout activeTitle="Sanctuary review">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
        
        {/* ── Top Header Bar ────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link to="/owner/sanctuary-requests" className="hover:text-gray-900 transition">
                Sanctuary Requests
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">Review</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#162B1D] font-bold">
              Sanctuary review
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review sanctuary submission before listing
            </p>
          </div>

          <Link
            to="/owner/sanctuary-requests"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            &larr; Back to queue
          </Link>
        </div>

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* ── 2-Column Split Layout (Design 24) ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ════ LEFT COLUMN: Sanctuary Submission Preview (approx 8 cols) ══ */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main Preview Container */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5DAC6] shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-4">
                SANCTUARY SUBMISSION PREVIEW
              </span>

              {/* Sanctuary Header Snippet */}
              <div className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-gray-100">
                {coverImage ? (
                  <img
                    src={coverImage.image_path}
                    alt={sanctuary.name}
                    className="w-full sm:w-56 h-36 object-cover rounded-xl border border-gray-200 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-full sm:w-56 h-36 bg-[#F6F1E7] rounded-xl flex items-center justify-center text-gray-400 text-xs shrink-0">
                    No cover photo
                  </div>
                )}

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h2 className="text-xl md:text-2xl font-serif text-[#162B1D] font-bold">
                        {sanctuary.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sanctuary.listing_status === 'PENDING' ? 'New submission' : sanctuary.listing_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{sanctuary.location}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 space-y-0.5 pt-2 border-t border-gray-50">
                    <div>
                      <span className="text-gray-400">Submitted on:</span> {submittedDate}
                    </div>
                    <div>
                      <span className="text-gray-400">Submitted by:</span> {sanctuary.admin_name} ({sanctuary.admin_email})
                    </div>
                    {sanctuary.organisation_name && (
                      <div>
                        <span className="text-gray-400">Organisation:</span> {sanctuary.organisation_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="py-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    IMAGE GALLERY ({images.length})
                  </h3>
                  {images.length > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium">Click to inspect</span>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={img.image_id}
                      onClick={() => setSelectedPhoto(img)}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer border border-gray-200 hover:shadow-md transition"
                    >
                      <img
                        src={img.image_path}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {img.is_cover && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-[#D9A441] text-[9px] font-bold rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="py-6 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  DESCRIPTION
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans">
                  {sanctuary.description}
                </p>

                {/* Additional Sanctuary Facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Hours</span>
                    <span className="text-gray-700 font-medium">
                      {sanctuary.opening_time ? `${sanctuary.opening_time.slice(0, 5)} - ${sanctuary.closing_time.slice(0, 5)}` : 'Year-round'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Operating Days</span>
                    <span className="text-gray-700 font-medium">{sanctuary.operating_days || 'All days'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Best Time</span>
                    <span className="text-gray-700 font-medium">{sanctuary.best_time_to_visit || 'Nov to May'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Contact</span>
                    <span className="text-gray-700 font-medium">{sanctuary.contact_phone || sanctuary.contact_email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Activities & Pricing and Slots Summary (Side-by-Side) */}
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Activities & Pricing Table */}
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                    ACTIVITIES &amp; PRICING
                  </h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-gray-500 font-semibold border-b border-gray-100 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Activity</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3 text-right">Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activities.map((act) => (
                          <tr key={act.activity_id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 font-medium text-gray-800">
                              {act.activity_name}
                            </td>
                            <td className="py-2.5 px-3 text-gray-500">
                              {Math.floor(act.duration_minutes / 60)}h {act.duration_minutes % 60 ? `${act.duration_minutes % 60}m` : ''}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-gray-900 text-right">
                              ₹{Number(act.price).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Slots Summary Table */}
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                    SLOTS SUMMARY
                  </h3>
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-gray-500 font-semibold border-b border-gray-100 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Activity</th>
                          <th className="py-2.5 px-3">Weekdays</th>
                          <th className="py-2.5 px-3 text-right">Weekends</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {slotsSummary.map((s) => (
                          <tr key={s.activity_id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3 font-medium text-gray-800">
                              {s.activity_name}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              {s.weekday_slots} slots/week
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 text-right">
                              {s.weekend_slots} slots/week
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ════ RIGHT COLUMN: Review Checklist & Decision (approx 4 cols) ══ */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E5DAC6] shadow-xs space-y-6 sticky top-6">
            
            {/* Checklist */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                REVIEW CHECKLIST
              </h3>

              <div className="space-y-4">
                {/* 1. Images verified */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checks.imagesVerified}
                    onChange={(e) => setChecks({ ...checks, imagesVerified: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-[#162B1D]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block group-hover:text-emerald-900 transition">
                      Images verified
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                      All images are clear, relevant, and appropriately represent the sanctuary.
                    </span>
                  </div>
                </label>

                {/* 2. Details accurate */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checks.detailsAccurate}
                    onChange={(e) => setChecks({ ...checks, detailsAccurate: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-[#162B1D]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block group-hover:text-emerald-900 transition">
                      Details accurate
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                      Sanctuary details, description, and activities are complete and accurate.
                    </span>
                  </div>
                </label>

                {/* 3. Pricing reasonable */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checks.pricingReasonable}
                    onChange={(e) => setChecks({ ...checks, pricingReasonable: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer accent-[#162B1D]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block group-hover:text-emerald-900 transition">
                      Pricing reasonable
                    </span>
                    <span className="text-[11px] text-gray-500 leading-relaxed block mt-0.5">
                      Activity pricing is appropriate and aligned with state forestry guidelines.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Review Note */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                REVIEW NOTE
              </label>
              <textarea
                rows="4"
                maxLength={1000}
                placeholder="Add a note (optional for approval, required for rejection)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-[#162B1D] focus:outline-none resize-none text-gray-800"
              />
              <div className="flex justify-end text-[10px] text-gray-400 mt-1">
                {reviewNote.length} / 1000 characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {/* Approve and list (Enabled only when all three are checked) */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => handleDecision('APPROVED')}
                  disabled={!allChecksPassed || processing}
                  className="w-full py-3 px-4 rounded-xl bg-[#162B1D] text-white font-semibold text-xs hover:bg-[#0f1f14] active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Approve and list</span>
                </button>
                {!allChecksPassed && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-lg pointer-events-none text-center z-30">
                    Tick all three verification checkboxes to enable approval.
                  </div>
                )}
              </div>

              {/* Reject with note */}
              <button
                type="button"
                onClick={() => handleDecision('REJECTED')}
                disabled={processing}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Reject with note</span>
              </button>
            </div>

          </div>

        </div>

        {/* ── Photo Lightbox Modal ──────────────────────────────────────────── */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl bg-black">
              <img
                src={selectedPhoto.image_path}
                alt="Enlarged gallery view"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 text-white bg-black/60 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </OwnerLayout>
  );
}
