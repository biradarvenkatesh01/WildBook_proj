'use strict';
require('dotenv').config();
const pool = require('./config/db');
const jwt = require('jsonwebtoken');
const http = require('http');
const expireHolds = require('./jobs/expireHolds');

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
  if (options.body && typeof options.body === 'object' && !(options.body instanceof Buffer)) {
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
  } else if (contentType.includes('application/pdf')) {
    data = await response.arrayBuffer();
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
  console.log(' WildBook Phase 8: Booking, Payment & Ticket Verification');
  console.log('===============================================================\n');

  try {
    // 1. Unauthenticated booking creation rejected
    const unauthRes = await request('/bookings', {
      method: 'POST',
      body: { slot_id: 3, attendees: [{ name: 'Test', age: 25, id_type: 'AADHAAR', id_number: '1234' }] },
    });
    assert(unauthRes.status === 401, '1. POST /api/bookings without auth returns 401');

    // 2. Invalid payload validation
    const invalidRes = await request('/bookings', {
      method: 'POST',
      token: visitorToken,
      body: { slot_id: 3, attendees: [] },
    });
    assert(invalidRes.status === 400, '2. POST /api/bookings with empty attendees returns 400');

    // 3. Create a dedicated slot for test booking
    const randDay = Math.floor(Math.random() * 20) + 10;
    const testDate = `2026-12-${randDay}`;
    const testTime = `0${Math.floor(Math.random() * 5) + 5}:15:00`;
    const [slotRes] = await pool.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (1, 1, 1, ?, ?, 4, TRUE)`,
      [testDate, testTime]
    );
    const testSlotId = slotRes.insertId;

    // 4. Successful booking creation with 10-minute hold
    const createRes = await request('/bookings', {
      method: 'POST',
      token: visitorToken,
      body: {
        slot_id: testSlotId,
        attendees: [
          { name: 'Aarav Sharma', age: 29, id_type: 'AADHAAR', id_number: '1122-3344-5566' },
          { name: 'Diya Sharma', age: 27, id_type: 'PASSPORT', id_number: 'J8876541' },
        ],
      },
    });

    assert(createRes.status === 201, '3. POST /api/bookings returns 201 Created');
    const createdBooking = createRes.data?.booking;
    assert(createdBooking?.booking_id > 0, '3b. Returns valid booking_id');
    assert(createdBooking?.status === 'PENDING', '3c. Initial status is PENDING');
    assert(
      /^WB-\d{6}$/.test(createdBooking?.booking_code) || /^WB-[A-Z0-9]+$/.test(createdBooking?.booking_code),
      `3d. Booking code is formatted properly (${createdBooking?.booking_code})`
    );
    assert(
      createdBooking?.remaining_hold_seconds > 500 && createdBooking?.remaining_hold_seconds <= 600,
      `3e. 10-minute hold active (${createdBooking?.remaining_hold_seconds}s remaining)`
    );

    const testBookingId = createdBooking.booking_id;

    // 5. GET /api/bookings/:id - ownership and details
    const getRes = await request(`/bookings/${testBookingId}`, {
      token: visitorToken,
    });
    assert(getRes.status === 200, '4. GET /api/bookings/:id returns 200 for owner');
    assert(getRes.data?.booking?.attendees?.length === 2, '4b. Correct number of attendees returned');
    assert(getRes.data?.booking?.sanctuary_name?.includes('Nagarhole'), '4c. Sanctuary details attached');

    // 6. Ownership enforcement on GET /api/bookings/:id (Admin 2 does not own it)
    const forbiddenGet = await request(`/bookings/${testBookingId}`, {
      token: adminToken,
    });
    assert(forbiddenGet.status === 403, '5. GET /api/bookings/:id rejects non-owner with 403');

    // 7. Mock Payment Simulation: Failure
    const payFailRes = await request(`/payments/${testBookingId}/pay`, {
      method: 'POST',
      token: visitorToken,
      body: { success: false, payment_method: 'CARD' },
    });
    assert(payFailRes.status === 200, '6. Simulated payment failure returns 200');
    assert(payFailRes.data?.success === false, '6b. Response indicates success: false');
    assert(payFailRes.data?.status === 'PENDING', '6c. Booking stays PENDING for retry');

    const [[dbPayFail]] = await pool.query('SELECT payment_status FROM payments WHERE booking_id = ?', [testBookingId]);
    assert(dbPayFail?.payment_status === 'FAILED', '6d. Payment record in DB marked FAILED');

    const [[dbBookPending]] = await pool.query('SELECT status FROM bookings WHERE booking_id = ?', [testBookingId]);
    assert(dbBookPending?.status === 'PENDING', '6e. Booking in DB remains PENDING until hold ends');

    // 8. Cannot download ticket for PENDING booking
    const ticketPendingRes = await request(`/bookings/${testBookingId}/ticket`, {
      token: visitorToken,
    });
    assert(ticketPendingRes.status === 400, '7. GET /api/bookings/:id/ticket rejects PENDING booking with 400');

    // 9. Mock Payment Simulation: Success (Retry)
    const paySuccessRes = await request(`/payments/${testBookingId}/pay`, {
      method: 'POST',
      token: visitorToken,
      body: { success: true, payment_method: 'UPI' },
    });
    assert(paySuccessRes.status === 200, '8. Simulated payment success returns 200');
    assert(paySuccessRes.data?.success === true, '8b. Response indicates success: true');
    assert(paySuccessRes.data?.status === 'CONFIRMED', '8c. Status is CONFIRMED');
    assert(paySuccessRes.data?.booking_code, '8d. Returns confirmed booking code');

    const [[dbConfirmed]] = await pool.query(
      'SELECT b.status AS b_status, p.payment_status AS p_status FROM bookings b JOIN payments p ON b.booking_id = p.booking_id WHERE b.booking_id = ?',
      [testBookingId]
    );
    assert(dbConfirmed?.b_status === 'CONFIRMED' && dbConfirmed?.p_status === 'PAID', '8e. Booking is CONFIRMED and payment is PAID in DB');

    // 10. GET /api/bookings/:id/ticket generates in-memory PDF with QR code
    const ticketRes = await request(`/bookings/${testBookingId}/ticket`, {
      token: visitorToken,
    });
    assert(ticketRes.status === 200, '9. GET /api/bookings/:id/ticket returns 200');
    assert(ticketRes.headers.get('content-type') === 'application/pdf', '9b. Content-Type is application/pdf');
    assert(ticketRes.data.byteLength > 1000, `9c. Generated valid PDF binary (${ticketRes.data.byteLength} bytes)`);

    // 11. Overbooking prevention check on remaining seats
    // Slot capacity was 4, 2 seats are now CONFIRMED. Attempting to book 3 seats must fail
    const overbookRes = await request('/bookings', {
      method: 'POST',
      token: visitorToken,
      body: {
        slot_id: testSlotId,
        attendees: [
          { name: 'Person 1', age: 20, id_type: 'AADHAAR', id_number: '111' },
          { name: 'Person 2', age: 21, id_type: 'AADHAAR', id_number: '222' },
          { name: 'Person 3', age: 22, id_type: 'AADHAAR', id_number: '333' },
        ],
      },
    });
    assert(overbookRes.status === 400, '10. Overbooking beyond slot capacity returns 400 NOT_ENOUGH_SEATS');

    // 12. Run hold expiration job
    const expiredCount = await expireHolds.runExpireHolds();
    assert(typeof expiredCount === 'number', '11. expireHolds job executed cleanly');

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
