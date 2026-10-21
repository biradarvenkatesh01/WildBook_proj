'use strict';
const fs = require('fs');
const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({
  path: path.resolve(__dirname, '../backend/.env'),
});

async function main() {
  console.log('===============================================================');
  console.log(' WildBook Phase 1: Database Migration & Verification Runner');
  console.log('===============================================================\n');

  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'wildbook',
    multipleStatements: true,
  };

  const pool = mysql.createPool(connectionConfig);

  try {
    // 1. Run 01_schema.sql
    console.log('-> [1/5] Applying 01_schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '01_schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('   ✓ Schema created successfully (14 tables + indexes)');

    // 2. Run 02_triggers.sql
    console.log('-> [2/5] Applying 02_triggers.sql...');
    const triggersSql = fs.readFileSync(path.join(__dirname, '02_triggers.sql'), 'utf8');
    await executeDelimitedSql(pool, triggersSql);
    console.log('   ✓ Triggers created successfully');

    // 3. Run 03_procedures.sql
    console.log('-> [3/5] Applying 03_procedures.sql...');
    const proceduresSql = fs.readFileSync(path.join(__dirname, '03_procedures.sql'), 'utf8');
    await executeDelimitedSql(pool, proceduresSql);
    console.log('   ✓ Stored procedures and cleanup event created successfully');

    // 4. Run 04_views.sql
    console.log('-> [4/5] Applying 04_views.sql...');
    const viewsSql = fs.readFileSync(path.join(__dirname, '04_views.sql'), 'utf8');
    await pool.query(viewsSql);
    console.log('   ✓ Analytical & public views created successfully');

    // 5. Run 05_seed.sql
    console.log('-> [5/5] Applying 05_seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, '05_seed.sql'), 'utf8');
    await pool.query(seedSql);
    console.log('   ✓ Seed data inserted successfully\n');

    // 6. Run automated test suite
    console.log('===============================================================');
    console.log(' Running Integrity & Business Logic Test Suite (tests.sql)');
    console.log('===============================================================\n');

    let passedTests = 0;
    let totalTests = 0;

    async function assertThrows(testName, fn, expectedSubstring) {
      totalTests++;
      try {
        await fn();
        console.error(`   FAIL [Test ${totalTests}]: ${testName} (did not throw error)`);
      } catch (err) {
        if (!expectedSubstring || err.message.toLowerCase().includes(expectedSubstring.toLowerCase())) {
          console.log(`   PASS [Test ${totalTests}]: ${testName} (Caught expected: "${err.message.split('\n')[0]}")`);
          passedTests++;
        } else {
          console.error(`   FAIL [Test ${totalTests}]: ${testName} (Unexpected error: ${err.message})`);
        }
      }
    }

    async function assertTrue(testName, condition, details = '') {
      totalTests++;
      if (condition) {
        console.log(`   PASS [Test ${totalTests}]: ${testName} ${details ? '(' + details + ')' : ''}`);
        passedTests++;
      } else {
        console.error(`   FAIL [Test ${totalTests}]: ${testName} ${details ? '(' + details + ')' : ''}`);
      }
    }

    // TEST 1: Duplicate email rejection
    await assertThrows(
      'Duplicate email rejected by UNIQUE constraint',
      async () => {
        await pool.query(
          "INSERT INTO users (name, email, password_hash, role) VALUES ('Impostor', 'visitor@wildbook.com', 'dummy_hash', 'VISITOR')"
        );
      },
      'Duplicate entry'
    );

    // TEST 2: Double guide allocation at same date/time rejected
    await assertThrows(
      'Double guide allocation at same date/time rejected by UNIQUE constraint',
      async () => {
        // Slot 2 has guide 1 on 2026-11-20 at 06:00:00
        await pool.query(
          "INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (1, 1, 3, '2026-11-20', '06:00:00', 6)"
        );
      },
      'Duplicate entry'
    );

    // TEST 3: Double vehicle allocation at same date/time rejected
    await assertThrows(
      'Double vehicle allocation at same date/time rejected by UNIQUE constraint',
      async () => {
        // Slot 2 has vehicle 1 on 2026-11-20 at 06:00:00
        await pool.query(
          "INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (1, 2, 1, '2026-11-20', '06:00:00', 6)"
        );
      },
      'Duplicate entry'
    );

    // TEST 4: Slot capacity cannot exceed vehicle capacity (Trigger)
    await assertThrows(
      'Trigger rejects slot capacity exceeding vehicle capacity',
      async () => {
        // Vehicle 1 has capacity 6. Attempt capacity 10
        await pool.query(
          "INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (1, 2, 1, '2026-11-25', '07:00:00', 10)"
        );
      },
      'Slot capacity cannot exceed vehicle capacity'
    );

    // TEST 5: Vehicle & activity from different sanctuaries rejected (Trigger)
    await assertThrows(
      'Trigger rejects vehicle/activity from different sanctuaries',
      async () => {
        // Activity 1 is sanctuary 1; vehicle 4 is sanctuary 2
        await pool.query(
          "INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (1, 1, 4, '2026-11-26', '07:00:00', 6)"
        );
      },
      'Vehicle, guide, and activity must belong to the same sanctuary'
    );

    // TEST 6: Unapproved admin cannot add slots (Trigger)
    await assertThrows(
      'Trigger rejects slot creation for unapproved sanctuary admin',
      async () => {
        // Create sanctuary under pending admin (user_id 3)
        const [sRes] = await pool.query(
          "INSERT INTO sanctuaries (admin_id, name, location, description, listing_status) VALUES (3, 'Pending Park', 'KA', 'Desc', 'PENDING')"
        );
        const [aRes] = await pool.query(
          `INSERT INTO activities (sanctuary_id, activity_name, duration_minutes, price) VALUES (${sRes.insertId}, 'Trail', 60, 500)`
        );
        const [gRes] = await pool.query(
          `INSERT INTO guides (sanctuary_id, name, phone, experience) VALUES (${sRes.insertId}, 'Guide P', '9999999999', 2)`
        );
        const [vRes] = await pool.query(
          `INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity) VALUES (${sRes.insertId}, 'Jeep', 6)`
        );
        await pool.query(
          `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (${aRes.insertId}, ${gRes.insertId}, ${vRes.insertId}, '2026-11-27', '08:00:00', 6)`
        );
      },
      'Only an APPROVED admin can add slots'
    );

    // TEST 7: Review without a past CONFIRMED booking is rejected (Trigger)
    await assertThrows(
      'Trigger rejects review on future/uncompleted booking',
      async () => {
        // Booking 2 is for future slot (2026-11-20)
        await pool.query(
          "INSERT INTO reviews (booking_id, user_id, sanctuary_id, rating, comment) VALUES (2, 4, 1, 5, 'Too early!')"
        );
      },
      'Cannot review a slot that has not yet occurred'
    );

    // TEST 8: Overbooking prevention (Capacity 10, 8 booked: 3 rejected, 2 accepted)
    // Setup a slot with capacity 10 using vehicle 3 (capacity 20)
    const [act] = await pool.query(
      "INSERT INTO activities (sanctuary_id, activity_name, duration_minutes, price) VALUES (1, 'Test Safari Cap10', 120, 1000.00)"
    );
    const [slt] = await pool.query(
      `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity) VALUES (${act.insertId}, 3, 3, '2026-12-01', '09:00:00', 10)`
    );
    const testSlotId = slt.insertId;

    // 8a: Book 8 seats -> Expected: SUCCESS
    await pool.query(
      'CALL sp_create_booking(?, ?, ?, @b8_id, @b8_code, @b8_amt, @b8_status)',
      [4, testSlotId, 8]
    );
    const [[res8]] = await pool.query('SELECT @b8_id AS id, @b8_status AS status, @b8_amt AS amt');
    assertTrue(
      'Booking 8 seats on capacity 10 succeeds',
      res8.status === 'SUCCESS' && Number(res8.amt) === 8000,
      `status=${res8.status}, amt=${res8.amt}`
    );

    // 8b: Attempt to book 3 seats (8 + 3 = 11 > 10) -> Expected: NOT_ENOUGH_SEATS
    await pool.query(
      'CALL sp_create_booking(?, ?, ?, @b3_id, @b3_code, @b3_amt, @b3_status)',
      [4, testSlotId, 3]
    );
    const [[res3]] = await pool.query('SELECT @b3_id AS id, @b3_status AS status');
    assertTrue(
      'Attempting 3 seats over remaining capacity is rejected',
      res3.status === 'NOT_ENOUGH_SEATS' && res3.id === null,
      `status=${res3.status}`
    );

    // 8c: Attempt to book 2 seats (8 + 2 = 10 <= 10) -> Expected: SUCCESS
    await pool.query(
      'CALL sp_create_booking(?, ?, ?, @b2_id, @b2_code, @b2_amt, @b2_status)',
      [4, testSlotId, 2]
    );
    const [[res2]] = await pool.query('SELECT @b2_id AS id, @b2_status AS status, @b2_amt AS amt');
    assertTrue(
      'Booking remaining 2 seats succeeds at exact capacity',
      res2.status === 'SUCCESS' && Number(res2.amt) === 2000,
      `status=${res2.status}, amt=${res2.amt}`
    );

    // TEST 9: Payment confirmation lifecycle via sp_confirm_payment
    await pool.query('CALL sp_confirm_payment(?, ?, @pay_status)', [
      res8.id,
      'tx_test_confirm_888',
    ]);
    const [[payRes]] = await pool.query('SELECT @pay_status AS status');
    const [[bookingCheck]] = await pool.query(
      'SELECT b.status AS b_status, p.payment_status AS p_status, p.transaction_ref FROM bookings b JOIN payments p ON b.booking_id = p.booking_id WHERE b.booking_id = ?',
      [res8.id]
    );
    assertTrue(
      'Payment confirmation updates booking to CONFIRMED and payment to PAID',
      payRes.status === 'SUCCESS' &&
        bookingCheck.b_status === 'CONFIRMED' &&
        bookingCheck.p_status === 'PAID' &&
        bookingCheck.transaction_ref === 'tx_test_confirm_888',
      `pay_status=${payRes.status}, b_status=${bookingCheck.b_status}`
    );

    // TEST 10: Cancellation fee math test (40% fee, 60% refund)
    // res8 total was 8000.00. Fee = 3200.00 (40%), Refund = 4800.00 (60%)
    await pool.query('CALL sp_cancel_booking(?, ?, @c_status, @c_fee, @c_ref)', [
      res8.id,
      4, // user_id
    ]);
    const [[cancelRes]] = await pool.query(
      'SELECT @c_status AS status, @c_fee AS fee, @c_ref AS refund'
    );
    const [[cancelRow]] = await pool.query(
      'SELECT c.*, b.status AS b_status, p.payment_status AS p_status FROM cancellations c JOIN bookings b ON c.booking_id = b.booking_id JOIN payments p ON b.booking_id = p.booking_id WHERE c.booking_id = ?',
      [res8.id]
    );
    assertTrue(
      'Cancellation calculates exactly 40% fee and 60% refund',
      cancelRes.status === 'SUCCESS' &&
        Number(cancelRes.fee) === 3200.0 &&
        Number(cancelRes.refund) === 4800.0 &&
        cancelRow.b_status === 'CANCELLED' &&
        cancelRow.p_status === 'PARTIALLY_REFUNDED' &&
        Number(cancelRow.fee_percent) === 40.0,
      `fee=${cancelRes.fee}, refund=${cancelRes.refund}, b_status=${cancelRow?.b_status}, p_status=${cancelRow?.p_status}`
    );

    // TEST 11: Views query test
    const [pubSanctuaries] = await pool.query('SELECT * FROM v_public_sanctuaries');
    const [slotAvail] = await pool.query('SELECT * FROM v_slot_availability');
    const [confBookings] = await pool.query('SELECT * FROM v_confirmed_bookings');
    assertTrue(
      'All analytical views (v_public_sanctuaries, v_slot_availability, v_confirmed_bookings) return data',
      pubSanctuaries.length >= 2 && slotAvail.length > 0 && confBookings.length > 0,
      `sanctuaries=${pubSanctuaries.length}, slots=${slotAvail.length}, confirmed=${confBookings.length}`
    );

    console.log('\n===============================================================');
    console.log(` SUMMARY: ${passedTests}/${totalTests} Tests Passed cleanly!`);
    console.log('===============================================================\n');

    await pool.end();
    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Migration failed:', err);
    await pool.end();
    process.exit(1);
  }
}

/**
 * Splits SQL with DELIMITER $$ into individual executable statements.
 */
async function executeDelimitedSql(pool, sqlContent) {
  // Normalize newlines
  const lines = sqlContent.split(/\r?\n/);
  let delimiter = ';';
  let currentStatement = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith('DELIMITER ')) {
      delimiter = trimmed.substring(10).trim();
      continue;
    }

    if (delimiter !== ';' && trimmed.endsWith(delimiter)) {
      currentStatement += '\n' + line.slice(0, line.lastIndexOf(delimiter));
      if (currentStatement.trim().length > 0) {
        await pool.query(currentStatement.trim());
      }
      currentStatement = '';
    } else if (delimiter === ';' && trimmed.endsWith(';')) {
      currentStatement += '\n' + line;
      if (currentStatement.trim().length > 0) {
        await pool.query(currentStatement.trim());
      }
      currentStatement = '';
    } else {
      currentStatement += '\n' + line;
    }
  }

  if (currentStatement.trim().length > 0) {
    await pool.query(currentStatement.trim());
  }
}

main();
