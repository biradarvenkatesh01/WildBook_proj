import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { LeafIcon, ClockIcon, UserIcon, CarIcon, BackpackIcon } from '../../components/Icons';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ActivitySlots() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activity, setActivity] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected calendar state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => formatDateYMD(new Date()));
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);

  // Fetch activity & slots for selected date
  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        setError('');
        const res = await client.get(`/activities/${id}/slots`);
        setActivity(res.activity);
        setAllSlots(res.slots || []);
        setAvailableDates(res.available_dates || []);

        // If today has no slots, default to the first available date in future
        if (res.available_dates && res.available_dates.length > 0) {
          const firstDate = res.available_dates[0];
          setSelectedDateStr(firstDate);
          const [y, m, d] = firstDate.split('-').map(Number);
          setCurrentMonthDate(new Date(y, m - 1, d));
        }
      } catch (err) {
        setError(err.data?.error || err.message || 'Activity not found or currently unavailable');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [id]);

  // Slots matching currently selected date
  const dateSlots = useMemo(() => {
    return allSlots.filter((s) => s.slot_date === selectedDateStr);
  }, [allSlots, selectedDateStr]);

  // Auto-select first available slot for the selected date
  useEffect(() => {
    const available = dateSlots.find((s) => s.available_seats > 0);
    if (available) {
      setSelectedSlotId(available.slot_id);
    } else {
      setSelectedSlotId(null);
    }
    setPeopleCount(1);
  }, [dateSlots]);

  const selectedSlot = useMemo(() => {
    return dateSlots.find((s) => s.slot_id === selectedSlotId);
  }, [dateSlots, selectedSlotId]);

  // Month navigation
  const handlePrevMonth = () => {
    const prev = new Date(currentMonthDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonthDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonthDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonthDate(next);
  };

  // Calendar Day Tiles generation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false });
    }

    const todayStr = formatDateYMD(new Date());

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatDateYMD(dateObj);
      const isPast = dateStr < todayStr;
      const hasSlots = availableDates.includes(dateStr);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isPast,
        hasSlots,
        isSelected: dateStr === selectedDateStr,
      });
    }

    return days;
  }, [currentMonthDate, availableDates, selectedDateStr]);

  // Handle "Continue to booking"
  const handleContinueBooking = () => {
    if (!selectedSlot) return;

    if (!user) {
      // User must be logged in to proceed with reservation
      const currentPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Pass slot selection to booking checkout (Phase 8)
    navigate(`/book/${selectedSlot.slot_id}?people=${peopleCount}`);
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

  if (error || !activity) {
    return (
      <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <LeafIcon className="w-12 h-12 text-[#1F3D2B]/50 mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Activity Unavailable</h1>
          <p className="text-xs text-gray-600 mb-6">{error || 'This activity is currently not available.'}</p>
          <Link
            to="/sanctuaries"
            className="px-5 py-2.5 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-semibold text-xs hover:bg-[#c99534] transition"
          >
            &larr; Explore Other Sanctuaries
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const durationHours = (activity.duration_minutes / 60).toFixed(1);
  const totalPrice = Number(activity.price) * peopleCount;

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen text-[#1F3D2B] font-sans selection:bg-[#D9A441] selection:text-[#1F3D2B]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
        
        {/* ── Breadcrumb Bar (Image 06) ─────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span>&gt;</span>
          <Link to={`/sanctuaries/${activity.sanctuary_id}`} className="hover:text-gray-900 transition">
            {activity.sanctuary_name}
          </Link>
          <span>&gt;</span>
          <span>Experiences</span>
          <span>&gt;</span>
          <span className="text-gray-800 font-semibold truncate max-w-xs">{activity.activity_name}</span>
        </nav>

        {/* ── 2-Column Split Layout (Image 06) ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ LEFT COLUMN: Activity Hero & Info Details (6 cols) ═════════ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Activity Hero Image */}
            <div className="aspect-16/11 rounded-3xl overflow-hidden bg-gray-100 border border-[#E5DAC6] shadow-sm relative group">
              <img
                src={activity.cover_image || 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80'}
                alt={activity.activity_name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 text-white">
                <span className="text-xs uppercase font-bold tracking-wider text-[#D9A441] block">
                  {activity.sanctuary_name}
                </span>
                <span className="text-[11px] text-gray-200">{activity.sanctuary_location}</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B] mb-2">
                {activity.activity_name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed">
                Rise with the wild. Witness nature at its most alive and untamed.
              </p>
              {activity.description && (
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                  {activity.description}
                </p>
              )}
            </div>

            {/* Information Tags List (Image 06) */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5DAC6] shadow-xs space-y-4 text-xs">
              
              {/* Duration */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-gray-200 flex items-center justify-center text-sm shrink-0">
                  <ClockIcon className="w-4 h-4 text-[#1F3D2B]" />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">Duration</span>
                  <span className="text-gray-500">{durationHours} Hours ({activity.duration_minutes} Minutes)</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-gray-200 flex items-center justify-center text-sm shrink-0">
                  ₹
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">Price</span>
                  <span className="text-gray-500">₹{Number(activity.price).toLocaleString('en-IN')} per person (Inclusive of taxes)</span>
                </div>
              </div>

              {/* Expert Guide */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-gray-200 flex items-center justify-center text-sm shrink-0">
                  <UserIcon className="w-4 h-4 text-[#1F3D2B]" />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">Expert Guide</span>
                  <span className="text-gray-500">
                    {selectedSlot ? selectedSlot.guide_name : 'Certified Forestry Naturalist & Tracker'}
                  </span>
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-gray-200 flex items-center justify-center text-sm shrink-0">
                  <CarIcon className="w-4 h-4 text-[#1F3D2B]" />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">Vehicle Type</span>
                  <span className="text-gray-500">
                    {selectedSlot ? selectedSlot.vehicle_type : 'Open Safari Vehicle'}
                  </span>
                </div>
              </div>

              {/* What to Carry */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-gray-200 flex items-center justify-center text-sm shrink-0">
                  <BackpackIcon className="w-4 h-4 text-[#1F3D2B]" />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">What to Carry</span>
                  <span className="text-gray-500">
                    {activity.what_to_carry || 'Government Photo ID, Binoculars, Sun protection, Neutral clothing'}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ════ RIGHT COLUMN: Interactive Reservation Card (6 cols) ════════ */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DAC6] shadow-sm space-y-7 sticky top-6">
            
            {/* 1. Select Date */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 font-serif">
                  1. Select Date
                </h3>
                
                {/* Month Switcher Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-50"
                  >
                    &larr;
                  </button>
                  <span className="text-xs font-bold text-[#1F3D2B] min-w-28 text-center">
                    {currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-50"
                  >
                    &rarr;
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-gray-100 rounded-2xl p-3 bg-[#FAF8F5]/60">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {WEEKDAYS.map((w) => (
                    <span key={w} className="text-[10px] font-bold text-gray-400">
                      {w}
                    </span>
                  ))}
                </div>

                {/* Day Tiles */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {calendarDays.map((tile, idx) => {
                    if (!tile.isCurrentMonth) {
                      return <div key={idx} className="h-9" />;
                    }

                    const isDisabled = tile.isPast;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedDateStr(tile.dateStr)}
                        className={`h-9 rounded-xl font-semibold flex flex-col items-center justify-center relative transition ${
                          tile.isSelected
                            ? 'bg-[#1F3D2B] text-white shadow-xs'
                            : isDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        <span>{tile.dayNumber}</span>
                        {/* Green indicator dot if slots exist */}
                        {tile.hasSlots && !tile.isSelected && !isDisabled && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Select Time Slot (Image 06) */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif mb-3">
                2. Select Time Slot
              </h3>

              {dateSlots.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs bg-[#FAF8F5] rounded-2xl border border-gray-100">
                  No slots scheduled for this date. Please pick a date with a green dot.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dateSlots.map((slot) => {
                    const isSoldOut = slot.available_seats <= 0;
                    const isSelected = selectedSlotId === slot.slot_id;
                    const timeShort = slot.slot_time.substring(0, 5);

                    return (
                      <button
                        key={slot.slot_id}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedSlotId(slot.slot_id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-[#1F3D2B] bg-[#1F3D2B]/5 shadow-xs'
                            : isSoldOut
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-[#D9A441]'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-[#1F3D2B] block">
                            {timeShort} Safari
                          </span>
                          <span className={`text-[11px] block mt-0.5 ${isSoldOut ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                            {isSoldOut ? 'Sold out' : `${slot.available_seats} seats left`}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#1F3D2B] text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Number of People Stepper */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-serif mb-3">
                3. Number of People
              </h3>

              <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-2xl border border-gray-100">
                <span className="text-xs text-gray-600 font-medium">Participants</span>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={peopleCount <= 1}
                    onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700 disabled:opacity-40"
                  >
                    –
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-[#1F3D2B]">
                    {peopleCount}
                  </span>
                  <button
                    type="button"
                    disabled={!selectedSlot || peopleCount >= selectedSlot.available_seats}
                    onClick={() => setPeopleCount((p) => p + 1)}
                    className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total Price & Checkout Bar */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block uppercase font-medium">Total Price</span>
                <span className="text-2xl font-serif font-bold text-[#1F3D2B]">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">Inclusive of permits &amp; taxes</span>
              </div>

              <button
                type="button"
                onClick={handleContinueBooking}
                disabled={!selectedSlot}
                className="py-3 px-6 rounded-xl bg-[#1F3D2B] hover:bg-[#152a1d] text-white font-bold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] flex items-center gap-2"
              >
                <span>Continue to booking</span>
                <span>&rarr;</span>
              </button>
            </div>

            {!user && (
              <p className="text-[11px] text-gray-500 text-center">
                Note: You will be asked to sign in as a visitor to confirm passenger details.
              </p>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
