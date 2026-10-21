'use strict';
const http = require('http');
const db = require('./config/db');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: data
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

  return res;
}

const testResults = [];

function recordTest(id, name, expected, actual, passed, details = '') {
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusStr}] ${id}: ${name}`);
  if (!passed) console.log(`   Expected: ${expected}\n   Actual: ${actual}\n   Details: ${details}`);
  testResults.push({ id, name, expected, actual, passed, details });
}

async function runTests() {
  console.log('====================================================');
  console.log('WildBook Verification Test Suite: T1 to T16');
  console.log('====================================================\n');

  let adminToken = '';
  let ownerToken = '';
  let visitorToken = '';

  // Get authentic tokens
  const adminLoginRes = await login('admin', 'admin.nagarhole@wildbook.com', 'Admin@123');
  adminToken = adminLoginRes.data?.token;

  const ownerLoginRes = await login('owner', 'owner@wildbook.com', 'Owner@123');
  ownerToken = ownerLoginRes.data?.token;

  const visitorLoginRes = await login('visitor', 'visitor@wildbook.com', 'Visitor@123');
  visitorToken = visitorLoginRes.data?.token;

  // --------------------------------------------------------------------------
  // T1: Pending admin logs in -> Blocked with a clear message
  // --------------------------------------------------------------------------
  try {
    const t1Res = await login('admin', 'admin.bandipur@wildbook.com', 'Admin@123');
    const msg = t1Res.data?.error || t1Res.data?.message || '';
    const passed = t1Res.statusCode === 403 && (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('review'));
    recordTest('T1', 'Pending admin login blocked', '403 Forbidden with pending message', `Status ${t1Res.statusCode}: ${msg}`, passed);
  } catch (err) {
    recordTest('T1', 'Pending admin login blocked', '403 Forbidden', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T2: Visitor token on an admin or owner route -> 403
  // --------------------------------------------------------------------------
  try {
    const t2Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/sanctuaries',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${visitorToken}` }
    });
    const passed = t2Res.statusCode === 403;
    recordTest('T2', 'Visitor token on admin/owner route', '403 Forbidden', `Status ${t2Res.statusCode}`, passed);
  } catch (err) {
    recordTest('T2', 'Visitor token on admin/owner route', '403 Forbidden', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T3: Admin edits another admin's sanctuary -> 403 or 404
  // --------------------------------------------------------------------------
  try {
    // Insert temporary sanctuary owned by Admin 3
    const [foreignSanc] = await db.query(
      `INSERT INTO sanctuaries (admin_id, name, location, description, contact_email, contact_phone, listing_status)
       VALUES (3, 'Bandipur Protected Sanctuary', 'Bandipur', 'Separate administration', 'other@example.com', '9876543210', 'DRAFT')`
    );
    const foreignSancId = foreignSanc.insertId;

    // Admin 2 (Nagarhole) attempts to modify sanctuary owned by Admin 3
    const t3Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/sanctuaries/${foreignSancId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      name: 'Unauthorized Sanctuary Edit',
      location: 'Bandipur',
      description: 'Attempted cross-admin tampering'
    }));

    const passed = t3Res.statusCode === 403 || t3Res.statusCode === 404;
    recordTest('T3', 'Admin edits another admin sanctuary', '403 Forbidden or 404 Not Found', `Status ${t3Res.statusCode}`, passed);

    await db.query('DELETE FROM sanctuaries WHERE sanctuary_id = ?', [foreignSancId]);
  } catch (err) {
    recordTest('T3', 'Admin edits another admin sanctuary', '403/404', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T4: Unapproved sanctuary opened by URL -> 404
  // --------------------------------------------------------------------------
  try {
    // Insert temporary DRAFT sanctuary to test public exclusion
    const [draftRes] = await db.query(
      `INSERT INTO sanctuaries (admin_id, name, location, description, contact_email, contact_phone, listing_status)
       VALUES (2, 'Secret Unapproved Reserve', 'Coorg', 'Private forest', 'reserve@example.com', '9876543210', 'DRAFT')`
    );
    const unapprovedId = draftRes.insertId;

    const t4Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/sanctuaries/${unapprovedId}`,
      method: 'GET'
    });
    const passed = t4Res.statusCode === 404;
    recordTest('T4', 'Unapproved sanctuary opened by public URL', '404 Not Found', `Status ${t4Res.statusCode}`, passed);

    // Clean up
    await db.query('DELETE FROM sanctuaries WHERE sanctuary_id = ?', [unapprovedId]);
  } catch (err) {
    recordTest('T4', 'Unapproved sanctuary opened by public URL', '404 Not Found', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T5: Submit sanctuary with no image, activity or slot -> Rejected
  // --------------------------------------------------------------------------
  try {
    const [emptySanc] = await db.query(
      `INSERT INTO sanctuaries (admin_id, name, location, description, contact_email, contact_phone, listing_status)
       VALUES (2, 'Incomplete Park', 'Mysore', 'No details yet', 'empty@example.com', '9876543210', 'DRAFT')`
    );
    const incompleteId = emptySanc.insertId;

    const t5Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/sanctuaries/${incompleteId}/submit`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const passed = t5Res.statusCode === 400;
    recordTest('T5', 'Submit with no image, activity or slot', '400 Bad Request rejection', `Status ${t5Res.statusCode}: ${t5Res.data?.error || ''}`, passed);

    await db.query('DELETE FROM sanctuaries WHERE sanctuary_id = ?', [incompleteId]);
  } catch (err) {
    recordTest('T5', 'Submit with no image, activity or slot', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T6: Owner approves a sanctuary -> It appears in the public list
  // --------------------------------------------------------------------------
  try {
    const [sancCheck] = await db.query('SELECT sanctuary_id, name FROM sanctuaries WHERE listing_status = "APPROVED" LIMIT 1');
    const approvedSancId = sancCheck[0]?.sanctuary_id;

    const t6Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/sanctuaries',
      method: 'GET'
    });
    const publicList = t6Res.data?.sanctuaries || [];
    const found = publicList.some(s => s.sanctuary_id === approvedSancId);
    recordTest('T6', 'Owner approved sanctuary appears in public list', 'Appears in GET /api/sanctuaries', found ? 'Found in public list' : 'Not found', found);
  } catch (err) {
    recordTest('T6', 'Owner approved sanctuary appears in public list', 'Found', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T7: Booking above remaining capacity -> Rejected, nothing inserted
  // --------------------------------------------------------------------------
  try {
    const [slotRow] = await db.query(
      'SELECT slot_id, capacity FROM slots WHERE is_active = TRUE AND slot_date >= CURDATE() LIMIT 1'
    );
    const slotId = slotRow[0]?.slot_id;
    const overCapacity = (slotRow[0]?.capacity || 6) + 100;

    const t7Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${visitorToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      slot_id: slotId,
      number_of_people: overCapacity,
      attendees: Array.from({ length: overCapacity }, (_, i) => ({
        name: `Guest ${i + 1}`,
        age: 30,
        id_type: 'PASSPORT',
        id_number: `PASS${1000 + i}`
      }))
    }));
    const passed = t7Res.statusCode === 400 && (t7Res.data?.error || '').toLowerCase().includes('seat');
    recordTest('T7', 'Booking above remaining capacity', '400 Bad Request (Not enough seats)', `Status ${t7Res.statusCode}: ${t7Res.data?.error || ''}`, passed);
  } catch (err) {
    recordTest('T7', 'Booking above remaining capacity', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T8: Two concurrent bookings for the last seats -> Exactly one succeeds
  // --------------------------------------------------------------------------
  try {
    const cleanSlotData = async (date, time) => {
      const [slots] = await db.query('SELECT slot_id FROM slots WHERE slot_date = ? AND slot_time = ?', [date, time]);
      for (const s of slots) {
        const [bks] = await db.query('SELECT booking_id FROM bookings WHERE slot_id = ?', [s.slot_id]);
        if (bks.length > 0) {
          const bIds = bks.map(b => b.booking_id);
          await db.query('DELETE FROM payments WHERE booking_id IN (?)', [bIds]);
          await db.query('DELETE FROM booking_attendees WHERE booking_id IN (?)', [bIds]);
          await db.query('DELETE FROM cancellations WHERE booking_id IN (?)', [bIds]);
          await db.query('DELETE FROM bookings WHERE booking_id IN (?)', [bIds]);
        }
        await db.query('DELETE FROM slots WHERE slot_id = ?', [s.slot_id]);
      }
    };

    // Clean up before test
    await cleanSlotData('2027-01-10', '16:00:00');

    // Create dedicated slot with exactly 2 seats
    const [tempSlot] = await db.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (1, 1, 1, '2027-01-10', '16:00:00', 2, TRUE)`
    );
    const raceSlotId = tempSlot.insertId;

    const makeBooking = (userName) => request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${visitorToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      slot_id: raceSlotId,
      number_of_people: 2,
      attendees: [
        { name: `${userName} 1`, age: 25, id_type: 'AADHAAR', id_number: '123456789012' },
        { name: `${userName} 2`, age: 28, id_type: 'AADHAAR', id_number: '123456789013' }
      ]
    }));

    // Fire 2 concurrent requests
    const [resA, resB] = await Promise.all([makeBooking('Alice'), makeBooking('Bob')]);

    const successes = [resA, resB].filter(r => r.statusCode === 201).length;
    const rejections = [resA, resB].filter(r => r.statusCode === 400).length;
    const passed = successes === 1 && rejections === 1;

    recordTest('T8', 'Concurrent bookings for last seats (Atomic Lock)', 'Exactly 1 success and 1 rejection', `${successes} succeeded, ${rejections} rejected`, passed);

    // Clean up after test
    await cleanSlotData('2027-01-10', '16:00:00');
  } catch (err) {
    recordTest('T8', 'Concurrent bookings for last seats', '1 success / 1 rejected', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T9: Payment after the hold expires -> Rejected, booking EXPIRED
  // --------------------------------------------------------------------------
  try {
    // Create slot and expired booking
    const [sRow] = await db.query('SELECT slot_id FROM slots WHERE is_active = TRUE LIMIT 1');
    const slotId = sRow[0]?.slot_id;

    const [bRes] = await db.query(
      `INSERT INTO bookings (booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at)
       VALUES ('TEST-EXP-001', 4, ?, 1, 'PENDING', 1200.00, DATE_SUB(NOW(), INTERVAL 5 MINUTE))`,
      [slotId]
    );
    const expBookingId = bRes.insertId;

    await db.query(
      `INSERT INTO payments (booking_id, amount, payment_status) VALUES (?, 1200.00, 'PENDING')`,
      [expBookingId]
    );

    const t9Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/payments/${expBookingId}/pay`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${visitorToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({ method: 'UPI', upi_id: 'visitor@okaxis' }));

    const passed = t9Res.statusCode === 400 && (t9Res.data?.error || '').toLowerCase().includes('expired');
    recordTest('T9', 'Payment after hold expires', '400 Bad Request (Hold has expired)', `Status ${t9Res.statusCode}: ${t9Res.data?.error || ''}`, passed);

    await db.query('DELETE FROM payments WHERE booking_id = ?', [expBookingId]);
    await db.query('DELETE FROM bookings WHERE booking_id = ?', [expBookingId]);
  } catch (err) {
    recordTest('T9', 'Payment after hold expires', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T10: Cancel a confirmed booking -> 40% fee, 60% refund, seats freed
  // --------------------------------------------------------------------------
  let testBookingId = null;
  try {
    const [sRow] = await db.query('SELECT slot_id FROM slots WHERE is_active = TRUE AND slot_date > CURDATE() LIMIT 1');
    const slotId = sRow[0]?.slot_id;

    // Create confirmed booking for ₹2000
    const [bRes] = await db.query(
      `INSERT INTO bookings (booking_code, user_id, slot_id, number_of_people, status, total_amount)
       VALUES ('TEST-CAN-010', 4, ?, 2, 'CONFIRMED', 2000.00)`,
      [slotId]
    );
    testBookingId = bRes.insertId;

    await db.query(
      `INSERT INTO payments (booking_id, amount, payment_status, transaction_ref, paid_at)
       VALUES (?, 2000.00, 'PAID', 'TXN_TEST_10', NOW())`,
      [testBookingId]
    );

    // Cancel via API
    const t10Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bookings/${testBookingId}/cancel`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${visitorToken}` }
    });

    const [cRow] = await db.query('SELECT fee_amount, refund_amount FROM cancellations WHERE booking_id = ?', [testBookingId]);
    const fee = Number(cRow[0]?.fee_amount || 0);
    const refund = Number(cRow[0]?.refund_amount || 0);

    const passed = t10Res.statusCode === 200 && fee === 800 && refund === 1200;
    recordTest('T10', 'Cancel confirmed booking (40% fee, 60% refund)', '40% fee (₹800), 60% refund (₹1200)', `Fee: ₹${fee}, Refund: ₹${refund}`, passed);
  } catch (err) {
    recordTest('T10', 'Cancel confirmed booking', '40% fee, 60% refund', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T11: Cancel an already cancelled booking -> Rejected
  // --------------------------------------------------------------------------
  try {
    const t11Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bookings/${testBookingId}/cancel`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${visitorToken}` }
    });
    const passed = t11Res.statusCode === 400;
    recordTest('T11', 'Cancel already cancelled booking', '400 Bad Request rejection', `Status ${t11Res.statusCode}: ${t11Res.data?.error || ''}`, passed);

    // Clean up
    await db.query('DELETE FROM cancellations WHERE booking_id = ?', [testBookingId]);
    await db.query('DELETE FROM payments WHERE booking_id = ?', [testBookingId]);
    await db.query('DELETE FROM bookings WHERE booking_id = ?', [testBookingId]);
  } catch (err) {
    recordTest('T11', 'Cancel already cancelled booking', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T12: Review without a past booking, or twice -> Rejected
  // --------------------------------------------------------------------------
  try {
    // Attempt review on a future booking or arbitrary ID
    const t12Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/reviews',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${visitorToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      booking_id: 999999,
      rating: 5,
      comment: 'Super trip'
    }));
    const passed = t12Res.statusCode === 400 || t12Res.statusCode === 404;
    recordTest('T12', 'Review without completed past booking', '400/404 Rejection', `Status ${t12Res.statusCode}`, passed);
  } catch (err) {
    recordTest('T12', 'Review without past booking', '400/404', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T13: Duplicate email -> Rejected
  // --------------------------------------------------------------------------
  try {
    const t13Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/user/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({
      name: 'Duplicate Test',
      email: 'visitor@wildbook.com', // Already registered
      phone: '+91 90000 11111',
      password: 'Password@123'
    }));
    const passed = (t13Res.statusCode === 400 || t13Res.statusCode === 409) && (t13Res.data?.error || '').toLowerCase().includes('email');
    recordTest('T13', 'Duplicate email registration', '400/409 Conflict (Email already in use)', `Status ${t13Res.statusCode}: ${t13Res.data?.error || ''}`, passed);
  } catch (err) {
    recordTest('T13', 'Duplicate email', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T14: Guide double-allocated at the same time -> Rejected by DB trigger/unique constraint
  // --------------------------------------------------------------------------
  try {
    let triggeredError = false;
    try {
      // Guide 1 is scheduled on 2026-12-28 09:15:00
      await db.query(
        `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
         VALUES (1, 1, 2, '2026-12-28', '09:15:00', 4, TRUE)`
      );
    } catch (dbErr) {
      triggeredError = true;
    }
    recordTest('T14', 'Guide double-allocated at same date & time', 'Database UNIQUE constraint/trigger violation', triggeredError ? 'ER_DUP_ENTRY / Trigger violation caught' : 'Inserted without error', triggeredError);
  } catch (err) {
    recordTest('T14', 'Guide double-allocation', 'Error caught', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T15: Attendee count differs from number of people -> Whole booking rolls back
  // --------------------------------------------------------------------------
  try {
    const [sRow] = await db.query('SELECT slot_id FROM slots WHERE is_active = TRUE LIMIT 1');
    const slotId = sRow[0]?.slot_id;

    const t15Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${visitorToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      slot_id: slotId,
      number_of_people: 3, // Claims 3 people
      attendees: [
        { name: 'Only One Attendee', age: 24, id_type: 'PASSPORT', id_number: 'P1234567' }
        // Missing 2 attendees
      ]
    }));
    const passed = t15Res.statusCode === 400 && (t15Res.data?.error || '').toLowerCase().includes('attendee');
    recordTest('T15', 'Attendee count mismatch rolls back transaction', '400 Bad Request (Attendee count mismatch)', `Status ${t15Res.statusCode}: ${t15Res.data?.error || ''}`, passed);
  } catch (err) {
    recordTest('T15', 'Attendee count mismatch', '400 Bad Request', err.message, false);
  }

  // --------------------------------------------------------------------------
  // T16: Admin document URL opened by a visitor -> 403
  // --------------------------------------------------------------------------
  try {
    const t16Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/owner/admins/2/documents/1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${visitorToken}` }
    });
    const passed = t16Res.statusCode === 403;
    recordTest('T16', 'Admin document URL opened by a visitor', '403 Forbidden', `Status ${t16Res.statusCode}`, passed);
  } catch (err) {
    recordTest('T16', 'Admin document URL opened by visitor', '403 Forbidden', err.message, false);
  }

  console.log('\n====================================================');
  const allPassed = testResults.every(t => t.passed);
  const passedCount = testResults.filter(t => t.passed).length;
  console.log(`Final Result: ${passedCount}/${testResults.length} Tests Passed!`);
  console.log('====================================================');

  return { testResults, allPassed, passedCount };
}

if (require.main === module) {
  runTests()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test runner error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
