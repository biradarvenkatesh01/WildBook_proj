'use strict';
require('dotenv').config();
const pool = require('./config/db');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'wildbook_secret_jwt_key_2026';

// Visitor 4 (Visitor)
const visitorToken = jwt.sign(
  { user_id: 4, email: 'visitor@wildbook.com', role: 'VISITOR' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

// Admin 2
const adminToken = jwt.sign(
  { user_id: 2, email: 'admin.nagarhole@wildbook.com', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, headers: response.headers, data };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`   ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' WildBook Phase 9: My Bookings & Cancellation Verification');
  console.log('===============================================================\n');

  try {
    // 1. Unauthenticated request to /bookings/mine returns 401
    const unauthRes = await request('/bookings/mine');
    assert(unauthRes.status === 401, '1. GET /api/bookings/mine without auth returns 401');

    // 2. Default tab (upcoming) returns 200 and bookings array
    const upcomingRes = await request('/bookings/mine', { token: visitorToken });
    assert(upcomingRes.status === 200, '2. GET /api/bookings/mine (upcoming) returns 200');
    assert(Array.isArray(upcomingRes.data?.bookings), '2b. Bookings array returned');
    assert(typeof upcomingRes.data?.counts?.upcoming === 'number', '2c. Tab counts object returned');

    // 3. Past tab returns seed past booking #1
    const pastRes = await request('/bookings/mine?tab=past', { token: visitorToken });
    assert(pastRes.status === 200, '3. GET /api/bookings/mine?tab=past returns 200');
    const pastBooking1 = pastRes.data?.bookings?.find((b) => b.booking_id === 1);
    assert(pastBooking1 !== undefined, '3b. Seed past booking #1 present in past tab');
    assert(pastBooking1?.is_past === true, '3c. Past booking has is_past: true');

    // 4. Create dedicated future slot and confirmed booking for cancellation testing
    const randDay = Math.floor(Math.random() * 20) + 10;
    const testDate = `2026-12-${randDay}`;
    const testTime = `0${Math.floor(Math.random() * 5) + 5}:45:00`;
    const [slt] = await pool.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (1, 1, 1, ?, ?, 6, TRUE)`,
      [testDate, testTime]
    );
    const testSlotId = slt.insertId;

    // Create booking via API
    const bookRes = await request('/bookings', {
      method: 'POST',
      token: visitorToken,
      body: {
        slot_id: testSlotId,
        attendees: [
          { name: 'Test Visitor A', age: 30, id_type: 'AADHAAR', id_number: '1234-5678-9012' },
          { name: 'Test Visitor B', age: 28, id_type: 'PASSPORT', id_number: 'K9876543' },
        ],
      },
    });
    const cancelTestBookingId = bookRes.data?.booking?.booking_id;
    assert(cancelTestBookingId > 0, '4. Test booking created successfully');

    // Confirm payment via API
    const payRes = await request(`/payments/${cancelTestBookingId}/pay`, {
      method: 'POST',
      token: visitorToken,
      body: { success: true },
    });
    assert(payRes.data?.status === 'CONFIRMED', '4b. Test booking confirmed via payment');

    // 5. Cancel preview calculation
    const previewRes = await request(`/bookings/${cancelTestBookingId}/cancel-preview`, {
      token: visitorToken,
    });
    assert(previewRes.status === 200, '5. GET /api/bookings/:id/cancel-preview returns 200');
    const preview = previewRes.data;
    assert(preview?.amount_paid === 3600, '5b. Amount paid matches total booking amount');
    assert(preview?.fee_percent === 40, '5c. Fee percentage is 40%');
    assert(preview?.fee_amount === 1440, '5d. Fee amount correctly calculated as 40% (₹1,440)');
    assert(preview?.refund_amount === 2160, '5e. Refund amount correctly calculated as 60% (₹2,160)');

    // 6. Non-owner cannot preview cancellation
    const forbiddenPreview = await request(`/bookings/${cancelTestBookingId}/cancel-preview`, {
      token: adminToken,
    });
    assert(forbiddenPreview.status === 403, '6. Non-owner cancel preview rejected with 403');

    // 7. Cannot cancel a past booking
    const pastCancelRes = await request('/bookings/1/cancel-preview', {
      token: visitorToken,
    });
    assert(pastCancelRes.status === 400, '7. Cancel preview on past booking rejected with 400');

    // 8. Non-owner cannot cancel booking
    const forbiddenCancel = await request(`/bookings/${cancelTestBookingId}/cancel`, {
      method: 'POST',
      token: adminToken,
    });
    assert(forbiddenCancel.status === 403, '8. Non-owner cancellation rejected with 403');

    // 9. Successfully cancel confirmed booking
    const cancelRes = await request(`/bookings/${cancelTestBookingId}/cancel`, {
      method: 'POST',
      token: visitorToken,
    });
    assert(cancelRes.status === 200, '9. POST /api/bookings/:id/cancel succeeds with 200');
    assert(cancelRes.data?.success === true, '9b. Response indicates success: true');
    assert(cancelRes.data?.fee_amount === 1440, '9c. Fee amount is 1440');
    assert(cancelRes.data?.refund_amount === 2160, '9d. Refund amount is 2160');

    // 10. Database state verification
    const [[dbBooking]] = await pool.query(
      'SELECT status FROM bookings WHERE booking_id = ?',
      [cancelTestBookingId]
    );
    assert(dbBooking?.status === 'CANCELLED', '10. Booking status in DB is CANCELLED');

    const [[dbPayment]] = await pool.query(
      'SELECT payment_status FROM payments WHERE booking_id = ?',
      [cancelTestBookingId]
    );
    assert(dbPayment?.payment_status === 'PARTIALLY_REFUNDED', '10b. Payment status in DB is PARTIALLY_REFUNDED');

    const [[dbCancelAudit]] = await pool.query(
      'SELECT fee_amount, refund_amount FROM cancellations WHERE booking_id = ?',
      [cancelTestBookingId]
    );
    assert(
      Number(dbCancelAudit?.fee_amount) === 1440 && Number(dbCancelAudit?.refund_amount) === 2160,
      '10c. Cancellations audit record created with exact fee and refund amounts'
    );

    // 11. Repeat cancellation rejected
    const repeatCancel = await request(`/bookings/${cancelTestBookingId}/cancel`, {
      method: 'POST',
      token: visitorToken,
    });
    assert(repeatCancel.status === 400, '11. Repeat cancellation rejected with 400');

    // 12. Booking now visible in cancelled tab
    const cancelledTabRes = await request('/bookings/mine?tab=cancelled', {
      token: visitorToken,
    });
    assert(cancelledTabRes.status === 200, '12. GET /api/bookings/mine?tab=cancelled returns 200');
    const cancelledBooking = cancelledTabRes.data?.bookings?.find(
      (b) => b.booking_id === cancelTestBookingId
    );
    assert(cancelledBooking !== undefined, '12b. Cancelled booking found in cancelled tab');
    assert(cancelledBooking?.fee_amount === 1440, '12c. Cancellation fee details included in tab response');

    console.log('\n===============================================================');
    console.log(` SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
