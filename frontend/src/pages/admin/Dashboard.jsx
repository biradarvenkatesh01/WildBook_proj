import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { BarChartIcon, TicketIcon, LeafIcon } from '../../components/Icons';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        setStats(res?.data ?? res);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

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

  // Prepare line chart data (Bookings this month / recent days)
  const lineLabels = stats?.bookings_trend?.length
    ? stats.bookings_trend.map(t => t.label || t.date)
    : ['1 May', '5 May', '10 May', '15 May', '20 May', '25 May', '31 May'];
  const lineValues = stats?.bookings_trend?.length
    ? stats.bookings_trend.map(t => t.count)
    : [0, 0, 0, 0, 0, 0, 0];

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Bookings',
        data: lineValues,
        fill: true,
        borderColor: '#2D5A3D',
        backgroundColor: 'rgba(45, 90, 61, 0.12)',
        tension: 0.4,
        pointBackgroundColor: '#2D5A3D',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F3D2B',
        titleFont: { family: 'Outfit, sans-serif' },
        bodyFont: { family: 'Outfit, sans-serif' }
      }
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

  // Prepare bar chart data (Revenue by activity)
  const barLabels = stats?.revenue_by_activity?.length
    ? stats.revenue_by_activity.map(a => a.activity_name)
    : ['Jeep Safari', 'Nature Walk', 'Bird Watching', 'Boat Safari', 'Camping'];
  const barValues = stats?.revenue_by_activity?.length
    ? stats.revenue_by_activity.map(a => a.revenue)
    : [0, 0, 0, 0, 0];

  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: barValues,
        backgroundColor: '#D9A441',
        borderRadius: 6,
        hoverBackgroundColor: '#c49235'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Revenue: ₹${Number(context.raw).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#888',
          callback: (value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`
        },
        grid: { color: 'rgba(229, 218, 198, 0.4)' }
      },
      x: {
        ticks: { color: '#888', font: { size: 10 } },
        grid: { display: false }
      }
    }
  };

  return (
    <AdminLayout activeTitle="Dashboard">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Dashboard Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1F3D2B]">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Real-time operational summary, revenue metrics, and booking throughput.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/reports"
              className="px-3.5 py-2 rounded-xl border border-[#E5DAC6] bg-white text-xs font-semibold text-[#1F3D2B] hover:bg-[#F6F1E7] transition shadow-xs flex items-center gap-1.5"
            >
              <BarChartIcon className="w-3.5 h-3.5 text-[#1F3D2B]" />
              <span>View Reports</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* 4 Stat Cards (Matching Image 16) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Total bookings
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B] mt-1">
                {loading ? '...' : (stats?.total_bookings || 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                Confirmed reservations
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F6F1E7] flex items-center justify-center text-[#1F3D2B]">
              <TicketIcon className="w-5 h-5 text-[#1F3D2B]" />
            </div>
          </div>

          {/* 2. Revenue net of refunds (rupees) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Revenue
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B] mt-1">
                {loading ? '...' : formatCurrency(stats?.revenue_net || 0)}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                Net ticket earnings
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F6F1E7] flex items-center justify-center text-xl text-[#1F3D2B] font-serif font-bold">
              ₹
            </div>
          </div>

          {/* 3. Upcoming Slots */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Upcoming slots
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B] mt-1">
                {loading ? '...' : (stats?.upcoming_slots || 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                Scheduled active departures
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F6F1E7] flex items-center justify-center text-xl text-[#1F3D2B]">
              📅
            </div>
          </div>

          {/* 4. Average Rating */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5DAC6] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Average rating
              </p>
              <h3 className="text-2xl font-serif font-bold text-[#1F3D2B] mt-1">
                {loading ? '...' : (stats?.review_count > 0 ? Number(stats.average_rating).toFixed(1) : '—')}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                {stats?.review_count || 0} reviews received
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F6F1E7] flex items-center justify-center text-xl text-amber-500">
              ⭐
            </div>
          </div>

        </div>

        {/* 2 Charts Row (Matching Image 16) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Line Chart: Bookings this month */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DAC6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
                Bookings this month
              </h2>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                Recent 30 Days
              </span>
            </div>
            <div className="h-64 relative">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Bar Chart: Revenue by activity */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5DAC6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
                Revenue by activity
              </h2>
              <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                Cumulative
              </span>
            </div>
            <div className="h-64 relative">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

        </div>

        {/* Recent Bookings Table (Matching Image 16) */}
        <div className="bg-white rounded-2xl border border-[#E5DAC6] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E5DAC6] flex items-center justify-between bg-[#FDFBF7]">
            <h2 className="font-serif font-bold text-base text-[#1F3D2B]">
              Recent bookings
            </h2>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-[#D9A441] hover:underline flex items-center gap-1"
            >
              <span>View all bookings</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DAC6] bg-[#FDFBF7] text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                  <th className="py-3 px-5">Booking ID</th>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Activity</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EEE3] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Loading recent bookings...
                    </td>
                  </tr>
                ) : !stats?.recent_bookings?.length ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No recent bookings yet.
                    </td>
                  </tr>
                ) : (
                  stats.recent_bookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-[#FAF7F2] transition">
                      <td className="py-3 px-5 font-mono font-medium text-[#1F3D2B]">
                        {b.booking_code}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#1F3D2B] text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {b.visitor_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{b.visitor_name}</div>
                            <div className="text-[10px] text-gray-400">{b.visitor_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <LeafIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{b.activity_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-600">
                        {formatDate(b.slot_date)}, {formatTime(b.slot_time)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#FDFBF7] border-t border-[#E5DAC6] text-center">
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-[#D9A441] hover:underline inline-flex items-center gap-1"
            >
              <span>View all bookings</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
