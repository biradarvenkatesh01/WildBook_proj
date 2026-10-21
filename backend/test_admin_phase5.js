'use strict';
/**
 * Automated Test Suite for Phase 5: Admin Activities, Guides, Vehicles, and Slots
 */
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', require('./routes/admin'));

const JWT_SECRET = process.env.JWT_SECRET || 'wildbook-dev-super-secret-key-change-in-production-2026';

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

// Tokens
const approvedAdminToken = generateToken({
  user_id: 2,
  email: 'admin.nagarhole@wildbook.com',
  role: 'ADMIN',
  account_status: 'APPROVED',
});

const visitorToken = generateToken({
  user_id: 4,
  email: 'visitor@wildbook.com',
  role: 'VISITOR',
  account_status: 'APPROVED',
});

let server;
const PORT = 5005;
const BASE_URL = `http://localhost:${PORT}/api/admin`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const status = res.status;
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`\n❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`   ✓ PASS: ${message}`);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' WildBook Phase 5: Activities & Slots API Verification');
  console.log('===============================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`-> Test server listening on http://localhost:${PORT}\n`);
      resolve();
    });
  });

  try {
    // 1. Role Authorization
    const resAuth = await request('/activities', { token: visitorToken });
    assert(resAuth.status === 403, '1. Visitor rejected from admin operations with 403');

    // 2. Fetch existing activities
    const resActivities = await request('/activities?sanctuary_id=1', { token: approvedAdminToken });
    assert(resActivities.status === 200, '2. Approved admin can list activities for Sanctuary 1');
    assert(Array.isArray(resActivities.data.activities), '2b. Response contains activities array');
    const initActCount = resActivities.data.activities.length;

    // 3. Create a new activity
    const newActData = {
      sanctuary_id: 1,
      activity_name: 'Coracle Boat Ride & Otter Safari',
      description: 'Traditional round coracle boat experience tracking smooth-coated otters.',
      duration_minutes: 90,
      what_to_carry: 'Life jacket provided, dry bag for electronics',
      price: 1100,
    };
    const resCreateAct = await request('/activities', {
      method: 'POST',
      token: approvedAdminToken,
      body: newActData,
    });
    assert(resCreateAct.status === 201, '3. Admin creates activity in sanctuary');
    const createdActivityId = resCreateAct.data.activity_id;

    // 4. Update activity
    const resUpdateAct = await request(`/activities/${createdActivityId}`, {
      method: 'PUT',
      token: approvedAdminToken,
      body: { price: 1250, description: 'Updated otter safari description.' },
    });
    assert(resUpdateAct.status === 200, '4. Admin updates activity price and description');

    // 5. Guides CRUD
    const resGuides = await request('/guides?sanctuary_id=1', { token: approvedAdminToken });
    assert(resGuides.status === 200, '5. Admin retrieves guides for sanctuary');

    const resCreateGuide = await request('/guides', {
      method: 'POST',
      token: approvedAdminToken,
      body: { sanctuary_id: 1, name: 'Anil Poovaiah', phone: '+91 94488 99001', experience: 7 },
    });
    assert(resCreateGuide.status === 201, '5b. Admin registers new guide');
    const testGuideId = resCreateGuide.data.guide_id;

    // 6. Vehicles CRUD
    const resVehicles = await request('/vehicles?sanctuary_id=1', { token: approvedAdminToken });
    assert(resVehicles.status === 200, '6. Admin retrieves vehicles for sanctuary');

    const resCreateVeh = await request('/vehicles', {
      method: 'POST',
      token: approvedAdminToken,
      body: { sanctuary_id: 1, vehicle_type: 'Test Jeep 4x4 (KA-09-P-9999)', capacity: 6 },
    });
    assert(resCreateVeh.status === 201, '6b. Admin registers new vehicle');
    const testVehicleId = resCreateVeh.data.vehicle_id;

    // 7. GET /api/admin/slots?sanctuary_id=&week=
    const resSlots = await request('/slots?sanctuary_id=1&week=2026-11-20', {
      token: approvedAdminToken,
    });
    assert(resSlots.status === 200, '7. Retrieve weekly slots with seats calculation');
    assert(resSlots.data.slots.length > 0, '7b. Slots returned for week containing 2026-11-20');
    const slot2 = resSlots.data.slots.find((s) => s.slot_id === 2);
    assert(slot2 !== undefined, '7c. Slot #2 found with booking details');
    assert(slot2.booked_seats === 2, `7d. Slot #2 booked_seats is 2 (actual: ${slot2.booked_seats})`);
    assert(slot2.available_seats === 4, `7e. Slot #2 available_seats is 4 (actual: ${slot2.available_seats})`);

    // 8. Trigger error mapping: Slot capacity > vehicle capacity
    const resCapExceed = await request('/slots', {
      method: 'POST',
      token: approvedAdminToken,
      body: {
        activity_id: createdActivityId,
        guide_id: testGuideId,
        vehicle_id: testVehicleId, // capacity is 6
        slot_date: '2026-12-01',
        slot_time: '07:00:00',
        capacity: 10, // exceeds vehicle capacity of 6
      },
    });
    assert(resCapExceed.status === 400, '8. Exceeding vehicle capacity is rejected with 400');
    assert(
      resCapExceed.data.error === 'Slot capacity cannot exceed vehicle capacity',
      `8b. Error message matches trigger: "${resCapExceed.data.error}"`
    );

    // 9. Trigger error mapping: Cross-sanctuary mismatch
    // Activity in Sanctuary 1, Guide 4 is in Sanctuary 2
    const resMismatch = await request('/slots', {
      method: 'POST',
      token: approvedAdminToken,
      body: {
        activity_id: createdActivityId, // Sanctuary 1
        guide_id: 4, // Sanctuary 2
        vehicle_id: testVehicleId, // Sanctuary 1
        slot_date: '2026-12-01',
        slot_time: '07:00:00',
        capacity: 6,
      },
    });
    assert(resMismatch.status === 400, '9. Cross-sanctuary guide/activity mismatch rejected with 400');
    assert(
      resMismatch.data.error === 'Vehicle, guide, and activity must belong to the same sanctuary',
      `9b. Error message matches: "${resMismatch.data.error}"`
    );

    // 10. Schedule valid slot & test UNIQUE constraint conflict
    const resCreateSlot = await request('/slots', {
      method: 'POST',
      token: approvedAdminToken,
      body: {
        activity_id: createdActivityId,
        guide_id: testGuideId,
        vehicle_id: testVehicleId,
        slot_date: '2026-12-01',
        slot_time: '07:00:00',
        capacity: 6,
      },
    });
    assert(resCreateSlot.status === 201, '10. Valid slot created successfully');
    const createdSlotId = resCreateSlot.data.slot_id;

    // 11. Duplicate Guide at same date & time
    const resDupGuide = await request('/slots', {
      method: 'POST',
      token: approvedAdminToken,
      body: {
        activity_id: 1, // another activity in Sanctuary 1
        guide_id: testGuideId, // same guide
        vehicle_id: 2, // different vehicle (boat) in Sanctuary 1
        slot_date: '2026-12-01',
        slot_time: '07:00:00',
        capacity: 6,
      },
    });
    assert(resDupGuide.status === 409, '11. Duplicate guide assignment rejected with 409');
    assert(
      resDupGuide.data.error === 'Guide is already assigned to another slot at this date and time',
      `11b. Duplicate guide error mapped correctly: "${resDupGuide.data.error}"`
    );

    // 12. Duplicate Vehicle at same date & time
    const resDupVeh = await request('/slots', {
      method: 'POST',
      token: approvedAdminToken,
      body: {
        activity_id: 1,
        guide_id: 1, // different guide in Sanctuary 1
        vehicle_id: testVehicleId, // same vehicle
        slot_date: '2026-12-01',
        slot_time: '07:00:00',
        capacity: 6,
      },
    });
    assert(resDupVeh.status === 409, '12. Duplicate vehicle assignment rejected with 409');
    assert(
      resDupVeh.data.error === 'Vehicle is already assigned to another slot at this date and time',
      `12b. Duplicate vehicle error mapped correctly: "${resDupVeh.data.error}"`
    );

    // 13. Rule: Slot with confirmed bookings cannot change date, time or capacity
    const resImmutable = await request('/slots/2', {
      method: 'PUT',
      token: approvedAdminToken,
      body: {
        slot_time: '09:00:00', // Slot 2 has confirmed booking!
      },
    });
    assert(resImmutable.status === 400, '13. Changing time on booked slot rejected with 400');
    assert(
      resImmutable.data.error === 'A slot with confirmed bookings cannot change date, time or capacity',
      `13b. Confirmed slot immutability error: "${resImmutable.data.error}"`
    );

    // 14. Rule: Slot with bookings deactivates (is_active = FALSE) instead of hard delete
    const resDeactSlot = await request('/slots/2', {
      method: 'DELETE',
      token: approvedAdminToken,
    });
    assert(resDeactSlot.status === 200, '14. Delete booked slot deactivates instead of deleting');
    assert(resDeactSlot.data.is_active === false, '14b. Response returns is_active: false');

    // Clean up created slot & activity
    await request(`/slots/${createdSlotId}`, { method: 'DELETE', token: approvedAdminToken });
    await request(`/activities/${createdActivityId}`, { method: 'DELETE', token: approvedAdminToken });
    await db.query('DELETE FROM guides WHERE guide_id = ?', [testGuideId]);
    await db.query('DELETE FROM vehicles WHERE vehicle_id = ?', [testVehicleId]);
    // Restore slot 2 active state
    await db.query('UPDATE slots SET is_active = TRUE WHERE slot_id = 2');

    console.log('\n===============================================================');
    console.log(' SUMMARY: All 14 Phase 5 API & Rule Tests Passed Cleanly!');
    console.log('===============================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  if (server) server.close();
  process.exit(1);
});
