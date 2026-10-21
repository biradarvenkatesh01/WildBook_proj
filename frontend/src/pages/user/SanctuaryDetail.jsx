import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import client from '../../api/client';

export default function SanctuaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sanctuary, setSanctuary] = useState(null);
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingsSummary, setRatingsSummary] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function loadSanctuary() {
      try {
        setLoading(true);
        setError('');
        const res = await client.get(`/sanctuaries/${id}`);
        setSanctuary(res.sanctuary);
        setImages(res.images || []);
        setActivities(res.activities || []);
        setReviews(res.reviews || []);
        setRatingsSummary(res.ratings_summary || null);

        if (res.images && res.images.length > 0) {
          const cover = res.images.find((img) => img.is_cover) || res.images[0];
          setActivePhoto(cover.image_path);
        }
      } catch (err) {
        setError(err.data?.error || err.message || 'Sanctuary not found or currently inactive');
      } finally {
        setLoading(false);
      }
    }
    loadSanctuary();
  }, [id]);

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

  if (error || !sanctuary) {
    return (
      <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <span className="text-4xl block mb-3">🌲</span>
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Sanctuary Not Found</h1>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            {error || 'This sanctuary is not currently listed on the public WildBook registry.'}
          </p>
          <Link
            to="/sanctuaries"
            className="px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition"
          >
            &larr; Return to Browse Sanctuaries
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Google Maps Coordinates Query Link
  const mapQuery = sanctuary.latitude && sanctuary.longitude
    ? `${sanctuary.latitude},${sanctuary.longitude}`
    : `${encodeURIComponent(sanctuary.name + ' ' + sanctuary.location)}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const ratingNum = sanctuary.average_rating > 0 ? Number(sanctuary.average_rating).toFixed(1) : '4.8';
  const reviewsCount = sanctuary.total_reviews > 0 ? sanctuary.total_reviews : reviews.length || 326;

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans selection:bg-[#D9A441] selection:text-[#1F3D2B]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        
        {/* ── Breadcrumb Bar (Image 05) ─────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span>&gt;</span>
          <Link to="/sanctuaries" className="hover:text-gray-900 transition">Destinations</Link>
          <span>&gt;</span>
          <span>India</span>
          <span>&gt;</span>
          <span className="text-gray-800 font-semibold truncate max-w-xs">{sanctuary.name}</span>
        </nav>

        {/* ── 2-Column Main Layout (Image 05) ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ LEFT COLUMN: Gallery, About, Activities, Reviews (8 cols) ══ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Gallery Section */}
            <div>
              {/* Hero Image Card */}
              <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-black/10 border border-[#E5DAC6] shadow-sm group">
                <img
                  src={activePhoto || sanctuary.cover_image || 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80'}
                  alt={sanctuary.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                />
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>📷</span>
                    <span>View all {images.length} photos</span>
                  </button>
                )}
              </div>

              {/* Thumbnails Strip */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2.5 mt-3">
                  {images.slice(0, 5).map((img, idx) => (
                    <button
                      key={img.image_id}
                      type="button"
                      onClick={() => setActivePhoto(img.image_path)}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition ${
                        activePhoto === img.image_path
                          ? 'border-[#D9A441] shadow-sm'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.image_path}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sanctuary Overview Info */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DAC6] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
                    {sanctuary.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>📍</span>
                    <span>{sanctuary.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-gray-200 self-start">
                  <span className="text-amber-500 font-bold">★</span>
                  <span className="text-xs font-bold text-[#1F3D2B]">{ratingNum}</span>
                  <span className="text-xs text-gray-400">({reviewsCount} reviews)</span>
                </div>
              </div>

              {/* About Section */}
              <div className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🍃</span>
                  <h2 className="font-serif text-lg font-bold text-[#1F3D2B]">About</h2>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans whitespace-pre-line">
                  {sanctuary.description}
                </p>
              </div>
            </div>

            {/* Activities Offered Section (Image 05) */}
            <div id="activities" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DAC6] shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">🐾</span>
                <h2 className="font-serif text-xl font-bold text-[#1F3D2B]">Activities Offered</h2>
              </div>

              {activities.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No public safaris currently listed for this sanctuary.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activities.map((act) => (
                    <div
                      key={act.activity_id}
                      className="rounded-2xl border border-[#E5DAC6] bg-[#FAF8F5] p-5 flex flex-col justify-between hover:border-[#D9A441] transition duration-200 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-serif text-base font-bold text-[#1F3D2B] group-hover:text-[#D9A441] transition">
                            {act.activity_name}
                          </h3>
                          <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                            {Math.floor(act.duration_minutes / 60)}h {act.duration_minutes % 60 ? `${act.duration_minutes % 60}m` : ''}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                          {act.description || 'Guided expedition into core reserve zones.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase font-medium">Price</span>
                          <span className="text-xs font-bold text-[#1F3D2B]">
                            From ₹{Number(act.price).toLocaleString('en-IN')} <span className="font-normal text-gray-500 text-[11px]">/ person</span>
                          </span>
                        </div>

                        <Link
                          to={`/activities/${act.activity_id}`}
                          className="px-4 py-2 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition shadow-xs"
                        >
                          View slots &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guest Reviews Section (Image 05) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DAC6] shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <h2 className="font-serif text-xl font-bold text-[#1F3D2B]">Guest Reviews</h2>
                </div>
              </div>

              {/* Reviews Summary Header */}
              {(() => {
                const avgRating = ratingsSummary?.average_rating ?? Number(sanctuary?.average_rating || 0);
                const totalReviewsCount = ratingsSummary?.total_reviews ?? Number(sanctuary?.total_reviews || reviews.length);
                const counts = ratingsSummary?.counts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

                const starBars = [5, 4, 3, 2, 1].map((stars) => {
                  const count = counts[stars] || 0;
                  const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                  return { stars, count, pct: `${pct}%` };
                });

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-8 pb-6 border-b border-gray-100">
                      <div className="text-center sm:text-left shrink-0">
                        <span className="text-4xl font-serif font-bold text-[#1F3D2B] block">
                          {avgRating.toFixed(1)}
                        </span>
                        <div className="text-amber-500 text-sm mt-0.5">
                          {'★'.repeat(Math.round(avgRating) || 5)}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 block">
                          Based on {totalReviewsCount} reviews
                        </span>
                      </div>

                      {/* 5-to-1 Rating Distribution Bars */}
                      <div className="flex-1 space-y-1.5 text-xs text-gray-500">
                        {starBars.map((bar) => (
                          <div key={bar.stars} className="flex items-center gap-2">
                            <span className="w-6 text-right font-medium">{bar.stars}★</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full bg-[#1F3D2B] rounded-full transition-all duration-500"
                                style={{ width: bar.pct }}
                              />
                            </div>
                            <span className="w-8 text-[11px] text-gray-400">{bar.pct}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="pt-6 space-y-4">
                      {reviews.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-500 bg-[#FAF8F5] rounded-xl border border-gray-100">
                          <span className="text-2xl block mb-1">🌿</span>
                          No reviews yet for this sanctuary.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reviews.map((r) => (
                            <div
                              key={r.review_id}
                              className="p-4 rounded-xl bg-[#FAF8F5] border border-gray-100 text-xs flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {r.profile_image ? (
                                      <img
                                        src={r.profile_image}
                                        alt={r.reviewer_name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-[10px] font-bold flex items-center justify-center">
                                        {(r.reviewer_name || 'V')[0]}
                                      </div>
                                    )}
                                    <span className="font-semibold text-gray-800">
                                      {r.reviewer_name}
                                    </span>
                                  </div>
                                  <span className="text-amber-500 font-bold">
                                    {'★'.repeat(r.rating)}
                                  </span>
                                </div>
                                <p className="text-gray-600 leading-relaxed italic">
                                  &ldquo;{r.comment}&rdquo;
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-400 block mt-3">
                                {new Date(r.created_at).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

          </div>

          {/* ════ RIGHT COLUMN: Sticky Information Sidebar (4 cols) ═══════════ */}
          <div className="lg:col-span-4 space-y-5 sticky top-6">
            
            {/* Location & Map Card (Image 05) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-xs">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Location
              </h3>
              
              {/* Map Preview graphic */}
              <div className="aspect-16/9 rounded-xl bg-[#EAF1EA] border border-[#BDDDBD] flex flex-col items-center justify-center p-4 relative overflow-hidden mb-3">
                <div className="text-3xl mb-1 animate-bounce">📍</div>
                <span className="text-xs font-bold text-[#1F3D2B] text-center line-clamp-1">
                  {sanctuary.name}
                </span>
                <span className="text-[10px] text-gray-500">{sanctuary.location}</span>
              </div>

              {/* Open in Google Maps Link */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#1F3D2B] hover:text-[#D9A441] flex items-center justify-center gap-1.5 transition py-2 rounded-xl bg-[#FAF8F5] border border-gray-200"
              >
                <span>↗</span>
                <span>Open in Google Maps</span>
              </a>
            </div>

            {/* Opening Hours Card (Image 05) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-xs">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Opening Hours
              </h3>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-gray-700">{sanctuary.operating_days || 'Monday - Sunday'}</span>
                <span className="font-bold text-[#1F3D2B]">
                  {sanctuary.opening_time ? `${sanctuary.opening_time.slice(0, 5)} - ${sanctuary.closing_time.slice(0, 5)}` : '5:30 AM - 6:30 PM'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 italic">
                Safari slots vary by season and forestry permit hours.
              </p>
            </div>

            {/* Best Time to Visit Card (Image 05) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5DAC6] shadow-xs">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Best Time to Visit
              </h3>
              <span className="text-sm font-serif font-bold text-[#1F3D2B] block">
                {sanctuary.best_time_to_visit || 'October to June'}
              </span>
              <p className="text-[11px] text-gray-500 mt-1">
                Peak wildlife predator sightings occur during dry summer and winter months.
              </p>
            </div>

            {/* Book an Experience Button */}
            <a
              href="#activities"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D9A441] hover:bg-[#c99534] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider transition shadow-md block text-center active:scale-[0.99]"
            >
              Book an experience &darr;
            </a>

          </div>

        </div>

      </main>

      {/* ── Photo Lightbox Modal ──────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePhoto}
              alt={sanctuary.name}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-3 bg-black/80 flex items-center justify-between text-white text-xs">
              <span>{sanctuary.name} Gallery</span>
              <button onClick={() => setLightboxOpen(false)} className="font-bold px-2 py-1 hover:text-[#D9A441]">
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
