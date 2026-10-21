'use strict';
const path = require('path');
const fs = require('fs');

async function runAuthTests() {
  console.log('===============================================================');
  console.log(' WildBook Phase 2: Backend Auth Endpoints Verification');
  console.log('===============================================================\n');

  // Start server on temporary port
  process.env.PORT = '5001';
  const app = require('./server');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(5001, resolve));
  console.log('-> Test server listening on http://localhost:5001\n');

  const BASE_URL = 'http://localhost:5001/api/auth';
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
    // 1. Visitor Login (seeded account)
    let visitorToken = '';
    await test('POST /api/auth/user/login with seeded visitor credentials succeeds', async () => {
      const res = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'visitor@wildbook.com', password: 'Visitor@123' }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!data.token) throw new Error('Missing token in response');
      if (data.user.password_hash) throw new Error('password_hash leaked in response!');
      if (data.user.role !== 'VISITOR') throw new Error(`Wrong role: ${data.user.role}`);
      visitorToken = data.token;
    });

    // 2. Visitor Login rejects wrong role (e.g. trying to log in with owner email)
    await test('POST /api/auth/user/login rejects non-VISITOR role', async () => {
      const res = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@wildbook.com', password: 'Owner@123' }),
      });
      const data = await res.json();
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
      if (!data.error.includes('registered as SITE_OWNER')) throw new Error(`Unexpected message: ${data.error}`);
    });

    // 3. Admin Login (seeded approved admin)
    let adminToken = '';
    await test('POST /api/auth/admin/login with approved admin credentials succeeds', async () => {
      const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin.nagarhole@wildbook.com', password: 'Admin@123' }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!data.token) throw new Error('Missing token');
      if (data.user.account_status !== 'APPROVED') throw new Error(`Status: ${data.user.account_status}`);
      adminToken = data.token;
    });

    // 4. Admin Login rejects PENDING admin with distinct status and message
    await test('POST /api/auth/admin/login rejects pending admin with PENDING status', async () => {
      const res = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin.bandipur@wildbook.com', password: 'Admin@123' }),
      });
      const data = await res.json();
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
      if (data.status !== 'PENDING') throw new Error(`Expected status PENDING, got ${data.status}`);
      if (!data.error.includes('under review')) throw new Error(`Unexpected error message: ${data.error}`);
    });

    // 5. Owner Login (seeded owner)
    let ownerToken = '';
    await test('POST /api/auth/owner/login with owner credentials succeeds', async () => {
      const res = await fetch(`${BASE_URL}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@wildbook.com', password: 'Owner@123' }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!data.token) throw new Error('Missing token');
      if (data.user.role !== 'SITE_OWNER') throw new Error(`Role: ${data.user.role}`);
      ownerToken = data.token;
    });

    // 6. Owner Login rejects visitor credentials
    await test('POST /api/auth/owner/login rejects visitor credentials with 403', async () => {
      const res = await fetch(`${BASE_URL}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'visitor@wildbook.com', password: 'Visitor@123' }),
      });
      const data = await res.json();
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 7. GET /api/auth/me returns current user without password_hash
    await test('GET /api/auth/me returns authenticated user details securely', async () => {
      const res = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${visitorToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (data.user.email !== 'visitor@wildbook.com') throw new Error('Wrong user returned');
      if (data.user.password_hash) throw new Error('password_hash leaked in /me!');
    });

    // 8. Visitor Signup
    const testVisitorEmail = `newvisitor_${Date.now()}@wildbook.com`;
    await test('POST /api/auth/user/signup creates a new visitor with APPROVED status', async () => {
      const res = await fetch(`${BASE_URL}/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Explorer',
          email: testVisitorEmail,
          phone: '+91 99000 11222',
          password: 'Password@123',
        }),
      });
      const data = await res.json();
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!data.token) throw new Error('Missing token');
      if (data.user.account_status !== 'APPROVED') throw new Error(`Status: ${data.user.account_status}`);
    });

    // 9. Admin Signup with multipart file uploads
    const testAdminEmail = `newadmin_${Date.now()}@wildbook.com`;
    const testLicense = `KA-TEST-${Date.now()}`;
    await test('POST /api/auth/admin/signup registers admin with profile and 3 uploaded documents', async () => {
      const formData = new FormData();
      formData.append('name', 'Ramesh Wildlife Director');
      formData.append('email', testAdminEmail);
      formData.append('phone', '+91 98800 77665');
      formData.append('password', 'AdminSecret@123');
      formData.append('organisation_name', 'Bhadra Wildlife Sanctuary Trust');
      formData.append('license_number', testLicense);
      formData.append('designation', 'Sanctuary Field Officer');
      formData.append('registered_address', 'Bhadra Tiger Reserve, Chikmagalur, Karnataka');
      formData.append('website', 'https://bhadrawildlife.org');

      // Create dummy file blobs
      const dummyLicenseBlob = new Blob(['%PDF-1.4 dummy license document'], { type: 'application/pdf' });
      const dummyIdBlob = new Blob(['%PDF-1.4 dummy identity proof'], { type: 'application/pdf' });
      const dummyAuthBlob = new Blob(['%PDF-1.4 dummy authorization letter'], { type: 'application/pdf' });

      formData.append('license', dummyLicenseBlob, 'license.pdf');
      formData.append('identity', dummyIdBlob, 'id_proof.pdf');
      formData.append('authorization', dummyAuthBlob, 'auth_letter.pdf');

      const res = await fetch(`${BASE_URL}/admin/signup`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${data.error}`);
      if (data.user.role !== 'ADMIN') throw new Error(`Role: ${data.user.role}`);
      if (data.user.account_status !== 'PENDING') throw new Error(`Status: ${data.user.account_status}`);
    });

    console.log('\n===============================================================');
    console.log(` SUMMARY: ${passed}/${total} Auth Tests Passed Cleanly!`);
    console.log('===============================================================\n');

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runAuthTests();
