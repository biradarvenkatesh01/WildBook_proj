'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');

// Start Express app with all routes
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/sanctuaries', require('./routes/sanctuaries'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/activities', require('./routes/activities'));

const db = require('./config/db');

async function runVerification() {
  const PORT = 5019;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`\n===============================================================`);
  console.log(` WildBook End-to-End Workflow Verification Suite`);
  console.log(` Listening on http://localhost:${PORT}`);
  console.log(`===============================================================\n`);

  const BASE_URL = `http://localhost:${PORT}/api`;

  async function req(url, options = {}) {
    const fetch = globalThis.fetch;
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  }

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`   ✓ PASS [${total}]: ${name}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL [${total}]: ${name} ${details ? '– ' + details : ''}`);
    }
  }

  let testSanctuaryId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. AUTHENTICATION OF ROLES
    // --------------------------------------------------------------------------
    console.log('-> [Phase 1/5] Testing Multi-Role Authentication...');

    // 1a. Admin login
    const adminLoginRes = await req('/auth/admin/login', {
      method: 'POST',
      body: { email: 'admin.nagarhole@wildbook.com', password: 'Admin@123' },
    });
    assert('Sanctuary Admin can log in successfully', adminLoginRes.status === 200 && !!adminLoginRes.data.token, JSON.stringify(adminLoginRes.data));
    const adminToken = adminLoginRes.data.token;

    // 1b. Site Owner login
    const ownerLoginRes = await req('/auth/owner/login', {
      method: 'POST',
      body: { email: 'owner@wildbook.com', password: 'Owner@123' },
    });
    assert('Site Owner can log in successfully', ownerLoginRes.status === 200 && !!ownerLoginRes.data.token, JSON.stringify(ownerLoginRes.data));
    const ownerToken = ownerLoginRes.data.token;

    // 1c. Visitor login
    const visitorLoginRes = await req('/auth/user/login', {
      method: 'POST',
      body: { email: 'visitor@wildbook.com', password: 'Visitor@123' },
    });
    assert('Visitor can log in successfully', visitorLoginRes.status === 200 && !!visitorLoginRes.data.token, JSON.stringify(visitorLoginRes.data));
    const visitorToken = visitorLoginRes.data.token;

    // 1d. Cross-role barrier: Visitor blocked from admin endpoint
    const visitorBlockedRes = await req('/admin/stats', { token: visitorToken });
    assert('Visitor is blocked from Admin endpoints (403)', visitorBlockedRes.status === 403);

    // 1e. Cross-role barrier: Admin blocked from owner endpoint
    const adminBlockedRes = await req('/owner/stats', { token: adminToken });
    assert('Sanctuary Admin is blocked from Site Owner endpoints (403)', adminBlockedRes.status === 403);

    // --------------------------------------------------------------------------
    // 2. ADMIN CREATES A NEW SANCTUARY IN DRAFT
    // --------------------------------------------------------------------------
    console.log('\n-> [Phase 2/5] Admin Creates New Sanctuary (Draft -> Prerequisites -> Submit)...');

    const newSanctuaryPayload = {
      name: 'Kanha Tiger Reserve',
      location: 'Mandla & Balaghat Districts, Madhya Pradesh',
      description: 'The inspiration for Rudyard Kipling’s Jungle Book, featuring vast sal meadows, barasingha deer, and Bengal tigers.',
      contact_email: 'kanha.safari@wildbook.com',
      contact_phone: '9425112233',
      website: 'https://kanhatigerreserve.org',
      opening_time: '06:00:00',
      closing_time: '18:00:00',
      operating_days: 'Monday to Sunday',
      best_time_to_visit: 'October to May',
      latitude: 22.3345,
      longitude: 80.6115,
    };

    const createRes = await req('/admin/sanctuaries', {
      method: 'POST',
      token: adminToken,
      body: newSanctuaryPayload,
    });
    assert('Admin creates draft sanctuary (201 Created)', createRes.status === 201 && !!createRes.data.sanctuary_id, JSON.stringify(createRes.data));
    testSanctuaryId = createRes.data?.sanctuary_id;

    // Verify it is in DRAFT
    const [draftCheck] = await db.query('SELECT listing_status FROM sanctuaries WHERE sanctuary_id = ?', [testSanctuaryId]);
    assert('New sanctuary starts with listing_status = "DRAFT"', draftCheck[0]?.listing_status === 'DRAFT');

    // Attempt premature submit without prerequisites
    const prematureSubmitRes = await req(`/admin/sanctuaries/${testSanctuaryId}/submit`, {
      method: 'POST',
      token: adminToken,
    });
    assert(
      'Premature submit without prerequisites is rejected (400 Bad Request)',
      prematureSubmitRes.status === 400 && prematureSubmitRes.data.error.includes('Submission requires')
    );

    // Add prerequisite 1: Cover Image
    await db.query(
      `UPDATE sanctuaries SET cover_image = '/uploads/sanctuaries/kanha-cover.jpg' WHERE sanctuary_id = ?`,
      [testSanctuaryId]
    );

    // Add prerequisite 2: Activity
    const actRes = await req('/admin/activities', {
      method: 'POST',
      token: adminToken,
      body: {
        sanctuary_id: testSanctuaryId,
        activity_name: 'Mukki Range Morning 4x4 Jeep Safari',
        description: 'Sunrise tiger and barasingha tracking through central sal forest.',
        duration_minutes: 210,
        what_to_carry: 'Govt Photo ID, warm jacket, telephoto camera',
        price: 2400.0,
      },
    });
    assert('Admin adds activity for sanctuary (201 Created)', actRes.status === 201 && !!actRes.data.activity_id);
    const testActivityId = actRes.data.activity_id;

    // Add Guide
    const guideRes = await req('/admin/guides', {
      method: 'POST',
      token: adminToken,
      body: {
        sanctuary_id: testSanctuaryId,
        name: 'Sunderlal Baiga',
        phone: '9425199887',
        experience: 12,
      },
    });
    assert('Admin adds certified guide (201 Created)', guideRes.status === 201 && !!guideRes.data.guide_id, JSON.stringify(guideRes.data));
    const testGuideId = guideRes.data.guide_id;

    // Add Vehicle
    const vehRes = await req('/admin/vehicles', {
      method: 'POST',
      token: adminToken,
      body: {
        sanctuary_id: testSanctuaryId,
        vehicle_type: 'Kanha 4x4 Open Safari Gypsy (MP-28-Z-1010)',
        capacity: 6,
      },
    });
    assert('Admin registers vehicle (201 Created)', vehRes.status === 201 && !!vehRes.data.vehicle_id, JSON.stringify(vehRes.data));
    const testVehicleId = vehRes.data.vehicle_id;

    // Add prerequisite 3: Slot
    const slotRes = await req('/admin/slots', {
      method: 'POST',
      token: adminToken,
      body: {
        activity_id: testActivityId,
        guide_id: testGuideId,
        vehicle_id: testVehicleId,
        slot_date: '2026-11-30',
        slot_time: '06:00:00',
        capacity: 6,
      },
    });
    assert('Admin schedules slot (201 Created)', slotRes.status === 201 && !!slotRes.data.slot_id, JSON.stringify(slotRes.data));

    // Now submit with all prerequisites satisfied
    const submitRes = await req(`/admin/sanctuaries/${testSanctuaryId}/submit`, {
      method: 'POST',
      token: adminToken,
    });
    assert(
      'Admin successfully submits sanctuary for review (status: PENDING)',
      submitRes.status === 200 && submitRes.data.listing_status === 'PENDING',
      JSON.stringify(submitRes.data)
    );

    // Verify visitor CANNOT see it yet (since it is only PENDING, not APPROVED)
    const pubCheckBefore = await req('/sanctuaries');
    const isVisibleBeforeApproval = (pubCheckBefore.data.sanctuaries || []).some((s) => s.sanctuary_id === testSanctuaryId);
    assert('Pending sanctuary is NOT yet visible in public visitor discovery', !isVisibleBeforeApproval);

    // --------------------------------------------------------------------------
    // 3. SITE OWNER REVIEWS AND APPROVES THE SANCTUARY
    // --------------------------------------------------------------------------
    console.log('\n-> [Phase 3/5] Site Owner Reviews and Approves Submission...');

    // 3a. Owner fetches pending list
    const pendingListRes = await req('/owner/sanctuaries?tab=pending', { token: ownerToken });
    const inPendingQueue = pendingListRes.data.sanctuaries.some((s) => s.sanctuary_id === testSanctuaryId);
    assert('Submitted sanctuary appears in Site Owner pending queue', inPendingQueue);

    // 3b. Owner inspects submission detail
    const detailRes = await req(`/owner/sanctuaries/${testSanctuaryId}`, { token: ownerToken });
    assert(
      'Site Owner retrieves full submission packet with images and activities',
      detailRes.status === 200 &&
        detailRes.data.images.length >= 1 &&
        detailRes.data.activities.length >= 1 &&
        detailRes.data.slots_summary.length >= 1
    );

    // 3c. Owner approves the sanctuary
    const approveRes = await req(`/owner/sanctuaries/${testSanctuaryId}`, {
      method: 'PATCH',
      token: ownerToken,
      body: {
        decision: 'APPROVED',
        note: 'Environmental compliance and guide certifications fully verified.',
      },
    });
    assert(
      'Site Owner approves sanctuary submission (status updated to APPROVED)',
      approveRes.status === 200 && approveRes.data.listing_status === 'APPROVED'
    );

    // --------------------------------------------------------------------------
    // 4. VISITOR DISCOVERY & DETAILS
    // --------------------------------------------------------------------------
    console.log('\n-> [Phase 4/5] Visitor Discovery & Availability...');

    // 4a. Public sanctuary list now includes the newly approved sanctuary
    const pubCheckAfter = await req('/sanctuaries');
    const foundInPublic = (pubCheckAfter.data.sanctuaries || []).find((s) => s.sanctuary_id === testSanctuaryId);
    assert('Newly approved sanctuary is NOW immediately visible in public discovery', !!foundInPublic);
    assert('Sanctuary name matches "Kanha Tiger Reserve"', foundInPublic?.name === 'Kanha Tiger Reserve');

    // 4b. Visitor fetches sanctuary detail
    const publicDetailRes = await req(`/sanctuaries/${testSanctuaryId}`);
    assert(
      'Visitor can load detailed view with activities and operating hours',
      publicDetailRes.status === 200 &&
        publicDetailRes.data.activities.length >= 1 &&
        publicDetailRes.data.activities[0].activity_name === 'Mukki Range Morning 4x4 Jeep Safari'
    );

    // 4c. Visitor can view slot availability for booking
    const slotAvailRes = await req(`/activities/${testActivityId}/slots`);
    assert(
      'Visitor can view active scheduled slots for booking with available seats',
      slotAvailRes.status === 200 && slotAvailRes.data?.activity?.activity_id === testActivityId && slotAvailRes.data?.slots?.length >= 1
    );

    // --------------------------------------------------------------------------
    // 5. ADMIN VERIFICATION & USER MANAGEMENT
    // --------------------------------------------------------------------------
    console.log('\n-> [Phase 5/5] Admin Dashboard Sync & Admin Application Review...');

    // 5a. Admin sees their sanctuary marked APPROVED
    const adminSanctuariesRes = await req('/admin/sanctuaries', { token: adminToken });
    const adminSancRecord = adminSanctuariesRes.data.sanctuaries.find((s) => s.sanctuary_id === testSanctuaryId);
    assert(
      'Admin dashboard reflects APPROVED status for the sanctuary',
      adminSancRecord?.listing_status === 'APPROVED'
    );

    // 5b. Owner checks pending admin applications
    const pendingAdminsRes = await req('/owner/admins?status=PENDING', { token: ownerToken });
    const hasPendingAdmin = pendingAdminsRes.data.admins.some((a) => a.account_status === 'PENDING');
    assert('Site Owner can inspect pending admin onboarding requests', hasPendingAdmin);

    // 5c. Owner approves pending admin (Bandipur admin, user_id=3)
    const approveAdminRes = await req('/owner/admins/3', {
      method: 'PATCH',
      token: ownerToken,
      body: {
        decision: 'APPROVED',
        note: 'Verified trust credentials and forest department license.',
      },
    });
    assert(
      'Site Owner successfully approves pending administrator account',
      approveAdminRes.status === 200 && approveAdminRes.data.account_status === 'APPROVED'
    );

    // 5d. The newly approved admin can now authenticate and access admin endpoints
    const newlyApprovedAdminLogin = await req('/auth/admin/login', {
      method: 'POST',
      body: { email: 'admin.bandipur@wildbook.com', password: 'Admin@123' },
    });
    const newAdminToken = newlyApprovedAdminLogin.data.token;
    const newAdminStatsRes = await req('/admin/stats', { token: newAdminToken });
    assert(
      'Newly approved admin can immediately access admin dashboard and statistics (200 OK)',
      newAdminStatsRes.status === 200
    );

    console.log('\n===============================================================');
    console.log(` WORKFLOW VERIFICATION SUMMARY: ${passed}/${total} Tests Passed Cleanly!`);
    console.log(`===============================================================\n`);
  } catch (err) {
    console.error('Workflow error:', err);
  } finally {
    // Clean up test sanctuary so database remains clean
    if (testSanctuaryId) {
      console.log('Cleaning up temporary test sanctuary...');
      const [slotIds] = await db.query(
        'SELECT slot_id FROM slots WHERE activity_id IN (SELECT activity_id FROM activities WHERE sanctuary_id = ?)',
        [testSanctuaryId]
      );
      for (const s of slotIds) {
        await db.query('DELETE FROM slots WHERE slot_id = ?', [s.slot_id]);
      }
      await db.query('DELETE FROM activities WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM guides WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM vehicles WHERE sanctuary_id = ?', [testSanctuaryId]);
      await db.query('DELETE FROM sanctuaries WHERE sanctuary_id = ?', [testSanctuaryId]);
      console.log('   ✓ Temporary test records cleaned up');
    }

    // Reset admin 3 back to PENDING so user can still demo approving admin 3
    await db.query("UPDATE users SET account_status = 'PENDING', reviewed_at = NULL WHERE user_id = 3");

    server.close();
    process.exit(passed === total ? 0 : 1);
  }
}

runVerification();
