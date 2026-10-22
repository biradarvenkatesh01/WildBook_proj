import { useState, useEffect, useCallback, useRef } from 'react';
import OwnerLayout from './OwnerLayout';
import AdminDetailDrawer from './AdminDetailDrawer';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

export default function AdminRequests() {
  const [admins, setAdmins] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  
  // Filters & State
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('submitted_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const hasInitialized = useRef(false);

  // Fetch admin requests from API
  const fetchAdmins = useCallback(async (tab = activeTab, page = pagination.page, query = search, sort = sortField) => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        status: tab,
        page: page.toString(),
        limit: '10',
        search: query,
        sort,
      });

      const res = await client.get(`/owner/admins?${queryParams.toString()}`);
      setAdmins(res.admins || []);
      setCounts(res.counts || { all: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });

      // Automatically select first item on initial page load only
      if (!hasInitialized.current && res.admins && res.admins.length > 0) {
        hasInitialized.current = true;
        setSelectedAdminId(res.admins[0].user_id);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load admin applications');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, search, sortField]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Tab switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAdmins(tab, 1, search, sortField);
  };

  // Search input handler with enter / debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAdmins(activeTab, 1, search, sortField);
  };

  // Sort toggle handler
  const handleSortToggle = (field) => {
    let nextSort = `${field}_desc`;
    if (sortField === `${field}_desc`) {
      nextSort = `${field}_asc`;
    }
    setSortField(nextSort);
    fetchAdmins(activeTab, pagination.page, search, nextSort);
  };

  // Decision updated callback from drawer
  const handleAdminUpdated = () => {
    fetchAdmins();
  };

  const tabs = [
    { key: 'ALL', label: 'All Requests', count: counts.all, badgeClass: 'bg-[#162B1D] text-white' },
    { key: 'PENDING', label: 'Pending', count: counts.pending, badgeClass: 'bg-[#D9A441] text-[#162B1D]' },
    { key: 'APPROVED', label: 'Approved', count: counts.approved, badgeClass: 'bg-emerald-700 text-white' },
    { key: 'REJECTED', label: 'Rejected', count: counts.rejected, badgeClass: 'bg-rose-700 text-white' },
    { key: 'SUSPENDED', label: 'Suspended', count: counts.suspended, badgeClass: 'bg-gray-600 text-white' },
  ];

  return (
    <OwnerLayout activeTitle="Admin Requests">
      <div className="flex h-full overflow-hidden">
        
        {/* ── Center Content: Requests Table & Controls (Design 23) ──────────── */}
        <div className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 overflow-y-auto">
          
          {/* Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-serif text-[#162B1D] font-bold">
                Admin Requests
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Review and manage administrator access requests across organizations.
              </p>
            </div>

            {/* Search and Filter */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search requests..."
                  className="w-56 sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DAC6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] text-gray-900"
                />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 bg-white border border-[#E5DAC6] rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter
              </button>
            </form>
          </div>

          {/* Status Tabs with Badges (Design 23) */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5DAC6] pb-2 mb-6 shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#162B1D] shadow-xs border border-[#E5DAC6]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeClass}`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white border border-[#E5DAC6] rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase text-[10px] tracking-wider">
                    <th
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800"
                      onClick={() => handleSortToggle('name')}
                    >
                      Admin Name ↕
                    </th>
                    <th
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800"
                      onClick={() => handleSortToggle('org')}
                    >
                      Organisation ↕
                    </th>
                    <th className="py-3 px-4 font-semibold">License Number</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-800"
                      onClick={() => handleSortToggle('submitted')}
                    >
                      Submitted Date ↕
                    </th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-2 text-right"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        <div className="inline-block w-6 h-6 border-2 border-[#162B1D]/20 border-t-[#162B1D] rounded-full animate-spin mb-2" />
                        <p>Loading operator requests...</p>
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400 italic">
                        No admin requests found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    admins.map((adm) => {
                      const isSelected = selectedAdminId === adm.user_id;
                      const submittedDate = new Date(adm.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <tr
                          key={adm.user_id}
                          onClick={() => setSelectedAdminId(adm.user_id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/60 font-medium'
                              : 'hover:bg-gray-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-4 text-gray-900 font-semibold">
                            {adm.name}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">
                            {adm.organisation_name || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600">
                            {adm.license_number || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {adm.email}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                            {submittedDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={adm.account_status} size="sm" />
                          </td>
                          <td className="py-3.5 px-3 text-right text-gray-400">
                            <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Design 23) */}
            <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <span>
                Showing {admins.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAdmins(activeTab, pagination.page - 1, search, sortField)}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ←
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => fetchAdmins(activeTab, pg, search, sortField)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      pagination.page === pg
                        ? 'bg-[#162B1D] text-white'
                        : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchAdmins(activeTab, pagination.page + 1, search, sortField)}
                  className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Request Details Drawer (Design 23) ───────────────── */}
        {selectedAdminId && (
          <AdminDetailDrawer
            adminId={selectedAdminId}
            onClose={() => setSelectedAdminId(null)}
            onUpdated={handleAdminUpdated}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
