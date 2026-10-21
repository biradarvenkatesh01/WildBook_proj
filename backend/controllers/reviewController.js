'use strict';
const pool = require('../config/db');

/**
 * POST /api/reviews
 * Creates a review for a completed safari booking.
 * Constraints:
 *  - Booking must be CONFIRMED
 *  - Booking must be owned by the caller
 *  - Slot must be in the past (TIMESTAMP(slot_date, slot_time) <= NOW())
 *  - Booking cannot have an existing review (1:1 relation)
 */
async function createReview(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { booking_id, rating, comment } = req.body;

    const bookingId = parseInt(booking_id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Valid booking_id is required' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // 1. Fetch booking with slot and activity details
    const [[booking]] = await pool.query(
      `SELECT 
        b.booking_id,
        b.user_id,
        b.status,
        s.slot_date,
        s.slot_time,
        a.sanctuary_id,
        TIMESTAMP(s.slot_date, s.slot_time) <= NOW() AS is_past
       FROM bookings b
       JOIN slots s ON b.slot_id = s.slot_id
       JOIN activities a ON s.activity_id = a.activity_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // 2. Ownership check
    if (booking.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only review your own bookings' });
    }

    // 3. Status check
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'A review requires a past CONFIRMED booking' });
    }

    // 4. Past slot check
    if (!booking.is_past) {
      return res.status(400).json({ error: 'Cannot review a slot that has not yet occurred' });
    }

    // 5. Check if already reviewed
    const [[existing]] = await pool.query(
      'SELECT review_id FROM reviews WHERE booking_id = ?',
      [bookingId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You have already submitted a review for this booking' });
    }

    // 6. Insert review
    const sanitizedComment = typeof comment === 'string' ? comment.trim().slice(0, 1000) : null;

    const [insertResult] = await pool.query(
      `INSERT INTO reviews (booking_id, user_id, sanctuary_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [bookingId, userId, booking.sanctuary_id, ratingNum, sanitizedComment]
    );

    const [[review]] = await pool.query(
      `SELECT review_id, booking_id, user_id, sanctuary_id, rating, comment, created_at
       FROM reviews WHERE review_id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reviews/booking/:bookingId
 * Retrieves booking details and existing review (if any) to pre-fill the review page.
 */
async function getBookingReviewContext(req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const userId = req.user.user_id;

    const [[booking]] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_code,
        b.user_id,
        b.status,
        DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(s.slot_time, '%H:%i:%s') AS slot_time,
        TIMESTAMP(s.slot_date, s.slot_time) <= NOW() AS is_past,
        a.activity_id,
        a.activity_name,
        sanc.sanctuary_id,
        sanc.name AS sanctuary_name,
        sanc.location AS sanctuary_location,
        sanc.description AS sanctuary_description,
        (
          SELECT si.image_path 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = sanc.sanctuary_id 
          ORDER BY si.is_cover DESC, si.sort_order ASC, si.image_id ASC 
          LIMIT 1
        ) AS cover_image,
        r.review_id,
        r.rating,
        r.comment,
        r.created_at AS reviewed_at
       FROM bookings b
       JOIN slots s ON b.slot_id = s.slot_id
       JOIN activities a ON s.activity_id = a.activity_id
       JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
       LEFT JOIN reviews r ON b.booking_id = r.booking_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this booking' });
    }

    return res.json({ booking });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getBookingReviewContext,
};
