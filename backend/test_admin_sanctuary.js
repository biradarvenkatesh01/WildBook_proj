'use strict';
const path = require('path');
const fs = require('fs');

async function runAdminSanctuaryTests() {
  console.log('===============================================================');
  console.log(' WildBook Phase 4: Admin Sanctuaries API Verification');
  console.log('===============================================================\n');

  // Start test server on port 5003
  process.env.PORT = '5003';
  const app = require('./server');
  const http = require('http');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(5003, resolve));
  console.log('-> Test server listening on http://localhost:5003\n');

  const BASE_URL = 'http://localhost:5003/api';
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
    // Approved admin: admin.nagarhole@wildbook.com / Admin@123
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin.nagarhole@wildbook.com', password: 'Admin@123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // Visitor token
    const visitorLoginRes = await fetch(`${BASE_URL}/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'visitor@wildbook.com', password: 'Visitor@123' }),
    });
    const visitorData = await visitorLoginRes.json();
    const visitorToken = visitorData.token;

    // 2. Reject visitor
    await test('GET /api/admin/sanctuaries rejects visitor with 403', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries`, {
        headers: { Authorization: `Bearer ${visitorToken}` },
      });
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    });

    // 3. Approved admin lists own sanctuaries
    let existingSanctuaries = [];
    await test('GET /api/admin/sanctuaries returns list of owned sanctuaries', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!Array.isArray(data.sanctuaries)) throw new Error('Expected array');
      existingSanctuaries = data.sanctuaries;
    });

    // 4. Create new sanctuary draft
    let newSanctuaryId = null;
    await test('POST /api/admin/sanctuaries creates a new sanctuary in DRAFT status', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Kudremukh National Park Reserve',
          location: 'Chikkamagaluru, Karnataka',
          description: 'Lush tropical shola grasslands and evergreen forest peak sanctuary.',
          contact_email: 'kudremukh@wildbook.com',
          contact_phone: '+91 8263 222111',
          website: 'https://kudremukhnationalpark.in',
          opening_time: '06:30:00',
          closing_time: '17:30:00',
          operating_days: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
          best_time_to_visit: 'October to March',
        }),
      });
      const data = await res.json();
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!data.sanctuary_id) throw new Error('Missing sanctuary_id');
      newSanctuaryId = data.sanctuary_id;
    });

    // 5. GET sanctuary by id
    await test('GET /api/admin/sanctuaries/:id retrieves sanctuary details and images', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries/${newSanctuaryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
      if (data.sanctuary.name !== 'Kudremukh National Park Reserve') throw new Error('Name mismatch');
      if (data.sanctuary.listing_status !== 'DRAFT') throw new Error('Status not DRAFT');
    });

    // 6. PUT update sanctuary draft
    await test('PUT /api/admin/sanctuaries/:id updates draft details', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries/${newSanctuaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Kudremukh National Park (Updated)',
          location: 'Chikkamagaluru & Udupi, Karnataka',
          description: 'Updated bio-diverse Western Ghats mountain preserve.',
          contact_email: 'kudremukh.updated@wildbook.com',
          contact_phone: '+91 8263 222111',
          website: 'https://kudremukhnationalpark.in',
          opening_time: '06:00:00',
          closing_time: '18:00:00',
          operating_days: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
          best_time_to_visit: 'November to February',
        }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
    });

    // 7. POST upload images using FormData
    let uploadedImageId = null;
    await test('POST /api/admin/sanctuaries/:id/images uploads image with multer', async () => {
      const formData = new FormData();
      const dummyJpgBlob = new Blob(['fake jpeg binary data content'], { type: 'image/jpeg' });
      formData.append('images', dummyJpgBlob, 'kudremukh_view.jpg');

      const res = await fetch(`${BASE_URL}/admin/sanctuaries/${newSanctuaryId}/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.status !== 201) throw new Error(`Status ${res.status}: ${data.error}`);
      if (!Array.isArray(data.images) || data.images.length === 0) throw new Error('No images returned');
      if (!data.images[0].is_cover) throw new Error('First uploaded image should be marked as cover');
      uploadedImageId = data.images[0].image_id;
    });

    // 8. PATCH update image (set cover / sort order)
    await test('PATCH /api/admin/sanctuaries/:id/images/:imageId updates cover & order', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries/${newSanctuaryId}/images/${uploadedImageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_cover: true, sort_order: 1 }),
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
    });

    // 9. DELETE image (DB row and file)
    await test('DELETE /api/admin/sanctuaries/:id/images/:imageId removes image', async () => {
      const res = await fetch(`${BASE_URL}/admin/sanctuaries/${newSanctuaryId}/images/${uploadedImageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${data.error}`);
    });

    console.log('\n===============================================================');
    console.log(` SUMMARY: ${passed}/${total} Admin Sanctuary Tests Passed Cleanly!`);
    console.log('===============================================================\n');

    server.close();
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    process.exit(1);
  }
}

runAdminSanctuaryTests();
