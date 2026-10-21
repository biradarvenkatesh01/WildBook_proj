'use strict';
const pool = require('../config/db');

/**
 * Runs sp_expire_pending_bookings to mark expired holds EXPIRED and payments FAILED.
 */
async function runExpireHolds() {
  try {
    await pool.query('CALL sp_expire_pending_bookings(@cnt)');
    const [[result]] = await pool.query('SELECT @cnt AS expired_count');
    const count = result?.expired_count || 0;
    if (count > 0) {
      console.log(`[expireHolds] Expired ${count} pending booking(s)`);
    }
    return count;
  } catch (err) {
    console.error('[expireHolds] Error expiring holds:', err.message);
    return 0;
  }
}

let intervalId = null;

function start() {
  if (intervalId) return;
  // Run once on startup
  runExpireHolds();
  // Run every 60 seconds
  intervalId = setInterval(runExpireHolds, 60000);
  if (intervalId.unref) intervalId.unref();
  console.log('[expireHolds] Background hold expiration job started (every 60s)');
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  runExpireHolds,
  start,
  stop,
};
