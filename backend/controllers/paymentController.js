'use strict';
const pool = require('../config/db');

/**
 * POST /api/payments/:bookingId/pay
 * Mock payment processor. Body decides success or failure:
 * - { success: true }: calls sp_confirm_payment and returns booking_code (WB-000101)
 * - { success: false }: sets payment FAILED and keeps booking PENDING until hold ends
 */
async function processMockPayment(req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const { success = true, payment_method = 'CARD' } = req.body;

    // Check booking existence
    const [[booking]] = await pool.query(
      'SELECT booking_id, booking_code, user_id, status, hold_expires_at, total_amount FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Role and caller ownership check
    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to pay for this booking' });
    }

    // State check
    if (booking.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking is already confirmed', booking_code: booking.booking_code });
    }
    if (booking.status === 'EXPIRED') {
      return res.status(400).json({ error: 'Hold expired. Your booking reservation has lapsed.' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is cancelled' });
    }

    // If payment simulation fails
    if (success === false) {
      // Mark payment FAILED, keep booking PENDING until hold ends
      await pool.query(
        'UPDATE payments SET payment_status = "FAILED" WHERE booking_id = ?',
        [bookingId]
      );

      const [[holdCheck]] = await pool.query(
        'SELECT GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), hold_expires_at), 0)) AS remaining_hold_seconds FROM bookings WHERE booking_id = ?',
        [bookingId]
      );
      const remainingHoldSeconds = Number(holdCheck?.remaining_hold_seconds || 0);

      return res.json({
        success: false,
        message: 'Payment simulation failed. Your seats remain reserved until the timer expires; you may retry.',
        status: 'PENDING',
        remaining_hold_seconds: remainingHoldSeconds,
      });
    }

    // Payment simulation succeeded
    const txRef = `tx_mock_${payment_method.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Call stored procedure to atomically confirm payment
    await pool.query('CALL sp_confirm_payment(?, ?, @pay_status)', [
      bookingId,
      txRef,
    ]);

    const [[payResult]] = await pool.query('SELECT @pay_status AS status_code');
    const statusCode = payResult?.status_code;

    if (statusCode === 'SUCCESS') {
      const [[confirmed]] = await pool.query(
        'SELECT booking_id, booking_code, status, total_amount FROM bookings WHERE booking_id = ?',
        [bookingId]
      );

      return res.json({
        success: true,
        message: 'Payment confirmed successfully',
        booking_code: confirmed.booking_code,
        status: 'CONFIRMED',
        transaction_ref: txRef,
      });
    }

    if (statusCode === 'HOLD_EXPIRED') {
      return res.status(400).json({ error: 'Hold expired. Your reservation has lapsed.' });
    }

    if (statusCode === 'ALREADY_CONFIRMED') {
      return res.status(400).json({ error: 'Booking is already confirmed.' });
    }

    return res.status(400).json({ error: `Payment confirmation failed: ${statusCode}` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processMockPayment,
};
