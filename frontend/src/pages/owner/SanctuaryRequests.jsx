import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

export default function SanctuaryRequests() {
  const [sanctuaries, setSanctuaries] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters & State
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSanctuaries = useCallback(async (tab = activeTab, page = pagination.page, query = search) => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        status: tab,
        page: page.toString(),
        limit: '10',
        search: query,
      });

      const res = await client.get(`/owner/sanctuaries?${queryParams.toString()}`);
      setSanctuaries(res.sanctuaries || []);
      setCounts(res.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load sanctuary requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, search]);

  useEffect(() => {
    fetchSanctuaries();
  }, [fetchSanctuaries]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSanctuaries(tab, 1, search);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSanctuaries(activeTab, 1, search);
  };

  const tabs = [
    { id: 'ALL', label: 'All Requests', count: counts.all },
    { id: 'PENDING', label: 'Pending Review', count: counts.pending, highlight: counts.pending > 0 },
    { id: 'APPROVED', label: 'Approved', count: counts.approved },
    { id: 'REJECTED', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <OwnerLayout activeTitle="Sanctuary Listing Requests">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#162B1D] font-bold">
              Sanctuary Listing Requests
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Verify operator documentation, inspection checklist, and listing credentials before public release.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Search & Tabs Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5DAC6] shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#162B1D] text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.highlight
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search sanctuary or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#162B1D] focus:outline-none bg-[#FAF8F5]"
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

        {/* Requests Table Container */}
        <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-500 font-semibold border-b border-[#E5DAC6] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Sanctuary</th>
                  <th className="py-3.5 px-4">Operator Organisation</th>
                  <th className="py-3.5 px-4">Offerings</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#162B1D] mb-2" />
                      <div>Loading sanctuary requests...</div>
                    </td>
                  </tr>
                ) : sanctuaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      No sanctuary submissions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  sanctuaries.map((s) => {
                    const submitted = s.created_at
                      ? new Date(s.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={s.sanctuary_id} className="hover:bg-gray-50/70 transition">
                        {/* Sanctuary Info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {s.cover_image ? (
                              <img
                                src={s.cover_image}
                                alt={s.name}
                                className="w-12 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px] shrink-0 font-medium">
                                No img
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 block truncate text-xs">
                                {s.name}
                              </span>
                              <span className="text-[11px] text-gray-500 block truncate">
                                {s.location}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Operator Organisation */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-800 block truncate">
                            {s.organisation_name || 'Individual Operator'}
                          </span>
                          <span className="text-[11px] text-gray-500 block truncate">
                            {s.admin_name} ({s.admin_email})
                          </span>
                        </td>

                        {/* Offerings Summary */}
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-700 block">
                            {s.activities_count} activities &bull; {s.slots_count} slots
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {s.images_count} photos in gallery
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={s.listing_status} />
                        </td>

                        {/* Submitted Date */}
                        <td className="py-4 px-4 text-gray-500 font-medium">
                          {submitted}
                        </td>

                        {/* Review Action */}
                        <td className="py-4 px-5 text-right">
                          <Link
                            to={`/owner/sanctuary-requests/${s.sanctuary_id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#162B1D] text-white hover:bg-[#0f1f14] font-semibold text-xs transition shadow-xs"
                          >
                            <span>Inspect &rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchSanctuaries(activeTab, pagination.page - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-semibold text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchSanctuaries(activeTab, pagination.page + 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </OwnerLayout>
  );
}
