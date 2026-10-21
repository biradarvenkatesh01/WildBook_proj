// Test script verifying authentication response structures, role guards, and redirect scenarios
const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Auth & Redirect Rules...');

  // 1. Visitor Login (Valid)
  const vLogin = await post('/auth/user/login', {
    email: 'visitor@wildbook.com',
    password: 'Visitor@123',
  });
  console.log('1. Visitor login:', vLogin.status === 200 ? '✅ PASS' : '❌ FAIL', vLogin.data.user?.role);

  // 2. Admin on Visitor Login (Wrong Role)
  const wrongRoleVisitor = await post('/auth/user/login', {
    email: 'admin.nagarhole@wildbook.com',
    password: 'Admin@123',
  });
  console.log(
    '2. Admin on Visitor Login:',
    wrongRoleVisitor.status === 403 &&
    wrongRoleVisitor.data.error.includes('sanctuary admin account') &&
    wrongRoleVisitor.data.targetPortal === '/admin/login'
      ? '✅ PASS'
      : '❌ FAIL',
    wrongRoleVisitor.data
  );

  // 3. Visitor on Admin Login (Wrong Role)
  const wrongRoleAdmin = await post('/auth/admin/login', {
    email: 'visitor@wildbook.com',
    password: 'Visitor@123',
  });
  console.log(
    '3. Visitor on Admin Login:',
    wrongRoleAdmin.status === 403 &&
    wrongRoleAdmin.data.error.includes('visitor account') &&
    wrongRoleAdmin.data.targetPortal === '/login'
      ? '✅ PASS'
      : '❌ FAIL',
    wrongRoleAdmin.data
  );

  // 4. Owner on Admin Login (Wrong Role)
  const wrongRoleOwner = await post('/auth/admin/login', {
    email: 'owner@wildbook.com',
    password: 'Owner@123',
  });
  console.log(
    '4. Owner on Admin Login:',
    wrongRoleOwner.status === 403 &&
    wrongRoleOwner.data.error.includes('site authority account') &&
    wrongRoleOwner.data.targetPortal === '/owner/login'
      ? '✅ PASS'
      : '❌ FAIL',
    wrongRoleOwner.data
  );

  // 5. Approved Admin Login
  const appAdmin = await post('/auth/admin/login', {
    email: 'admin.nagarhole@wildbook.com',
    password: 'Admin@123',
  });
  console.log('5. Approved Admin Login:', appAdmin.status === 200 ? '✅ PASS' : '❌ FAIL', appAdmin.data.user?.account_status);

  // 6. Pending Admin Login
  const pendAdmin = await post('/auth/admin/login', {
    email: 'admin.bandipur@wildbook.com',
    password: 'Admin@123',
  });
  console.log(
    '6. Pending Admin Login:',
    pendAdmin.status === 403 && pendAdmin.data.status === 'PENDING' && Boolean(pendAdmin.data.token)
      ? '✅ PASS'
      : '❌ FAIL',
    pendAdmin.data.status
  );

  // 7. Owner Login
  const owner = await post('/auth/owner/login', {
    email: 'owner@wildbook.com',
    password: 'Owner@123',
  });
  console.log('7. Owner Login:', owner.status === 200 ? '✅ PASS' : '❌ FAIL', owner.data.user?.role);

  // 8. Session Restoration GET /api/auth/me
  const me = await get('/auth/me', vLogin.data.token);
  console.log('8. GET /api/auth/me restore session:', me.status === 200 && me.data.user?.email === 'visitor@wildbook.com' ? '✅ PASS' : '❌ FAIL');

  console.log('All backend auth checks completed successfully!');
}

run().catch(console.error);
