import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/owner/stats');
        setStats(res?.data ?? res);
      } catch (err) {
        console.error('Failed to load owner stats:', err);
        setError('Failed to load authority statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Bar Chart: Bookings per sanctuary
  const barLabels = stats?.bookings_per_sanctuary?.length
    ? stats.bookings_per_sanctuary.map(s => s.name)
    : ['Nagarhole', 'Bandipur', 'Gir Forest', 'Jim Corbett', 'Kaziranga'];
  const barValues = stats?.bookings_per_sanctuary?.length
    ? stats.bookings_per_sanctuary.map(s => s.booking_count)
    : [0, 0, 0, 0, 0];

  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Bookings',
        data: barValues,
        backgroundColor: '#162B1D',
        borderRadius: 4,
        hoverBackgroundColor: '#20402b'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#888' },
        grid: { color: 'rgba(229, 218, 198, 0.4)' }
      },
      x: {
        ticks: { color: '#888', font: { size: 10 } },
        grid: { display: false }
      }
    }
  };

  // Line Chart: Approvals Over Time
  const lineLabels = stats?.approvals_over_time?.length
    ? stats.approvals_over_time.map(a => a.label || a.month)
    : ['Dec \'24', 'Jan \'25', 'Feb \'25', 'Mar \'25', 'Apr \'25', 'May \'25'];
  const lineValues = stats?.approvals_over_time?.length
    ? stats.approvals_over_time.map(a => a.total_approvals)
    : [0, 0, 0, 0, 0, 0];

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Approvals',
        data: lineValues,
        fill: false,
        borderColor: '#162B1D',
        backgroundColor: '#162B1D',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#888' },
        grid: { color: 'rgba(229, 218, 198, 0.4)' }
      },
      x: {
        ticks: { color: '#888' },
        grid: { display: false }
      }
    }
  };

  return (
    <OwnerLayout activeTitle="Dashboard">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Welcome Header (Matching Image 22) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#162B1D]">
              Welcome, Authority Owner
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Here&apos;s what&apos;s happening with your sanctuaries today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/owner/reports"
              className="px-3.5 py-2 rounded-xl border border-[#E5DAC6] bg-white text-xs font-semibold text-[#162B1D] hover:bg-[#F6F1E7] transition shadow-xs flex items-center gap-1.5"
            >
              <span>📈</span>
              <span>Platform Reports</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* 4 Stat Cards (Matching Image 22) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Pending Admins */}
          <Link
            to="/owner/admin-requests"
            className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between hover:border-[#D9A441] transition group"
          >
            <div>
              <p className="text-3xl font-serif font-bold text-[#162B1D] group-hover:text-[#D9A441] transition">
                {loading ? '...' : (stats?.pending_admins || 0).toLocaleString()}
              </p>
              <h3 className="text-xs font-semibold text-gray-800 mt-1">
                Pending Admins
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Awaiting your approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EDE9] flex items-center justify-center text-xl text-[#162B1D]">
              👤
            </div>
          </Link>

          {/* 2. Pending Sanctuaries */}
          <Link
            to="/owner/sanctuary-requests"
            className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between hover:border-[#D9A441] transition group"
          >
            <div>
              <p className="text-3xl font-serif font-bold text-[#162B1D] group-hover:text-[#D9A441] transition">
                {loading ? '...' : (stats?.pending_sanctuaries || 0).toLocaleString()}
              </p>
              <h3 className="text-xs font-semibold text-gray-800 mt-1">
                Pending Sanctuaries
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Awaiting your approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EDE9] flex items-center justify-center text-xl text-[#162B1D]">
              🏛️
            </div>
          </Link>

          {/* 3. Approved Sanctuaries */}
          <Link
            to="/owner/sanctuaries"
            className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between hover:border-[#D9A441] transition group"
          >
            <div>
              <p className="text-3xl font-serif font-bold text-[#162B1D] group-hover:text-[#D9A441] transition">
                {loading ? '...' : (stats?.approved_sanctuaries || 0).toLocaleString()}
              </p>
              <h3 className="text-xs font-semibold text-gray-800 mt-1">
                Approved Sanctuaries
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Across the platform
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EDE9] flex items-center justify-center text-xl text-[#162B1D]">
              🛡️
            </div>
          </Link>

          {/* 4. Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-3xl font-serif font-bold text-[#162B1D]">
                {loading ? '...' : (stats?.total_bookings || 0).toLocaleString()}
              </p>
              <h3 className="text-xs font-semibold text-gray-800 mt-1">
                Total Bookings
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                All approved sanctuaries
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8EDE9] flex items-center justify-center text-xl text-[#162B1D]">
              📅
            </div>
          </div>

        </div>

        {/* 2 Charts Row (Matching Image 22) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar Chart: Bookings per Sanctuary */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DAC6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Bookings per Sanctuary
              </h2>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                All-time volume
              </span>
            </div>
            <div className="h-64 relative">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Line Chart: Approvals Over Time */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DAC6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Approvals Over Time
              </h2>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                Last 6 Months
              </span>
            </div>
            <div className="h-64 relative">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

        </div>

        {/* Needs Your Attention Table (Matching Image 22) */}
        <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E5DAC6] flex items-center justify-between bg-[#FDFBF7]">
            <div className="flex items-center gap-3">
              <h2 className="font-serif font-bold text-base text-[#162B1D]">
                Needs Your Attention
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                Latest Pending Requests
              </span>
            </div>
            <Link
              to="/owner/admin-requests"
              className="text-xs font-semibold text-[#D9A441] hover:underline flex items-center gap-1"
            >
              <span>View all requests</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Submitted By</th>
                  <th className="py-3 px-5">Date Submitted</th>
                  <th className="py-3 px-5">Details</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EEE3] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Loading pending items...
                    </td>
                  </tr>
                ) : !stats?.latest_pending_requests?.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-emerald-600 font-medium">
                      ✓ No pending approvals require attention at this time.
                    </td>
                  </tr>
                ) : (
                  stats.latest_pending_requests.map((req, i) => (
                    <tr key={i} className="hover:bg-[#FAF7F2] transition">
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium ${
                          req.type === 'Admin Request'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span>{req.type === 'Admin Request' ? '👤' : '🏛️'}</span>
                          <span>{req.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {req.name}
                      </td>
                      <td className="py-3.5 px-5 text-gray-500">
                        {req.submitted_by}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {formatDate(req.date_submitted)}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600 max-w-xs truncate">
                        {req.details}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <StatusBadge status="PENDING" />
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <Link
                          to={req.review_url}
                          className="px-3.5 py-1 rounded-lg border border-[#E5DAC6] text-[11px] font-semibold text-[#162B1D] hover:bg-[#162B1D] hover:text-white transition shadow-2xs inline-block"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </OwnerLayout>
  );
}
