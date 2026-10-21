import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

export default function MySanctuaries() {
  const [sanctuaries, setSanctuaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSanctuaries = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await client.get('/admin/sanctuaries');
      setSanctuaries(res.sanctuaries || []);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load sanctuaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSanctuaries();
  }, []);

  return (
    <AdminLayout activeTitle="My Sanctuaries">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        
        {/* ── Page Header (Design 17) ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DAC6] shadow-xs flex items-center justify-center text-[#1F3D2B] shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2C6.5 2 2 7 2 12c0 4.4 2.9 8.1 6.9 9.5M12 2c5.5 0 10 5 10 10s-4.5 10-10 10M12 2v20M2 12h20"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-serif text-[#1F3D2B] font-bold">
                My Sanctuaries
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage and track all your sanctuary submissions.
              </p>
            </div>
          </div>

          {/* Add New Sanctuary Button */}
          <Link
            to="/admin/sanctuaries/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] active:scale-[0.98] transition shadow-sm shadow-[#D9A441]/20 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add new sanctuary
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {/* ── Sanctuaries Grid (Design 17) ──────────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#1F3D2B]/20 border-t-[#1F3D2B] rounded-full animate-spin mb-3" />
            <p className="text-xs text-gray-500">Loading your sanctuary listings...</p>
          </div>
        ) : sanctuaries.length === 0 ? (
          <div className="bg-white border border-[#E5DAC6] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#1F3D2B]/5 flex items-center justify-center text-[#1F3D2B] mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.5 2 2 7 2 12c0 4.4 2.9 8.1 6.9 9.5M12 2c5.5 0 10 5 10 10s-4.5 10-10 10M12 2v20M2 12h20"/>
              </svg>
            </div>
            <h3 className="text-xl font-serif text-[#1F3D2B] mb-2 font-semibold">
              No Sanctuaries Added Yet
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Start by creating a sanctuary draft, uploading photos, setting operating hours, and configuring safari activities.
            </p>
            <Link
              to="/admin/sanctuaries/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition"
            >
              + Add your first sanctuary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sanctuaries.map((sanctuary) => {
              const coverImg =
                sanctuary.cover_image ||
                'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80';

              const lastUpdated = new Date(sanctuary.reviewed_at || sanctuary.created_at).toLocaleDateString(
                'en-GB',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }
              );

              const isPending = sanctuary.listing_status === 'PENDING';
              const isRejected = sanctuary.listing_status === 'REJECTED';

              return (
                <div
                  key={sanctuary.sanctuary_id}
                  className="bg-white rounded-2xl border border-[#E5DAC6] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Card Media Header */}
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={coverImg}
                        alt={sanctuary.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={sanctuary.listing_status} size="sm" />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <h3 className="text-base font-serif font-bold text-[#1F3D2B] mb-1 line-clamp-1">
                        {sanctuary.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate">{sanctuary.location}</span>
                      </div>

                      {/* Rejection Note Alert (Design 17) */}
                      {isRejected && (
                        <div className="mb-3 p-3 rounded-xl bg-red-50/80 border border-red-200 text-xs">
                          <span className="block font-semibold text-red-800 text-[11px] mb-0.5">
                            Reviewer&rsquo;s note
                          </span>
                          <p className="text-red-700 italic text-[11px] leading-relaxed">
                            {sanctuary.review_note || 'Please update sanctuary details and images for re-evaluation.'}
                          </p>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-400">
                        Last updated: {lastUpdated}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-0">
                    {isRejected ? (
                      <Link
                        to={`/admin/sanctuaries/${sanctuary.sanctuary_id}/edit`}
                        className="w-full py-2 px-3 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition text-center block shadow-xs"
                      >
                        Edit and resubmit
                      </Link>
                    ) : isPending ? (
                      <div className="py-2 px-3 rounded-xl bg-amber-50 text-amber-800 text-xs text-center border border-amber-200 font-medium">
                        Under authority review
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/admin/sanctuaries/${sanctuary.sanctuary_id}/edit`}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-white border border-[#D5C9B5] text-[#1F3D2B] font-medium text-xs hover:bg-gray-50 transition text-center"
                        >
                          Manage details
                        </Link>
                        <span className="text-[10px] text-gray-400">
                          {sanctuary.image_count} photos
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
