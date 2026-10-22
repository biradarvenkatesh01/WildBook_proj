import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import client from '../../api/client';

export default function BrowseSanctuaries() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [sanctuaries, setSanctuaries] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [activity, setActivity] = useState(searchParams.get('activity') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  const fetchSanctuaries = useCallback(async (currPage = page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (activity) params.append('activity', activity);
      if (rating) params.append('rating', rating);
      params.append('page', currPage.toString());
      params.append('limit', '9');

      const res = await client.get(`/sanctuaries?${params.toString()}`);
      setSanctuaries(res.sanctuaries || []);
      setPagination(res.pagination || { total: 0, page: currPage, limit: 9, totalPages: 1 });
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load wildlife sanctuaries');
    } finally {
      setLoading(false);
    }
  }, [search, location, activity, rating, page]);

  useEffect(() => {
    fetchSanctuaries(page);
  }, [fetchSanctuaries, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSanctuaries(1);
  };

  const handleLocationChange = (val) => {
    setLocation(val);
    setPage(1);
  };

  const handleActivityChange = (val) => {
    setActivity(val);
    setPage(1);
  };

  const handleRatingChange = (val) => {
    setRating(val);
    setPage(1);
  };

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans flex flex-col justify-between selection:bg-[#D9A441] selection:text-[#1F3D2B]">
      <div>
        <Navbar />

        {/* ── Main Container ──────────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          
          {/* Header Title (Image 04) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
                Discover Sanctuaries
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Explore handpicked wildlife sanctuaries and book unforgettable experiences.
              </p>
            </div>

            {/* Quick Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search sanctuaries, locations or experiences..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#D5C9B5] bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900 shadow-xs"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </form>
          </div>

          {/* ── Filter Bar (Image 04) ────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3 mb-8 pb-4 border-b border-[#E5DAC6]">
            {/* Location filter */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#D5C9B5] shadow-xs text-xs font-semibold text-gray-700">
              <span>📍</span>
              <select
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                <option value="">All Locations</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Assam">Assam</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            {/* Activity filter */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#D5C9B5] shadow-xs text-xs font-semibold text-gray-700">
              <span>🌿</span>
              <select
                value={activity}
                onChange={(e) => handleActivityChange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                <option value="">All Activity Types</option>
                <option value="Jeep">Jeep Safaris</option>
                <option value="Boat">Boat Safaris</option>
                <option value="Bird">Bird Watching</option>
                <option value="Walk">Nature Trails</option>
                <option value="Canter">Canter Safaris</option>
              </select>
            </div>

            {/* Rating filter */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#D5C9B5] shadow-xs text-xs font-semibold text-gray-700">
              <span>⭐</span>
              <select
                value={rating}
                onChange={(e) => handleRatingChange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                <option value="">All Ratings</option>
                <option value="4.5">4.5 &amp; above</option>
                <option value="4.0">4.0 &amp; above</option>
                <option value="3.5">3.5 &amp; above</option>
              </select>
            </div>

            {(location || activity || rating || search) && (
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setActivity('');
                  setRating('');
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-red-600 hover:underline px-2"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* ── 3-Column Sanctuaries Cards Grid (Image 04) ────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-96 rounded-2xl bg-white/70 animate-pulse border border-[#E5DAC6]" />
              ))}
            </div>
          ) : sanctuaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5DAC6] shadow-xs">
              <span className="text-3xl block mb-2">🌿</span>
              <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">No sanctuaries found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No approved wildlife sanctuaries matched your current search or filter combination.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sanctuaries.map((s) => {
                const cover = s.cover_image || 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80';
                const startingPrice = s.starting_price ? Number(s.starting_price) : 200;
                const formattedPrice = `from ₹${startingPrice.toLocaleString('en-IN')} / person`;
                const hasReviews = s.total_reviews > 0 && s.average_rating > 0;
                const ratingNum = hasReviews ? Number(s.average_rating).toFixed(1) : null;
                const reviewCount = s.total_reviews || 0;

                return (
                  <div
                    key={s.sanctuary_id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#E5DAC6] shadow-xs hover:shadow-lg transition duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cover Photo */}
                      <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                        <img
                          src={cover}
                          alt={s.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#1F3D2B] shadow-xs flex items-center gap-1">
                          {hasReviews ? (
                            <>
                              <span className="text-amber-500">★</span>
                              <span>{ratingNum}</span>
                              <span className="text-gray-400 font-normal">({reviewCount})</span>
                            </>
                          ) : (
                            <span className="text-emerald-800 font-semibold text-[11px]">🌿 New</span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h2 className="font-serif text-lg font-bold text-[#1F3D2B] group-hover:text-[#D9A441] transition line-clamp-1 mb-1">
                          {s.name}
                        </h2>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="truncate">{s.location}</span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Price & View Button (Image 04) */}
                    <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-medium">Starting Price</span>
                        <span className="text-xs font-bold text-[#1F3D2B]">{formattedPrice}</span>
                      </div>

                      <Link
                        to={`/sanctuaries/${s.sanctuary_id}`}
                        className="px-4 py-2 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition shadow-xs"
                      >
                        View sanctuary
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination Controls ─────────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-xl border border-[#D5C9B5] bg-white flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                &larr;
              </button>

              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                      page === pageNum
                        ? 'bg-[#1F3D2B] text-white shadow-xs'
                        : 'border border-[#D5C9B5] bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="w-9 h-9 rounded-xl border border-[#D5C9B5] bg-white flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                &rarr;
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
