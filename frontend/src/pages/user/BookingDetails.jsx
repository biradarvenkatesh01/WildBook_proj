import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Stepper from '../../components/Stepper';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ID_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'PAN', label: 'PAN Card' },
];

export default function BookingDetails() {
  const { slotId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialCount = Math.max(1, parseInt(searchParams.get('people') || '1', 10));

  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Attendees list
  const [attendees, setAttendees] = useState(() =>
    Array.from({ length: initialCount }, (_, i) => ({
      name: i === 0 && user?.name ? user.name : '',
      age: '',
      id_type: 'AADHAAR',
      id_number: '',
    }))
  );

  useEffect(() => {
    async function loadSlotInfo() {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get(`/bookings/slot/${slotId}`);
        setSlot(res.slot);
      } catch (err) {
        console.error('Failed to load slot information:', err);
        setError(err.message || 'Unable to load slot details. Please re-select a safari slot.');
      } finally {
        setLoading(false);
      }
    }
    loadSlotInfo();
  }, [slotId]);

  const handleAddAttendee = () => {
    if (slot && attendees.length >= slot.available_seats) {
      alert(`Maximum capacity reached for this slot (${slot.available_seats} seats available).`);
      return;
    }
    setAttendees((prev) => [
      ...prev,
      { name: '', age: '', id_type: 'AADHAAR', id_number: '' },
    ]);
  };

  const handleRemoveAttendee = (index) => {
    if (attendees.length <= 1) return;
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttendeeChange = (index, field, value) => {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name.trim()) {
        setError(`Please enter the full name for Attendee ${i + 1}.`);
        return;
      }
      const ageNum = parseInt(a.age, 10);
      if (isNaN(ageNum) || ageNum <= 0) {
        setError(`Please enter a valid age (> 0) for Attendee ${i + 1}.`);
        return;
      }
      if (!a.id_number.trim()) {
        setError(`Please enter the ID number for Attendee ${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await client.post('/bookings', {
        slot_id: Number(slotId),
        attendees: attendees.map((a) => ({
          name: a.name.trim(),
          age: parseInt(a.age, 10),
          id_type: a.id_type,
          id_number: a.id_number.trim(),
        })),
      });

      if (res.booking?.booking_id) {
        navigate(`/pay/${res.booking.booking_id}`);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setError(err.message || 'Failed to initialize booking hold. Please try again.');
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

  if (!slot && !loading) {
    return (
      <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <span className="text-4xl block mb-3">🌿</span>
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Slot Not Found</h1>
          <p className="text-xs text-gray-600 mb-6">{error || 'This safari slot is no longer available.'}</p>
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

  const basePrice = slot ? Number(slot.price) : 0;
  const totalPrice = basePrice * attendees.length;

  const dateFormatted = slot?.slot_date
    ? new Date(slot.slot_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Stepper Header */}
        <div className="max-w-2xl mx-auto mb-10">
          <Stepper
            steps={['Details', 'Payment', 'Confirmation']}
            currentStep={0}
          />
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            Booking Details
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Attendee Details: Please provide details for each attendee.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Layout Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Attendee Forms */}
          <div className="lg:col-span-8 space-y-6">
            {attendees.map((att, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-stone-200/80 transition"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <h2 className="text-base font-serif font-semibold text-[#1F3D2B]">
                      Attendee {idx + 1}
                    </h2>
                  </div>
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(idx)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={att.name}
                      onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    />
                  </div>

                  {/* Age */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="110"
                      required
                      placeholder="Enter age"
                      value={att.age}
                      onChange={(e) => handleAttendeeChange(idx, 'age', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    />
                  </div>

                  {/* ID Type */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      ID Type *
                    </label>
                    <select
                      value={att.id_type}
                      onChange={(e) => handleAttendeeChange(idx, 'id_type', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    >
                      {ID_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ID Number */}
                  <div className="sm:col-span-1 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter ID number"
                      value={att.id_number}
                      onChange={(e) => handleAttendeeChange(idx, 'id_number', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Attendee Button */}
            <button
              type="button"
              onClick={handleAddAttendee}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-dashed border-[#1F3D2B] text-[#1F3D2B] font-medium text-xs hover:bg-[#1F3D2B]/5 transition flex items-center justify-center gap-2"
            >
              <span className="text-base leading-none">+</span> Add another attendee
            </button>
          </div>

          {/* Right Column: "Your Booking" Summary Card */}
          <div className="lg:col-span-4">
            <div className="bg-[#1F3D2B] text-white rounded-3xl overflow-hidden shadow-lg sticky top-8">
              {/* Cover Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#F4F6F0]">
                    Your Booking
                  </h3>
                  <p className="text-xs text-white/70 mt-0.5">Reservation summary</p>
                </div>
                {slot.cover_image && (
                  <img
                    src={slot.cover_image}
                    alt={slot.sanctuary_name}
                    className="w-14 h-14 rounded-xl object-cover border border-white/20"
                  />
                )}
              </div>

              {/* Detail Items */}
              <div className="p-6 space-y-4 text-xs text-white/90">
                <div className="flex items-start justify-between">
                  <span className="text-white/60">Activity</span>
                  <span className="font-semibold text-right max-w-[180px]">
                    {slot.activity_name}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-white/60">Sanctuary</span>
                  <span className="font-semibold text-right max-w-[180px]">
                    {slot.sanctuary_name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">Date</span>
                  <span className="font-medium">{dateFormatted}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">Time</span>
                  <span className="font-medium">{slot.slot_time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-white/60">Number of People</span>
                  <span className="font-semibold text-[#D9A441]">
                    {attendees.length} {attendees.length === 1 ? 'Person' : 'People'}
                  </span>
                </div>

                {/* Pricing Breakdown: Single Safari Charges line plus total */}
                <div className="border-t border-white/15 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80">
                      Safari Charges (₹{basePrice.toLocaleString()} × {attendees.length})
                    </span>
                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-base font-serif font-bold text-[#F4F6F0] pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-[#D9A441]">₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* 40% Cancellation Warning */}
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2.5">
                  <span className="text-sm">⚠️</span>
                  <span>
                    <strong>Free cancellation is not available:</strong> 40% fee on cancellation.
                  </span>
                </div>

                {/* Proceed Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 py-3.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-xs uppercase tracking-wider hover:bg-[#c99534] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1F3D2B]" />
                      <span>Locking seats...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to payment</span>
                      <span className="text-sm">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
