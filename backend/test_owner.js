'use strict';
const path = require('path');
const fs = require('fs');

async function runOwnerTests() {
  console.log('===============================================================');
  console.log(' WildBook Phase 3: Owner Admin Approval API Verification');
  console.log('===============================================================\n');

  // Start test server on port 5002
  process.env.PORT = '5002';
  const app = require('./server');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(5002, resolve));
  console.log('-> Test server listening on http://localhost:5002\n');

  const BASE_URL = 'http://localhost:5002/api';
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`   ✓ PASS [${total}]: ${name}`);
      passed++;
    } catch (err) {
      console.error(`   ✗ FAIL [${total}]: ${name} ->`, err.message);
    }
  }

  try {
    // 1. Get tokens
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@wildbook.com', password: 'Owner@123' }),
    });
    const ownerData = await ownerLoginRes.json();
    const ownerToken = ownerData.token;

    const visitorLoginRes = await fetch(`${BASE_URL}/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'visitor@wildbook.com', password: 'Visitor@123' }),
    });
    const visitorData = await visitorLoginRes.json();
    const visitorToken = visitorData.token;

    // 2. Test unauthenticated request
    await test('GET /api/owner/admins rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins`);
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // 3. Test visitor forbidden request
    await test('GET /api/owner/admins rejects visitor role with 403', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins`, {
        headers: { Authorization: `Bearer ${visitorToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 4. Test owner access to list with tab counts
    let adminList = [];
    await test('GET /api/owner/admins returns admins list and dynamic tab counts', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!Array.isArray(data.admins)) throw new Error('admins must be an array');
      if (!data.counts || typeof data.counts.all !== 'number') throw new Error('Missing tab counts');
      if (data.admins.length === 0) throw new Error('Expected at least 1 admin');
      adminList = data.admins;
    });

    // 5. Test search filter
    await test('GET /api/owner/admins?search=Nagarhole filters matching admins', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins?search=Nagarhole`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (data.admins.length === 0) throw new Error('Search failed to find Nagarhole');
      if (!data.admins.some((a) => a.organisation_name?.includes('Nagarhole') || a.email?.includes('nagarhole'))) {
        throw new Error('Result does not match search term');
      }
    });

    // 6. Test GET /api/owner/admins/:id details
    const targetAdmin = adminList[0];
    let docIdToStream = null;
    await test('GET /api/owner/admins/:id returns full profile and documents', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins/${targetAdmin.user_id}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!data.admin.organisation_name) throw new Error('Missing organisation_name');
      if (!Array.isArray(data.admin.documents)) throw new Error('Missing documents array');
      if (data.admin.documents.length > 0) {
        docIdToStream = data.admin.documents[0].document_id;
      }
    });

    // 7. Test document streaming
    if (docIdToStream) {
      await test('GET /api/owner/admins/:id/documents/:docId streams document to owner', async () => {
        const res = await fetch(`${BASE_URL}/owner/admins/${targetAdmin.user_id}/documents/${docIdToStream}`, {
          headers: { Authorization: `Bearer ${ownerToken}` },
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType) throw new Error('Missing content-type');
      });
    }

    // 8. Test PATCH rejection requiring note
    await test('PATCH /api/owner/admins/:id with REJECTED requires a note', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins/${targetAdmin.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ decision: 'REJECTED', note: '' }),
      });
      const data = await res.json();
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
      if (!data.error.includes('note is required')) throw new Error(`Unexpected error message: ${data.error}`);
    });

    // 9. Test PATCH approval decision
    await test('PATCH /api/owner/admins/:id updates account_status and records reviewer', async () => {
      const res = await fetch(`${BASE_URL}/owner/admins/${targetAdmin.user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ decision: 'APPROVED', note: 'All documents verified and confirmed official.' }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (data.account_status !== 'APPROVED') throw new Error(`Status: ${data.account_status}`);
      if (data.reviewed_by !== 1) throw new Error(`reviewed_by should be 1 (Site Owner), got ${data.reviewed_by}`);
    });

    console.log('\n===============================================================');
    console.log(` SUMMARY: ${passed}/${total} Owner Tests Passed Cleanly!`);
    console.log('===============================================================\n');

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Owner test error:', err);
    server.close();
    process.exit(1);
  }
}

runOwnerTests();
