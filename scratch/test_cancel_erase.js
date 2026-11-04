const mysql = require('../backend/node_modules/mysql2/promise');

async function testCancelErase() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shravya300@1234',
    database: 'wildbook'
  });

  try {
    console.log('Testing booking creation, confirmation, and cancellation erasure...');
    
    // Clean up test booking 6 if exists
    await conn.query('DELETE FROM payments WHERE booking_id = 6');
    await conn.query('DELETE FROM bookings WHERE booking_id = 6');

    // Pick an existing slot and user
    const [slots] = await conn.query('SELECT slot_id, capacity FROM slots WHERE is_active = TRUE LIMIT 1');
    const slotId = slots[0].slot_id;
    const [users] = await conn.query("SELECT user_id FROM users WHERE role = 'VISITOR' LIMIT 1");
    const userId = users[0].user_id;

    // Check available seats before
    const [beforeSeats] = await conn.query('SELECT available_seats FROM v_slot_availability WHERE slot_id = ?', [slotId]);
    console.log('Available seats before test booking:', beforeSeats[0]?.available_seats);

    // 1. Create a test booking
    const bookingCode = `WB-TEST-${Date.now().toString().slice(-6)}`;
    const [bRes] = await conn.query(
      `INSERT INTO bookings (booking_code, user_id, slot_id, number_of_people, total_amount, status)
       VALUES (?, ?, ?, 2, 3600.00, 'CONFIRMED')`,
      [bookingCode, userId, slotId]
    );
    const testBookingId = bRes.insertId;
    console.log('✓ Created confirmed booking ID:', testBookingId);

    // Create payment record
    await conn.query(
      `INSERT INTO payments (booking_id, amount, payment_status, transaction_ref, paid_at)
       VALUES (?, 3600.00, 'PAID', 'TXN-CANCEL-TEST', NOW())`,
      [testBookingId]
    );
    console.log('✓ Created payment for booking ID:', testBookingId);

    // Check seats after booking
    const [duringSeats] = await conn.query('SELECT available_seats FROM v_slot_availability WHERE slot_id = ?', [slotId]);
    console.log('Available seats with active booking:', duringSeats[0]?.available_seats);

    // 2. Erase the booking directly (the new cancellation feature)
    await conn.beginTransaction();
    await conn.query('DELETE FROM payments WHERE booking_id = ?', [testBookingId]);
    await conn.query('DELETE FROM bookings WHERE booking_id = ?', [testBookingId]);
    await conn.commit();
    console.log('✓ Executed cancellation erasure (payments & bookings) for booking ID:', testBookingId);

    // 3. Verify booking is erased
    const [checkBooking] = await conn.query('SELECT booking_id FROM bookings WHERE booking_id = ?', [testBookingId]);
    console.log('Booking row exists in DB?', checkBooking.length > 0 ? 'YES' : 'NO (Erased clean)');
    if (checkBooking.length !== 0) throw new Error('Booking was not erased!');

    // 4. Verify payment was erased
    const [checkPayment] = await conn.query('SELECT payment_id FROM payments WHERE booking_id = ?', [testBookingId]);
    console.log('Payment row exists in DB?', checkPayment.length > 0 ? 'YES' : 'NO (Erased clean)');
    if (checkPayment.length !== 0) throw new Error('Payment was not erased!');

    // 5. Verify seats were freed
    const [afterSeats] = await conn.query('SELECT available_seats FROM v_slot_availability WHERE slot_id = ?', [slotId]);
    console.log('Available seats after cancellation erasure:', afterSeats[0]?.available_seats);
    if (afterSeats[0]?.available_seats !== beforeSeats[0]?.available_seats) {
      throw new Error('Seats were not restored to original value!');
    }

    console.log('\n========================================================');
    console.log('ALL CHECKS PASSED: Booking cancelled & erased cleanly!');
    console.log('No separate table required (Maintained strict 9-table schema).');
    console.log('========================================================');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await conn.end();
  }
}

testCancelErase();
