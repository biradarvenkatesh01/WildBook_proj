import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

export default function ApprovedSanctuaries() {
  const [sanctuaries, setSanctuaries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApprovedSanctuaries = useCallback(async (page = pagination.page, query = search) => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        status: 'APPROVED',
        page: page.toString(),
        limit: '10',
        search: query,
      });

      const res = await client.get(`/owner/sanctuaries?${queryParams.toString()}`);
      setSanctuaries(res.sanctuaries || []);
      setTotalCount(res.counts?.approved || res.pagination?.total || 0);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load approved sanctuaries');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search]);

  useEffect(() => {
    fetchApprovedSanctuaries();
  }, [fetchApprovedSanctuaries]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchApprovedSanctuaries(1, search);
  };

  return (
    <OwnerLayout activeTitle="Approved Sanctuaries">
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#162B1D] font-bold">
              Approved Sanctuaries
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Official public registry of government authorized wildlife parks and safari operators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              {totalCount} Verified Sanctuaries
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5DAC6] shadow-xs mb-6 flex items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search approved sanctuaries by park name, state, or operator..."
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

        {/* Table Container (Page 23 styling) */}
        <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-gray-500 font-semibold border-b border-[#E5DAC6] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Sanctuary &amp; Location</th>
                  <th className="py-3.5 px-4">Operator Organisation</th>
                  <th className="py-3.5 px-4">Offerings</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Authorized Date</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#162B1D] mb-2" />
                      <div>Loading verified sanctuaries...</div>
                    </td>
                  </tr>
                ) : sanctuaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400">
                      No approved sanctuaries found matching your search.
                    </td>
                  </tr>
                ) : (
                  sanctuaries.map((s) => {
                    const approvedDate = s.reviewed_at
                      ? new Date(s.reviewed_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Verified';

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
                              <div className="w-12 h-10 bg-[#FAF8F5] rounded-lg flex items-center justify-center text-gray-400 text-[10px] shrink-0 font-medium">
                                Park
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
                          <span className="text-[11px] text-gray-500 block truncate font-mono">
                            Lic: {s.license_number || 'N/A'}
                          </span>
                        </td>

                        {/* Offerings Summary */}
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-700 block">
                            {s.activities_count} activities &bull; {s.slots_count} slots
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Live on Public Portal
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={s.listing_status} />
                        </td>

                        {/* Approved Date */}
                        <td className="py-4 px-4 text-gray-500 font-medium">
                          {approvedDate}
                        </td>

                        {/* View Action */}
                        <td className="py-4 px-5 text-right">
                          <Link
                            to={`/owner/sanctuary-requests/${s.sanctuary_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-xs text-gray-700 transition shadow-xs"
                          >
                            <span>View Dossier &rarr;</span>
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
                  onClick={() => fetchApprovedSanctuaries(pagination.page - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-semibold text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchApprovedSanctuaries(pagination.page + 1)}
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
