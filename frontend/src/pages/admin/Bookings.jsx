import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Attendee drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Fetch bookings
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedActivity && selectedActivity !== 'all') params.append('activity_id', selectedActivity);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await api.get(`/admin/bookings?${params.toString()}`);
      setBookings(res.data.bookings || []);
      setActivities(res.data.activities || []);
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.response?.data?.error || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [dateFrom, dateTo, selectedActivity, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  // Open detail drawer
  const handleOpenDrawer = async (bookingId) => {
    try {
      setDrawerLoading(true);
      setDrawerOpen(true);
      const res = await api.get(`/admin/bookings/${bookingId}`);
      setSelectedBooking(res.data.booking);
      setAttendees(res.data.attendees || []);
    } catch (err) {
      console.error('Failed to load booking detail:', err);
      alert('Failed to load booking details.');
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedActivity && selectedActivity !== 'all') params.append('activity_id', selectedActivity);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await api.get(`/admin/bookings/export?${params.toString()}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wildbook-bookings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV.');
    }
  };

  // Print / Download attendee roster
  const handlePrintAttendees = () => {
    if (!selectedBooking) return;
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendee Manifest - ${selectedBooking.booking_code}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1F3D2B; }
            h2 { margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #f2eee3; }
          </style>
        </head>
        <body>
          <h2>WildBook Attendee Manifest</h2>
          <p><strong>Booking Code:</strong> ${selectedBooking.booking_code} | <strong>Activity:</strong> ${selectedBooking.activity_name}</p>
          <p><strong>Date & Time:</strong> ${new Date(selectedBooking.slot_date).toLocaleDateString()} at ${selectedBooking.slot_time}</p>
          <p><strong>Lead Visitor:</strong> ${selectedBooking.visitor_name} (${selectedBooking.visitor_email})</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>ID Type</th>
                <th>ID Number (Masked)</th>
              </tr>
            </thead>
            <tbody>
              ${attendees.map((a, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${a.name}</td>
                  <td>${a.age}</td>
                  <td>${a.id_type}</td>
                  <td>${a.id_number}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${m} ${ampm}`;
  };

  return (
    <AdminLayout activeTitle="Bookings">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Title & Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1F3D2B] flex items-center gap-2">
              <svg className="w-7 h-7 text-[#D9A441]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
                <path strokeLinecap="round" strokeWidth="1.5" d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Bookings
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track customer reservations, view attendee details, and export booking manifests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search code, visitor, activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5DAC6] bg-white focus:outline-none focus:ring-2 focus:ring-[#D9A441] w-64 shadow-xs"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[#D9A441] text-white hover:bg-[#c49235] shadow-xs transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Filters Bar (Matching Image 20) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-[#E5DAC6] shadow-xs">
          {/* Date range filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Date range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E5DAC6] bg-[#FDFBF7] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-[#E5DAC6] bg-[#FDFBF7] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
              />
            </div>
          </div>

          {/* Activity dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Activity
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E5DAC6] bg-[#FDFBF7] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
            >
              <option value="all">All Activities</option>
              {activities.map((act) => (
                <option key={act.activity_id} value={act.activity_id}>
                  {act.activity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E5DAC6] bg-[#FDFBF7] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Table Container (Matching Image 20) */}
        <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Visitor Name</th>
                  <th className="py-3.5 px-4">Activity</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4 text-center">People</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EEE3] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No bookings found matching criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-[#FAF7F2] transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1F3D2B]">
                        {b.booking_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{b.visitor_name}</div>
                        <div className="text-[10px] text-gray-400">{b.visitor_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-gray-800">
                          <span className="text-base">🌿</span>
                          <span className="font-medium">{b.activity_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div>{formatDate(b.slot_date)}</div>
                        <div className="text-[10px] text-gray-400">{formatTime(b.slot_time)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                        {b.number_of_people}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1F3D2B]">
                        {formatCurrency(b.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenDrawer(b.booking_id)}
                          className="px-3 py-1 rounded-lg border border-[#E5DAC6] text-[11px] font-semibold text-[#D9A441] hover:bg-[#D9A441] hover:text-white transition shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#E5DAC6] bg-[#FDFBF7] text-xs text-gray-600">
            <div>
              Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchBookings(pagination.page - 1)}
                className="px-2.5 py-1 rounded-md border border-[#E5DAC6] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &larr;
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchBookings(p)}
                  className={`w-7 h-7 rounded-md font-medium text-xs flex items-center justify-center transition ${
                    p === pagination.page
                      ? 'bg-[#D9A441] text-white'
                      : 'border border-[#E5DAC6] bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchBookings(pagination.page + 1)}
                className="px-2.5 py-1 rounded-md border border-[#E5DAC6] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Slide-over / Attendee Details Drawer (Matching Image 20) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col z-10 border-l border-[#E5DAC6]">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E5DAC6] flex items-center justify-between bg-[#FDFBF7]">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-mono font-bold text-[#1F3D2B]">
                    {selectedBooking?.booking_code || 'Booking Details'}
                  </h2>
                  {selectedBooking && <StatusBadge status={selectedBooking.status} />}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Attendee Roster & Identification Details
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerLoading ? (
                <div className="py-20 text-center text-gray-400 text-xs">
                  Loading attendee information...
                </div>
              ) : selectedBooking ? (
                <>
                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-[#F6F1E7]/50 border border-[#E5DAC6] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Activity</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.activity_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Date & Time</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(selectedBooking.slot_date)} • {formatTime(selectedBooking.slot_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Head Count</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.number_of_people} People</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Total Amount</span>
                      <span className="font-bold text-[#1F3D2B]">{formatCurrency(selectedBooking.total_amount)}</span>
                    </div>
                    {selectedBooking.guide_name && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5DAC6]/60">
                        <span className="text-gray-500">Allocated Guide</span>
                        <span className="font-medium text-gray-700">{selectedBooking.guide_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendee Details List (Matching Image 20) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Attendee Details ({attendees.length})
                    </h3>

                    {attendees.map((att, idx) => (
                      <div
                        key={att.attendee_id}
                        className="p-4 rounded-xl border border-[#E5DAC6] bg-white shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-amber-700 font-medium text-[11px]">
                          <span>👤</span>
                          <span>Attendee {idx + 1}</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Full Name</div>
                          <div className="font-semibold text-gray-800">{att.name}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">Age</div>
                            <div className="text-gray-700">{att.age} yrs</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">{att.id_type || 'ID / Passport'}</div>
                            <div className="font-mono font-semibold text-gray-700 tracking-wider">
                              {att.id_number}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#E5DAC6] bg-[#FDFBF7]">
              <button
                onClick={handlePrintAttendees}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D9A441] text-white font-semibold text-xs hover:bg-[#c49235] transition shadow-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Download Attendee List
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
