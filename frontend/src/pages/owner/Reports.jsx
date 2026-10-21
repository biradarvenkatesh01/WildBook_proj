import { useState, useEffect } from 'react';
import OwnerLayout from './OwnerLayout';
import api from '../../api/client';

export default function OwnerReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('mostBooked');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.get('/owner/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to load owner reports:', err);
        setError('Failed to load platform reports.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <OwnerLayout activeTitle="Reports">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#162B1D] flex items-center gap-2">
              <svg className="w-7 h-7 text-[#D9A441]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Authority Platform Reports
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive cross-sanctuary SQL reports, frequent bookers, occupancy rates, and revenue.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DAC6] pb-1 text-xs">
          <button
            onClick={() => setActiveTab('mostBooked')}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === 'mostBooked'
                ? 'bg-white border-t-2 border-[#D9A441] text-[#162B1D] font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Most-Booked Sanctuaries
          </button>
          <button
            onClick={() => setActiveTab('frequentBookers')}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === 'frequentBookers'
                ? 'bg-white border-t-2 border-[#D9A441] text-[#162B1D] font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Frequent Bookers
          </button>
          <button
            onClick={() => setActiveTab('monthlyRevenue')}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === 'monthlyRevenue'
                ? 'bg-white border-t-2 border-[#D9A441] text-[#162B1D] font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Monthly Revenue & Retention
          </button>
          <button
            onClick={() => setActiveTab('slotOccupancy')}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === 'slotOccupancy'
                ? 'bg-white border-t-2 border-[#D9A441] text-[#162B1D] font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Slot Occupancy Rates
          </button>
          <button
            onClick={() => setActiveTab('cancellation')}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              activeTab === 'cancellation'
                ? 'bg-white border-t-2 border-[#D9A441] text-[#162B1D] font-bold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cancellation Rates
          </button>
        </div>

        {/* Tab 1: Most-Booked Sanctuaries */}
        {activeTab === 'mostBooked' && (
          <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5DAC6] bg-[#FDFBF7]">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Most-Booked Wildlife Sanctuaries
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Official ranking of approved sanctuaries by booking volume, visitor footfall, and gross receipts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <th className="py-3 px-5">Sanctuary</th>
                    <th className="py-3 px-5">Location</th>
                    <th className="py-3 px-5 text-center">Total Bookings</th>
                    <th className="py-3 px-5 text-center">Total Visitors</th>
                    <th className="py-3 px-5 text-right font-bold text-[#162B1D]">Platform Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE3] text-xs">
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading sanctuary ranking...</td></tr>
                  ) : !reports?.most_booked_sanctuaries?.length ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No bookings recorded yet.</td></tr>
                  ) : (
                    reports.most_booked_sanctuaries.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2] transition">
                        <td className="py-3.5 px-5 font-semibold text-[#162B1D]">
                          {s.sanctuary_name}
                        </td>
                        <td className="py-3.5 px-5 text-gray-600">
                          {s.location}
                        </td>
                        <td className="py-3.5 px-5 text-center font-bold text-gray-800">
                          {s.total_bookings}
                        </td>
                        <td className="py-3.5 px-5 text-center text-gray-700 font-medium">
                          {s.total_visitors}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-[#162B1D] text-sm">
                          {formatCurrency(s.total_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Frequent Bookers (GROUP BY ... HAVING) */}
        {activeTab === 'frequentBookers' && (
          <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5DAC6] bg-[#FDFBF7]">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Frequent Bookers Analysis
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Top registered visitors aggregated by booking frequency and cumulative spend (SQL GROUP BY ... HAVING).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <th className="py-3 px-5">Visitor Name</th>
                    <th className="py-3 px-5">Contact Email</th>
                    <th className="py-3 px-5 text-center">Bookings Count</th>
                    <th className="py-3 px-5 text-center">Total Seats</th>
                    <th className="py-3 px-5 text-right font-bold text-[#162B1D]">Cumulative Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE3] text-xs">
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading frequent bookers...</td></tr>
                  ) : !reports?.frequent_bookers?.length ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No visitors found.</td></tr>
                  ) : (
                    reports.frequent_bookers.map((b, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2] transition">
                        <td className="py-3.5 px-5 font-semibold text-gray-900">
                          {b.visitor_name}
                        </td>
                        <td className="py-3.5 px-5 text-gray-500">
                          {b.visitor_email}
                        </td>
                        <td className="py-3.5 px-5 text-center font-bold text-gray-800">
                          {b.total_bookings}
                        </td>
                        <td className="py-3.5 px-5 text-center font-medium text-gray-700">
                          {b.total_seats}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-[#162B1D] text-sm">
                          {formatCurrency(b.total_spend)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Monthly Platform Revenue */}
        {activeTab === 'monthlyRevenue' && (
          <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5DAC6] bg-[#FDFBF7]">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Monthly Platform Net Revenue
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Breakdown of confirmed booking collections plus 40% retained cancellation fees per sanctuary.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <th className="py-3 px-5">Sanctuary</th>
                    <th className="py-3 px-5">Month</th>
                    <th className="py-3 px-5 text-center">Bookings</th>
                    <th className="py-3 px-5">Confirmed</th>
                    <th className="py-3 px-5">Cancellation Fees Kept (40%)</th>
                    <th className="py-3 px-5 text-right font-bold text-[#162B1D]">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE3] text-xs">
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading monthly breakdown...</td></tr>
                  ) : !reports?.monthly_revenue?.length ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No revenue data found.</td></tr>
                  ) : (
                    reports.monthly_revenue.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2] transition">
                        <td className="py-3.5 px-5 font-semibold text-gray-900">
                          {r.sanctuary_name}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-gray-600">
                          {r.booking_month}
                        </td>
                        <td className="py-3.5 px-5 text-center font-medium text-gray-700">
                          {r.total_bookings}
                        </td>
                        <td className="py-3.5 px-5 text-gray-800">
                          {formatCurrency(r.confirmed_revenue)}
                        </td>
                        <td className="py-3.5 px-5 text-amber-700 font-medium">
                          {formatCurrency(r.cancellation_fees_kept)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-[#162B1D] text-sm">
                          {formatCurrency(r.net_revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Slot Occupancy Rates (Correlated Subquery) */}
        {activeTab === 'slotOccupancy' && (
          <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5DAC6] bg-[#FDFBF7]">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Platform Slot Occupancy Rates
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Calculated via correlated SQL subquery measuring booked capacity against vehicle limit.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <th className="py-3 px-5">Sanctuary</th>
                    <th className="py-3 px-5">Activity</th>
                    <th className="py-3 px-5">Slot Schedule</th>
                    <th className="py-3 px-5 text-center">Capacity</th>
                    <th className="py-3 px-5 text-center">Booked</th>
                    <th className="py-3 px-5">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE3] text-xs">
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading slot data...</td></tr>
                  ) : !reports?.slot_occupancy?.length ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No active slots found.</td></tr>
                  ) : (
                    reports.slot_occupancy.map((s, idx) => {
                      const pct = Number(s.occupancy_rate_percent || 0);
                      return (
                        <tr key={idx} className="hover:bg-[#FAF7F2] transition">
                          <td className="py-3.5 px-5 font-semibold text-[#162B1D]">
                            {s.sanctuary_name}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-gray-800">
                            {s.activity_name}
                          </td>
                          <td className="py-3.5 px-5 text-gray-600">
                            {formatDate(s.slot_date)} • {s.slot_time}
                          </td>
                          <td className="py-3.5 px-5 text-center font-medium text-gray-700">
                            {s.total_capacity}
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold text-[#162B1D]">
                            {s.booked_seats}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    pct >= 80 ? 'bg-emerald-600' : pct >= 40 ? 'bg-amber-500' : 'bg-gray-400'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-gray-700 text-xs">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Cancellation Rates */}
        {activeTab === 'cancellation' && (
          <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5DAC6] bg-[#FDFBF7]">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Platform Cancellation Rates by Sanctuary
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cancellation proportions and 40% retention fee receipts aggregated by sanctuary.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    <th className="py-3 px-5">Sanctuary</th>
                    <th className="py-3 px-5 text-center">Reservations</th>
                    <th className="py-3 px-5 text-center">Confirmed</th>
                    <th className="py-3 px-5 text-center">Cancelled</th>
                    <th className="py-3 px-5 text-center">Cancellation Rate</th>
                    <th className="py-3 px-5 text-right font-bold text-[#162B1D]">Fees Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE3] text-xs">
                  {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading cancellation stats...</td></tr>
                  ) : !reports?.cancellation_rate?.length ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No cancellations recorded.</td></tr>
                  ) : (
                    reports.cancellation_rate.map((c, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2] transition">
                        <td className="py-3.5 px-5 font-semibold text-gray-900">
                          {c.sanctuary_name}
                        </td>
                        <td className="py-3.5 px-5 text-center font-medium text-gray-700">
                          {c.total_reservations}
                        </td>
                        <td className="py-3.5 px-5 text-center text-emerald-700 font-medium">
                          {c.confirmed_count}
                        </td>
                        <td className="py-3.5 px-5 text-center text-red-600 font-medium">
                          {c.cancelled_count}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            Number(c.cancellation_rate_percent) > 20
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {c.cancellation_rate_percent || 0}%
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-[#162B1D] text-sm">
                          {formatCurrency(c.total_cancellation_fees_collected)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </OwnerLayout>
  );
}
