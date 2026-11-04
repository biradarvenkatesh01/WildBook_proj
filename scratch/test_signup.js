const mysql = require('../backend/node_modules/mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shravya300@1234',
    database: 'wildbook'
  });

  try {
    await conn.beginTransaction();
    const [u] = await conn.query(
      "INSERT INTO users (name, email, phone, password_hash, role, account_status) VALUES ('Test', 'test_debug_err@test.com', '9876543210', 'hash', 'ADMIN', 'PENDING')"
    );
    const uid = u.insertId;
    console.log('User created:', uid);

    await conn.query(
      "INSERT INTO admin_profiles (user_id, organisation_name, license_number, designation, registered_address) VALUES (?, 'Test Org', 'LIC-DEBUG-999', 'Officer', 'Address')",
      [uid]
    );
    console.log('Profile created');

    const [s] = await conn.query(
      "INSERT INTO sanctuaries (admin_id, name, location, description, cover_image, average_rating, total_reviews, contact_email, contact_phone, opening_time, closing_time, operating_days, best_time_to_visit, listing_status) VALUES (?, 'Test Sanc', 'Loc', 'Desc', 'img', 5.0, 1, 'email@test.com', '9876543210', '06:00:00', '18:00:00', 'Daily', 'All Year', 'PENDING')",
      [uid]
    );
    const sid = s.insertId;
    console.log('Sanctuary created:', sid);

    const [a] = await conn.query(
      "INSERT INTO activities (sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price, is_active) VALUES (?, 'Safari', 'Desc', 180, 'ID', 1800, TRUE)",
      [sid]
    );
    console.log('Activity created:', a.insertId);

    const [g] = await conn.query(
      "INSERT INTO guides (sanctuary_id, name, phone, experience) VALUES (?, 'Guide', '9876543210', 5)",
      [sid]
    );
    console.log('Guide created:', g.insertId);

    const [v] = await conn.query(
      "INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity) VALUES (?, 'Gypsy', 6)",
      [sid]
    );
    console.log('Vehicle created:', v.insertId);

    await conn.rollback();
    console.log('ROLLBACK completed successfully without errors!');
  } catch (err) {
    console.error('ERROR CAUGHT:', err.message);
    await conn.rollback();
  } finally {
    await conn.end();
  }
}

test();

