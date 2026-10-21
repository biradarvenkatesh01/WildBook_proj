import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Stepper from '../../components/Stepper';
import client from '../../api/client';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Payment tab: 'CARD' | 'UPI' | 'NET_BANKING'
  const [activeTab, setActiveTab] = useState('CARD');

  // Simulation outcome toggle: true = Success, false = Failure
  const [simulateSuccess, setSimulateSuccess] = useState(true);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardName, setCardName] = useState('Aarav Sharma');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('421');

  // UPI state
  const [upiId, setUpiId] = useState('visitor@oksbi');

  // Net banking state
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Live countdown timer (in seconds)
  const [secondsLeft, setSecondsLeft] = useState(600);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchBookingDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await client.get(`/bookings/${bookingId}`);
        const b = res.booking;

        if (b.status === 'CONFIRMED') {
          navigate(`/booking/${b.booking_id}/confirmed`, { replace: true });
          return;
        }

        setBooking(b);
        setSecondsLeft(b.remaining_hold_seconds ?? 600);
      } catch (err) {
        console.error('Failed to load booking:', err);
        setError(err.message || 'Unable to load booking details.');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingDetails();
  }, [bookingId, navigate]);

  // Interval countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (secondsLeft <= 0) {
      setError('Your 10-minute hold has expired. Please select a new slot.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await client.post(`/payments/${bookingId}/pay`, {
        success: simulateSuccess,
        payment_method: activeTab,
      });

      if (res.success) {
        setSuccessMsg('Payment successful! Redirecting to confirmation...');
        setTimeout(() => {
          navigate(`/booking/${bookingId}/confirmed`);
        }, 600);
      } else {
        setError(
          res.message ||
            'Payment simulation failed. Your seats remain reserved until the timer expires. You may retry.'
        );
        if (res.remaining_hold_seconds !== undefined) {
          setSecondsLeft(res.remaining_hold_seconds);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = secondsLeft <= 0;

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
          <span className="text-4xl block mb-3">⚠️</span>
          <h1 className="text-2xl font-serif font-bold text-[#1F3D2B] mb-2">Booking Not Found</h1>
          <p className="text-xs text-gray-600 mb-6">{error || 'This reservation does not exist or has expired.'}</p>
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

  const totalAmount = Number(booking.total_amount || 0);

  return (
    <div className="theme-user bg-[#F6F1E7] min-h-screen flex flex-col justify-between font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Stepper Header */}
        <div className="max-w-2xl mx-auto mb-10">
          <Stepper
            steps={['Select Safari', 'Payment', 'Confirmation']}
            currentStep={1}
          />
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            Secure Payment
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete your payment to confirm your safari booking.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Payment Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80">
            {/* Payment Method Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'CARD'
                    ? 'bg-[#1F3D2B] text-white shadow-md'
                    : 'bg-stone-100 text-gray-700 hover:bg-stone-200/80'
                }`}
              >
                <span>💳</span>
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UPI')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'UPI'
                    ? 'bg-[#1F3D2B] text-white shadow-md'
                    : 'bg-stone-100 text-gray-700 hover:bg-stone-200/80'
                }`}
              >
                <span>⚡</span>
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('NET_BANKING')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'NET_BANKING'
                    ? 'bg-[#1F3D2B] text-white shadow-md'
                    : 'bg-stone-100 text-gray-700 hover:bg-stone-200/80'
                }`}
              >
                <span>🏛️</span>
                <span>Net Banking</span>
              </button>
            </div>

            {/* Form Fields based on tab */}
            <form onSubmit={handlePay} className="space-y-6">
              {activeTab === 'CARD' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Pay securely using your credit or debit card.</span>
                    <span className="text-[#1F3D2B] font-medium flex items-center gap-1">
                      🔒 100% Secure SSL
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                      />
                      <span className="absolute right-3.5 top-3 text-xs text-stone-400 font-bold">
                        VISA / MC
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Enter name as on card"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength="4"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'UPI' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    Instant payment using your UPI ID or virtual payment address.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or name@okaxis"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#1F3D2B] focus:outline-none bg-stone-50/50"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 pt-2">
                    <span className="px-3 py-1.5 rounded-lg bg-stone-100 font-medium">Google Pay</span>
                    <span className="px-3 py-1.5 rounded-lg bg-stone-100 font-medium">PhonePe</span>
                    <span className="px-3 py-1.5 rounded-lg bg-stone-100 font-medium">Paytm</span>
                    <span className="px-3 py-1.5 rounded-lg bg-stone-100 font-medium">BHIM</span>
                  </div>
                </div>
              )}

              {activeTab === 'NET_BANKING' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    Select your bank to redirect to secure internet banking portal.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {['HDFC', 'SBI', 'ICICI', 'Axis Bank', 'Kotak', 'PNB'].map((bank) => (
                      <button
                        type="button"
                        key={bank}
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                          selectedBank === bank
                            ? 'border-[#1F3D2B] bg-[#1F3D2B]/5 font-bold text-[#1F3D2B]'
                            : 'border-stone-200 hover:bg-stone-50 text-gray-700'
                        }`}
                      >
                        <span>{bank}</span>
                        {selectedBank === bank && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation Mode Toggle (For Testing failure & retry) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-amber-900 block">
                      🧪 Payment Simulation Mode
                    </span>
                    <span className="text-amber-700 text-[11px]">
                      Test failure handling and retry as specified in project rules.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulateSuccess(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        simulateSuccess
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-200 text-gray-700'
                      }`}
                    >
                      Success
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulateSuccess(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        !simulateSuccess
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-stone-200 text-gray-700'
                      }`}
                    >
                      Failure
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || isExpired}
                  className="w-full py-4 rounded-2xl bg-[#1F3D2B] text-white font-bold text-sm tracking-wide hover:bg-[#162d20] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Processing payment...</span>
                    </>
                  ) : isExpired ? (
                    <span>Hold Expired</span>
                  ) : error ? (
                    <span>Retry Payment (₹{totalAmount.toLocaleString()})</span>
                  ) : (
                    <span>🔒 Pay ₹{totalAmount.toLocaleString()}</span>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-400 mt-2">
                  By clicking Pay, you agree to WildBook terms and 40% cancellation policy.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-stone-200/80">
              <h3 className="text-lg font-serif font-bold text-[#1F3D2B] mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 pb-5 border-b border-stone-200 text-xs">
                <div>
                  <span className="text-gray-400 text-[11px] block">Activity</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {booking.activity_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block">Sanctuary</span>
                  <span className="font-medium text-gray-700">
                    {booking.sanctuary_name}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Safari Date</span>
                  <span className="font-medium text-gray-800">
                    {new Date(booking.slot_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Departure Time</span>
                  <span className="font-medium text-gray-800">{booking.slot_time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Guests</span>
                  <span className="font-medium text-gray-800">
                    {booking.number_of_people} {booking.number_of_people === 1 ? 'Adult' : 'Guests'}
                  </span>
                </div>
              </div>

              {/* Single Safari Charges line and Total */}
              <div className="py-4 border-b border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Safari Charges (₹{Number(booking.base_price).toLocaleString()} × {booking.number_of_people})
                  </span>
                  <span className="font-medium text-gray-800">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-serif font-bold text-[#1F3D2B] pt-2">
                  <span>Total Amount</span>
                  <span className="text-[#1F3D2B]">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Server Hold Countdown Box */}
              <div
                className={`mt-6 p-4 rounded-2xl border text-center transition ${
                  isExpired
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium mb-1">
                  <span>⏱️</span>
                  <span>{isExpired ? 'Hold Expired' : 'Your seats are held for'}</span>
                </div>
                <div className="text-2xl font-mono font-bold tracking-widest">
                  {timeString}
                </div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  MIN &nbsp; : &nbsp; SEC
                </div>
                {isExpired && (
                  <Link
                    to="/sanctuaries"
                    className="mt-3 block text-xs underline font-semibold text-red-700 hover:text-red-800"
                  >
                    Select an active slot &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
