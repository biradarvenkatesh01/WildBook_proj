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
  console.log(' WildBook Phase 10: Reviews & Ratings Verification');
  console.log('===============================================================\n');

  try {
    // 1. Unauthenticated request to /api/reviews returns 401
    const unauthRes = await request('/reviews', {
      method: 'POST',
      body: { booking_id: 1, rating: 5, comment: 'Great' },
    });
    assert(unauthRes.status === 401, '1. POST /api/reviews without auth returns 401');

    // 2. Invalid rating returns 400
    const invalidRatingRes = await request('/reviews', {
      method: 'POST',
      token: visitorToken,
      body: { booking_id: 1, rating: 6, comment: 'Invalid rating' },
    });
    assert(invalidRatingRes.status === 400, '2. POST /api/reviews with rating > 5 returns 400');

    // 3. Premature review on future booking #2 (Slot 2026-11-20) returns 400
    const prematureRes = await request('/reviews', {
      method: 'POST',
      token: visitorToken,
      body: { booking_id: 2, rating: 5, comment: 'Cannot review future slot' },
    });
    assert(prematureRes.status === 400, '3. POST /api/reviews on future slot returns 400');

    // 4. Create dedicated past slot and past confirmed booking for review testing
    const randDay = Math.floor(Math.random() * 25) + 1;
    const pastDate = `2026-01-${String(randDay).padStart(2, '0')}`;
    const pastTime = `0${Math.floor(Math.random() * 4) + 5}:${Math.floor(Math.random() * 50) + 10}:00`;
    const [pastSlotRes] = await pool.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (1, 1, 1, ?, ?, 6, TRUE)`,
      [pastDate, pastTime]
    );
    const pastSlotId = pastSlotRes.insertId;

    const testBookingCode = `WB-REV${Math.floor(Math.random() * 89999 + 10000)}`;
    const [pastBookingRes] = await pool.query(
      `INSERT INTO bookings (booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at)
       VALUES (?, 4, ?, 2, 'CONFIRMED', 3600.00, NULL, '2026-01-05 10:00:00')`,
      [testBookingCode, pastSlotId]
    );
    const testPastBookingId = pastBookingRes.insertId;

    await pool.query(
      `INSERT INTO payments (booking_id, amount, payment_status, transaction_ref, paid_at)
       VALUES (?, 3600.00, 'PAID', 'tx_test_rev_paid', '2026-01-05 10:05:00')`,
      [testPastBookingId]
    );

    // 5. Non-owner cannot review booking
    const nonOwnerRes = await request('/reviews', {
      method: 'POST',
      token: adminToken,
      body: { booking_id: testPastBookingId, rating: 5, comment: 'Admin cannot review' },
    });
    assert(nonOwnerRes.status === 403, '4. Non-owner review creation rejected with 403');

    // 6. GET /api/reviews/booking/:bookingId context check
    const contextRes = await request(`/reviews/booking/${testPastBookingId}`, {
      token: visitorToken,
    });
    assert(contextRes.status === 200, '5. GET /api/reviews/booking/:id returns 200');
    assert(contextRes.data?.booking?.sanctuary_name !== undefined, '5b. Sanctuary details returned in context');
    assert(contextRes.data?.booking?.is_past === 1 || contextRes.data?.booking?.is_past === true, '5c. Booking is confirmed past visit');

    // 7. Successful review creation
    const createReviewRes = await request('/reviews', {
      method: 'POST',
      token: visitorToken,
      body: {
        booking_id: testPastBookingId,
        rating: 5,
        comment: 'Extraordinary wildlife safari! The tiger sighting by the watering hole was magnificent.',
      },
    });
    assert(createReviewRes.status === 201, '6. POST /api/reviews succeeds with 201 Created');
    assert(createReviewRes.data?.review?.rating === 5, '6b. Stored rating is 5');
    assert(createReviewRes.data?.review?.comment?.includes('watering hole'), '6c. Comment saved correctly');

    // 8. Duplicate review on same booking rejected with 400
    const duplicateRes = await request('/reviews', {
      method: 'POST',
      token: visitorToken,
      body: {
        booking_id: testPastBookingId,
        rating: 4,
        comment: 'Attempting duplicate review',
      },
    });
    assert(duplicateRes.status === 400, '7. Duplicate review on same booking rejected with 400');

    // 9. GET /api/sanctuaries/:id/reviews paged reviews endpoint
    const pagedRes = await request('/sanctuaries/1/reviews?page=1&limit=5');
    assert(pagedRes.status === 200, '8. GET /api/sanctuaries/:id/reviews returns 200');
    assert(Array.isArray(pagedRes.data?.reviews), '8b. Reviews array returned');
    assert(pagedRes.data?.pagination?.total >= 2, '8c. Pagination total reflects both reviews');

    // 10. GET /api/sanctuaries/:id includes ratings_summary
    const detailRes = await request('/sanctuaries/1');
    assert(detailRes.status === 200, '9. GET /api/sanctuaries/:id returns 200');
    const summary = detailRes.data?.ratings_summary;
    assert(typeof summary?.average_rating === 'number', '9b. ratings_summary.average_rating is a number');
    assert(summary?.total_reviews >= 2, `9c. ratings_summary.total_reviews reflects count (${summary?.total_reviews})`);
    assert(
      summary?.counts && typeof summary.counts[5] === 'number',
      '9d. ratings_summary.counts has 5-to-1 star distribution'
    );

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
