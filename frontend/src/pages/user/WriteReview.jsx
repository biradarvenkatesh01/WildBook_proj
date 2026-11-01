import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import client from '../../api/client';
import { LeafIcon, StarIcon, MapPinIcon } from '../../components/Icons';

const RATING_LABELS = {
  1: '1 Star — Poor experience',
  2: '2 Stars — Fair, needs improvement',
  3: '3 Stars — Good experience',
  4: '4 Stars — Very good safari',
  5: '5 Stars — Exceptional & unforgettable!',
};

export default function WriteReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get(`/reviews/booking/${bookingId}`);
        setBooking(res.booking);

        // If already reviewed, pre-fill rating and comment
        if (res.booking?.review_id) {
          setRating(res.booking.rating);
          setComment(res.booking.comment || '');
        }
      } catch (err) {
        console.error('Failed to load review context:', err);
        setError(err.message || 'Unable to retrieve booking details for review.');
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmitting(true);
      await client.post('/reviews', {
        booking_id: Number(bookingId),
        rating: Number(rating),
        comment: comment.trim(),
      });

      // Redirect back to My Bookings
      navigate('/my-bookings', {
        state: { message: 'Thank you! Your verified review has been published.' },
      });
    } catch (err) {
      console.error('Review submit error:', err);
      setError(err.message || 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
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
          <LeafIcon className="w-12 h-12 text-[#1F3D2B]/50 mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Booking Not Found</h1>
          <p className="text-xs text-gray-600 mb-6">{error || 'This safari reservation could not be found.'}</p>
          <Link
            to="/my-bookings"
            className="px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition"
          >
            Return to My Bookings
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const alreadyReviewed = Boolean(booking.review_id);
  const activeRating = hoverRating || rating;

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            Write a Review
          </h1>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Share your experience and help fellow travelers discover the magic of nature.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between max-w-4xl mx-auto">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-stone-200/80 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sanctuary Card Preview */}
          <div className="md:col-span-5 bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-4">
            {booking.cover_image ? (
              <img
                src={booking.cover_image}
                alt={booking.sanctuary_name}
                className="w-full h-48 rounded-xl object-cover border border-stone-200 shadow-xs"
              />
            ) : (
              <div className="w-full h-48 rounded-xl bg-[#1F3D2B]/10 flex items-center justify-center">
                <LeafIcon className="w-10 h-10 text-[#1F3D2B]/40" />
              </div>
            )}

            <div>
              <h2 className="font-serif font-bold text-lg text-[#1F3D2B]">
                {booking.sanctuary_name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <MapPinIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{booking.sanctuary_location}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Activity:</span>
                <span className="font-semibold">{booking.activity_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Date Visited:</span>
                <span className="font-medium">
                  {new Date(booking.slot_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Booking Code:</span>
                <span className="font-mono text-gray-700 font-medium">
                  {booking.booking_code}
                </span>
              </div>
            </div>

            {booking.sanctuary_description && (
              <p className="text-[11px] text-gray-500 leading-relaxed italic line-clamp-3 pt-1">
                &ldquo;{booking.sanctuary_description}&rdquo;
              </p>
            )}
          </div>

          {/* Right Column: Review Inputs */}
          <div className="md:col-span-7">
            {alreadyReviewed ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
                <StarIcon className="w-8 h-8 text-amber-400 mx-auto mb-2 fill-amber-400" filled />
                <h3 className="font-serif font-bold text-base text-[#1F3D2B] mb-1">
                  Review Already Submitted
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  You reviewed this safari expedition with {booking.rating} stars.
                </p>
                {booking.comment && (
                  <p className="text-xs text-gray-700 italic bg-white p-4 rounded-xl border border-stone-200 mb-6">
                    &ldquo;{booking.comment}&rdquo;
                  </p>
                )}
                <Link
                  to="/my-bookings"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#1F3D2B] text-white font-semibold text-xs hover:bg-[#162d20] transition"
                >
                  Back to My Bookings
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-amber-400 hover:scale-110 transition-transform focus:outline-none p-1"
                        aria-label={`Rate ${star} star`}
                      >
                        <StarIcon
                          className={`w-8 h-8 ${star <= activeRating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                          filled={star <= activeRating}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">
                    {RATING_LABELS[activeRating] || 'Click on a star to rate'}
                  </p>
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                    Share your experience
                  </label>
                  <div className="relative">
                    <textarea
                      rows={5}
                      maxLength={1000}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about your experience (wildlife sightings, naturalist guide, vehicle comfort, scenery)..."
                      className="w-full px-4 py-3 rounded-2xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50 leading-relaxed resize-none"
                    />
                    <div className="text-[10px] text-gray-400 text-right mt-1">
                      {comment.length} / 1000
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1F3D2B]" />
                        <span>Submitting review...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
