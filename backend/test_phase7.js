'use strict';
/**
 * Automated Test Suite for Phase 7: Visitor Browsing & Discovery
 */
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/sanctuaries', require('./routes/sanctuaries'));
app.use('/api/activities', require('./routes/activities'));

let server;
const PORT = 5007;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url);
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
  console.log(' WildBook Phase 7: Visitor Browsing & Slot Discovery Verification');
  console.log('===============================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`-> Test server listening on http://localhost:${PORT}\n`);
      resolve();
    });
  });

  try {
    // 1. GET /api/sanctuaries (Public Directory)
    const resList = await request('/sanctuaries');
    assert(resList.status === 200, '1. Public sanctuary directory returns 200');
    assert(Array.isArray(resList.data.sanctuaries), '1b. Sanctuaries array returned');
    assert(resList.data.sanctuaries.length > 0, '1c. At least one approved sanctuary returned');
    assert(resList.data.pagination.total >= 1, '1d. Pagination metadata returned');

    // 2. Filter by location
    const resLoc = await request('/sanctuaries?location=Karnataka');
    assert(resLoc.status === 200, '2. Filter by location returns 200');
    assert(
      resLoc.data.sanctuaries.every((s) => s.location.includes('Karnataka')),
      '2b. All returned items match Karnataka location filter'
    );

    // 3. Search query
    const resSearch = await request('/sanctuaries?search=Nagarhole');
    assert(resSearch.status === 200, '3. Search by name returns 200');
    assert(resSearch.data.sanctuaries.length >= 1, '3b. Nagarhole found via search');

    // 4. GET /api/sanctuaries/featured
    const resFeatured = await request('/sanctuaries/featured');
    assert(resFeatured.status === 200, '4. Featured sanctuaries returns 200');
    assert(Array.isArray(resFeatured.data.sanctuaries), '4b. Featured sanctuaries array returned');

    // 5. GET /api/sanctuaries/:id (Sanctuary 1 details)
    const resDetail = await request('/sanctuaries/1');
    assert(resDetail.status === 200, '5. Approved sanctuary details returns 200');
    assert(resDetail.data.sanctuary.name.includes('Nagarhole'), '5b. Sanctuary name matches Nagarhole');
    assert(Array.isArray(resDetail.data.images), '5c. Image gallery array returned');
    assert(Array.isArray(resDetail.data.activities), '5d. Activities array returned');
    assert(resDetail.data.activities.length > 0, '5e. Activities list is populated');
    assert(Array.isArray(resDetail.data.reviews), '5f. Reviews array returned');

    // 6. Security: 404 on unapproved sanctuary or non-existent
    const res404 = await request('/sanctuaries/99999');
    assert(res404.status === 404, '6. Non-existent sanctuary returns 404');

    // Check if an unapproved/draft sanctuary returns 404
    const [drafts] = await db.query(
      "SELECT sanctuary_id FROM sanctuaries WHERE listing_status IN ('DRAFT', 'PENDING', 'REJECTED') LIMIT 1"
    );
    if (drafts.length > 0) {
      const resDraft404 = await request(`/sanctuaries/${drafts[0].sanctuary_id}`);
      assert(resDraft404.status === 404, '6b. Unapproved sanctuary strictly returns 404 to visitor');
    }

    // 7. GET /api/activities/:id/slots
    const resSlots = await request('/activities/1/slots');
    assert(resSlots.status === 200, '7. Activity slots endpoint returns 200');
    assert(resSlots.data.activity.activity_name !== undefined, '7b. Activity info returned');
    assert(Array.isArray(resSlots.data.slots), '7c. Slots array returned');
    assert(Array.isArray(resSlots.data.available_dates), '7d. Available dates array returned for calendar');

    // 8. Past slot exclusion check
    // In seed data: Slot 1 was slot_date = 2026-03-10, slot_time = 06:00:00 (past).
    // It must NOT appear in future slots!
    const slot1 = resSlots.data.slots.find((s) => s.slot_id === 1);
    assert(slot1 === undefined, '8. Past slot #1 is strictly hidden from visitor booking feed');

    // 9. Specific date query
    const resDateFilter = await request('/activities/1/slots?date=2026-11-20');
    assert(resDateFilter.status === 200, '9. Date filter returns 200');
    assert(
      resDateFilter.data.slots.every((s) => s.slot_date === '2026-11-20'),
      '9b. All returned slots match queried date'
    );

    // 10. Non-existent activity returns 404
    const resAct404 = await request('/activities/99999/slots');
    assert(resAct404.status === 404, '10. Non-existent activity returns 404');

    console.log('\n===============================================================');
    console.log(' SUMMARY: All 10 Phase 7 Public API Tests Passed Cleanly!');
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
