'use strict';
/**
 * Automated Test Suite for Phase 6: Sanctuary Submission & Site Owner Review
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
app.use('/api/owner', require('./routes/owner'));

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

const ownerToken = generateToken({
  user_id: 1,
  email: 'owner@wildbook.com',
  role: 'SITE_OWNER',
  account_status: 'APPROVED',
});

const visitorToken = generateToken({
  user_id: 4,
  email: 'visitor@wildbook.com',
  role: 'VISITOR',
  account_status: 'APPROVED',
});

let server;
const PORT = 5006;
const BASE_URL = `http://localhost:${PORT}/api`;

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
  console.log(' WildBook Phase 6: Sanctuary Submit & Review Verification');
  console.log('===============================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`-> Test server listening on http://localhost:${PORT}\n`);
      resolve();
    });
  });

  let testSanctuaryId = null;
  let testActivityId = null;
  let testGuideId = null;
  let testVehicleId = null;
  let testSlotId = null;

  try {
    // 1. Role Authorization
    const resAuth = await request('/owner/sanctuaries', { token: visitorToken });
    assert(resAuth.status === 403, '1. Visitor rejected from owner sanctuary endpoints with 403');

    // 2. Create a clean DRAFT sanctuary for submission testing
    const [createRes] = await db.query(
      `INSERT INTO sanctuaries (admin_id, name, location, description, listing_status)
       VALUES (?, ?, ?, ?, 'DRAFT')`,
      [2, 'Greenwood Wildlife Sanctuary Test', 'Kotagiri, Nilgiris, Tamil Nadu', 'High altitude shola grasslands and tea garden corridors.']
    );
    testSanctuaryId = createRes.insertId;
    assert(testSanctuaryId > 0, '2. Draft sanctuary created for testing');

    // 3. Attempt submit WITHOUT prerequisites (no image, no activity, no slot)
    const resPrematureSubmit = await request(`/admin/sanctuaries/${testSanctuaryId}/submit`, {
      method: 'POST',
      token: approvedAdminToken,
    });
    assert(resPrematureSubmit.status === 400, '3. Submission without prerequisites rejected with 400');
    assert(
      resPrematureSubmit.data.error.includes('Submission requires'),
      `3b. Error mentions missing requirements: "${resPrematureSubmit.data.error}"`
    );

    // 4. Populate Prerequisites: Add 1 image, 1 activity, 1 slot
    await db.query(
      `INSERT INTO sanctuary_images (sanctuary_id, image_path, is_cover, sort_order)
       VALUES (?, '/uploads/sanctuaries/test-cover.jpg', TRUE, 0)`,
      [testSanctuaryId]
    );

    const [actRes] = await db.query(
      `INSERT INTO activities (sanctuary_id, activity_name, duration_minutes, price, is_active)
       VALUES (?, 'Greenwood Forest Jeep Safari', 120, 1500, TRUE)`,
      [testSanctuaryId]
    );
    testActivityId = actRes.insertId;

    const [guideRes] = await db.query(
      `INSERT INTO guides (sanctuary_id, name, phone, experience)
       VALUES (?, 'Rajesh Nilgiri', '+91 94433 11223', 6)`,
      [testSanctuaryId]
    );
    testGuideId = guideRes.insertId;

    const [vehRes] = await db.query(
      `INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity)
       VALUES (?, 'Nilgiri Safari Gypsy', 6)`,
      [testSanctuaryId]
    );
    testVehicleId = vehRes.insertId;

    const [slotRes] = await db.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (?, ?, ?, '2026-11-25', '06:30:00', 6, TRUE)`,
      [testActivityId, testGuideId, testVehicleId]
    );
    testSlotId = slotRes.insertId;

    // 5. Submit sanctuary with all prerequisites met
    const resSubmitValid = await request(`/admin/sanctuaries/${testSanctuaryId}/submit`, {
      method: 'POST',
      token: approvedAdminToken,
    });
    assert(resSubmitValid.status === 200, '5. Submit with prerequisites succeeds with 200');
    assert(resSubmitValid.data.listing_status === 'PENDING', '5b. Listing status updated to PENDING');

    // 6. Owner list sanctuaries and verify tab counts
    const resOwnerList = await request('/owner/sanctuaries?status=PENDING', { token: ownerToken });
    assert(resOwnerList.status === 200, '6. Owner lists pending sanctuaries with 200');
    assert(resOwnerList.data.counts.pending >= 1, '6b. Pending tab count reflects submission');
    const foundPending = resOwnerList.data.sanctuaries.find((s) => s.sanctuary_id === testSanctuaryId);
    assert(foundPending !== undefined, '6c. Submitted sanctuary appears in owner pending queue');

    // 7. Owner view detailed sanctuary review (Page 24 feed)
    const resDetail = await request(`/owner/sanctuaries/${testSanctuaryId}`, { token: ownerToken });
    assert(resDetail.status === 200, '7. Owner retrieves full sanctuary submission details');
    assert(resDetail.data.images.length >= 1, '7b. Image gallery returned');
    assert(resDetail.data.activities.length >= 1, '7c. Activities with pricing returned');
    assert(Array.isArray(resDetail.data.slots_summary), '7d. Slots summary returned');

    // 8. Reject sanctuary WITHOUT note (must fail with 400)
    const resRejectNoNote = await request(`/owner/sanctuaries/${testSanctuaryId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { decision: 'REJECTED', note: '' },
    });
    assert(resRejectNoNote.status === 400, '8. Rejection without note rejected with 400');
    assert(
      resRejectNoNote.data.error.includes('note is required'),
      '8b. Error indicates note is required'
    );

    // 9. Reject sanctuary WITH note
    const resRejectWithNote = await request(`/owner/sanctuaries/${testSanctuaryId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { decision: 'REJECTED', note: 'Please upload additional high-resolution habitat photos.' },
    });
    assert(resRejectWithNote.status === 200, '9. Rejection with note succeeds');
    assert(resRejectWithNote.data.listing_status === 'REJECTED', '9b. Status is REJECTED');

    // 10. Admin resubmits after revision
    const resResubmit = await request(`/admin/sanctuaries/${testSanctuaryId}/submit`, {
      method: 'POST',
      token: approvedAdminToken,
    });
    assert(resResubmit.status === 200, '10. Admin can resubmit after rejection');
    assert(resResubmit.data.listing_status === 'PENDING', '10b. Status reset to PENDING and note cleared');

    // 11. Owner Approves sanctuary
    const resApprove = await request(`/owner/sanctuaries/${testSanctuaryId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { decision: 'APPROVED', note: 'All documentation and habitat guidelines verified.' },
    });
    assert(resApprove.status === 200, '11. Owner approves sanctuary');
    assert(resApprove.data.listing_status === 'APPROVED', '11b. Status is now APPROVED');

    // 12. Verify sanctuary appears in v_public_sanctuaries view
    const [publicRows] = await db.query(
      'SELECT sanctuary_id, name FROM v_public_sanctuaries WHERE sanctuary_id = ?',
      [testSanctuaryId]
    );
    assert(publicRows.length === 1, '12. Newly approved sanctuary immediately visible in v_public_sanctuaries');

    console.log('\n===============================================================');
    console.log(' SUMMARY: All 12 Phase 6 API & Business Rules Passed Cleanly!');
    console.log('===============================================================\n');
  } finally {
    // Cleanup test records
    if (testSanctuaryId) {
      await db.query('DELETE FROM slots WHERE activity_id = ?', [testActivityId]);
      await db.query('DELETE FROM activities WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM guides WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM vehicles WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM sanctuary_images WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM sanctuaries WHERE sanctuary_id = ?', [testSanctuaryId]);
    }
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  if (server) server.close();
  process.exit(1);
});
