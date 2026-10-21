'use strict';
const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function login(role, email, password) {
  const payload = JSON.stringify({ email, password });
  const loginPath = role === 'admin' ? '/api/auth/admin/login' : role === 'owner' ? '/api/auth/owner/login' : '/api/auth/user/login';
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: loginPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);

  const json = JSON.parse(res.data);
  return json.token;
}

async function run() {
  console.log('--- Testing Phase 11 Backend Endpoints ---');

  // 1. Login as Admin
  console.log('Logging in as Admin (admin.nagarhole@wildbook.com)...');
  const adminToken = await login('admin', 'admin.nagarhole@wildbook.com', 'Admin@123');
  if (!adminToken) throw new Error('Admin login failed');
  console.log('✓ Admin login successful');

  // 2. Login as Owner
  console.log('Logging in as Site Owner (owner@wildbook.com)...');
  const ownerToken = await login('owner', 'owner@wildbook.com', 'Owner@123');
  if (!ownerToken) throw new Error('Owner login failed');
  console.log('✓ Owner login successful');

  // 3. Test Admin Stats
  console.log('\n--- 1. Testing GET /api/admin/stats ---');
  const adminStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Status: ${adminStatsRes.statusCode}`);
  const adminStats = JSON.parse(adminStatsRes.data);
  console.log('Admin Stats Result:', {
    total_bookings: adminStats.total_bookings,
    revenue_net: adminStats.revenue_net,
    upcoming_slots: adminStats.upcoming_slots,
    average_rating: adminStats.average_rating,
    bookings_trend_count: adminStats.bookings_trend?.length,
    revenue_by_activity_count: adminStats.revenue_by_activity?.length,
    recent_bookings_count: adminStats.recent_bookings?.length
  });
  if (adminStatsRes.statusCode !== 200) throw new Error('Admin stats failed');

  // 4. Test Admin Bookings
  console.log('\n--- 2. Testing GET /api/admin/bookings ---');
  const adminBookingsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/bookings?page=1&limit=5',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Status: ${adminBookingsRes.statusCode}`);
  const bookingsData = JSON.parse(adminBookingsRes.data);
  console.log('Bookings pagination:', bookingsData.pagination);
  console.log(`Retrieved ${bookingsData.bookings?.length} bookings`);
  if (adminBookingsRes.statusCode !== 200) throw new Error('Admin bookings list failed');

  let bookingId = bookingsData.bookings?.[0]?.booking_id;

  // 5. Test Admin Booking Detail (with masked attendee IDs)
  if (bookingId) {
    console.log(`\n--- 3. Testing GET /api/admin/bookings/${bookingId} ---`);
    const detailRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/bookings/${bookingId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${detailRes.statusCode}`);
    const detailData = JSON.parse(detailRes.data);
    console.log('Booking detail code:', detailData.booking?.booking_code);
    console.log('Attendees (masked):', detailData.attendees?.map(a => ({
      name: a.name,
      id_number: a.id_number
    })));
    if (detailRes.statusCode !== 200) throw new Error('Booking detail failed');
    if (detailData.attendees?.length > 0) {
      const sampleId = detailData.attendees[0].id_number;
      if (!sampleId.startsWith('****')) {
        throw new Error(`Attendee ID number is not masked properly: ${sampleId}`);
      }
      console.log('✓ Verified attendee ID number is properly masked to last 4 chars!');
    }
  }

  // 6. Test Admin Bookings Export (CSV)
  console.log('\n--- 4. Testing GET /api/admin/bookings/export ---');
  const exportRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/bookings/export',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Status: ${exportRes.statusCode}`);
  console.log(`Content-Type: ${exportRes.headers['content-type']}`);
  console.log(`CSV preview (first 2 lines):\n${exportRes.data.split('\r\n').slice(0, 2).join('\n')}`);
  if (exportRes.statusCode !== 200 || !exportRes.data.includes('Booking ID,Booking Code')) {
    throw new Error('CSV Export failed');
  }

  // 7. Test Admin Reports
  console.log('\n--- 5. Testing GET /api/admin/reports ---');
  const adminReportsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/reports',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log(`Status: ${adminReportsRes.statusCode}`);
  const adminReports = JSON.parse(adminReportsRes.data);
  console.log('Admin reports count:', {
    slot_occupancy: adminReports.slot_occupancy?.length,
    monthly_revenue: adminReports.monthly_revenue?.length,
    cancellation_rate: adminReports.cancellation_rate?.length
  });
  if (adminReportsRes.statusCode !== 200) throw new Error('Admin reports failed');

  // 8. Test Owner Stats
  console.log('\n--- 6. Testing GET /api/owner/stats ---');
  const ownerStatsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/owner/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log(`Status: ${ownerStatsRes.statusCode}`);
  const ownerStats = JSON.parse(ownerStatsRes.data);
  console.log('Owner stats:', {
    pending_admins: ownerStats.pending_admins,
    pending_sanctuaries: ownerStats.pending_sanctuaries,
    approved_sanctuaries: ownerStats.approved_sanctuaries,
    total_bookings: ownerStats.total_bookings,
    bookings_per_sanctuary_count: ownerStats.bookings_per_sanctuary?.length,
    approvals_over_time_count: ownerStats.approvals_over_time?.length,
    latest_pending_requests_count: ownerStats.latest_pending_requests?.length
  });
  if (ownerStatsRes.statusCode !== 200) throw new Error('Owner stats failed');

  // 9. Test Owner Reports (5 SQL queries with subquery and GROUP BY HAVING)
  console.log('\n--- 7. Testing GET /api/owner/reports ---');
  const ownerReportsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/owner/reports',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log(`Status: ${ownerReportsRes.statusCode}`);
  const ownerReports = JSON.parse(ownerReportsRes.data);
  console.log('Owner reports result:', {
    most_booked_sanctuaries: ownerReports.most_booked_sanctuaries?.length,
    frequent_bookers: ownerReports.frequent_bookers?.length,
    monthly_revenue: ownerReports.monthly_revenue?.length,
    slot_occupancy: ownerReports.slot_occupancy?.length,
    cancellation_rate: ownerReports.cancellation_rate?.length
  });
  if (ownerReportsRes.statusCode !== 200) throw new Error('Owner reports failed');

  console.log('\n🎉 ALL PHASE 11 BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
}

run().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
