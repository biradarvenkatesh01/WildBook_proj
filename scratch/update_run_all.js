const fs = require('fs');
const path = require('path');

const filePath = path.resolve('database/run_all.js');
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace('Schema created successfully (14 tables + indexes)', 'Schema created successfully (9 tables + indexes)');

// Remove Test 7 (reviews)
const startT7 = c.indexOf('// TEST 7: Review without a past CONFIRMED booking');
const endT7 = c.indexOf('// TEST 8: Overbooking prevention');
if (startT7 !== -1 && endT7 !== -1) {
  c = c.slice(0, startT7) + c.slice(endT7);
}

// Update Test 10 (cancellation check from bookings table instead of cancellations table)
c = c.replace(
  'SELECT c.*, b.status AS b_status, p.payment_status AS p_status FROM cancellations c JOIN bookings b ON c.booking_id = b.booking_id JOIN payments p ON b.booking_id = p.booking_id WHERE c.booking_id = ?',
  'SELECT b.*, b.status AS b_status, p.payment_status AS p_status FROM bookings b JOIN payments p ON b.booking_id = p.booking_id WHERE b.booking_id = ?'
);

c = c.replace(
  'Number(cancelRow.fee_percent) === 40.0,',
  'Number(cancelRow.cancellation_fee) === 3200.0,'
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('✓ Successfully updated database/run_all.js');

