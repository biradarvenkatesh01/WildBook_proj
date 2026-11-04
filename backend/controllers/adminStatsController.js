'use strict';
const db = require('../config/db');

/**
 * GET /api/admin/stats
 * Dashboard metrics for the authenticated sanctuary admin:
 * - Total bookings
 * - Net revenue (confirmed total + cancellation fees kept)
 * - Upcoming slots
 * - Average visitor rating
 * - Bookings trend (per day in current month / last 30 days)
 * - Revenue by activity (for bar chart)
 * - Recent 5 bookings
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;

    // Check admin's sanctuaries
    const [sanctuaries] = await db.query(
      'SELECT sanctuary_id, name FROM sanctuaries WHERE admin_id = ?',
      [adminId]
    );

    if (sanctuaries.length === 0) {
      return res.json({
        total_bookings: 0,
        revenue_net: 0,
        upcoming_slots: 0,
        average_rating: 0,
        review_count: 0,
        bookings_trend: [],
        revenue_by_activity: [],
        recent_bookings: []
      });
    }

    const sanctuaryIds = sanctuaries.map(s => s.sanctuary_id);

    // 1. Total bookings & net revenue (Confirmed payments + Cancellation fees kept)
    const [revRows] = await db.query(
      `SELECT 
         COUNT(b.booking_id) AS total_bookings,
         COALESCE(SUM(CASE 
           WHEN b.status = 'CONFIRMED' THEN b.total_amount 
           WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) 
           ELSE 0 
         END), 0) AS revenue_net,
         COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.number_of_people ELSE 0 END), 0) AS total_visitors
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       WHERE a.sanctuary_id IN (?) AND b.status IN ('CONFIRMED', 'CANCELLED')`,
      [sanctuaryIds]
    );

    const totalBookings = Number(revRows[0]?.total_bookings || 0);
    const revenueNet = Number(revRows[0]?.revenue_net || 0);

    // 2. Upcoming slots (slot_date >= CURDATE() and is_active = TRUE)
    const [slotRows] = await db.query(
      `SELECT COUNT(sl.slot_id) AS upcoming_slots
       FROM slots sl
       JOIN activities a ON sl.activity_id = a.activity_id
       WHERE a.sanctuary_id IN (?) AND sl.is_active = TRUE AND sl.slot_date >= CURDATE()`,
      [sanctuaryIds]
    );
    const upcomingSlots = Number(slotRows[0]?.upcoming_slots || 0);

    // 3. Average rating and total review count
    const [ratingRows] = await db.query(
      `SELECT 
         COALESCE(ROUND(AVG(s.average_rating), 1), 0) AS average_rating,
         COALESCE(SUM(s.total_reviews), 0) AS review_count
       FROM sanctuaries s
       WHERE s.sanctuary_id IN (?)`,
      [sanctuaryIds]
    );
    const averageRating = Number(ratingRows[0]?.average_rating || 0);
    const reviewCount = Number(ratingRows[0]?.review_count || 0);

    // 4. Bookings trend for current month (grouped by day)
    const [trendRows] = await db.query(
      `SELECT 
         DATE_FORMAT(b.booked_at, '%Y-%m-%d') AS date,
         DATE_FORMAT(b.booked_at, '%e %b') AS label,
         COUNT(b.booking_id) AS count
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       WHERE a.sanctuary_id IN (?) 
         AND b.status IN ('CONFIRMED', 'CANCELLED')
         AND b.booked_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE_FORMAT(b.booked_at, '%Y-%m-%d'), label
       ORDER BY date ASC`,
      [sanctuaryIds]
    );

    // 5. Revenue by activity (for bar chart)
    const [activityRevRows] = await db.query(
      `SELECT 
         a.activity_id,
         a.activity_name,
         COALESCE(SUM(CASE 
           WHEN b.status = 'CONFIRMED' THEN b.total_amount 
           WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) 
           ELSE 0 
         END), 0) AS revenue,
         COUNT(b.booking_id) AS booking_count
       FROM activities a
       LEFT JOIN slots sl ON a.activity_id = sl.activity_id
       LEFT JOIN bookings b ON sl.slot_id = b.slot_id AND b.status IN ('CONFIRMED', 'CANCELLED')
       WHERE a.sanctuary_id IN (?)
       GROUP BY a.activity_id, a.activity_name
       ORDER BY revenue DESC`,
      [sanctuaryIds]
    );

    // 6. Recent 5 bookings
    const [recentBookings] = await db.query(
      `SELECT 
         b.booking_id,
         b.booking_code,
         b.status,
         b.total_amount,
         b.booked_at,
         u.name AS visitor_name,
         u.email AS visitor_email,
         a.activity_name,
         sl.slot_date,
         sl.slot_time
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN users u ON b.user_id = u.user_id
       WHERE a.sanctuary_id IN (?)
       ORDER BY b.booked_at DESC, b.booking_id DESC
       LIMIT 5`,
      [sanctuaryIds]
    );

    return res.json({
      total_bookings: totalBookings,
      revenue_net: revenueNet,
      upcoming_slots: upcomingSlots,
      average_rating: averageRating,
      review_count: reviewCount,
      bookings_trend: trendRows,
      revenue_by_activity: activityRevRows,
      recent_bookings: recentBookings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/reports
 * Scoped reports for the admin's sanctuaries:
 * 1. Slot occupancy rates (with subquery)
 * 2. Monthly net revenue with cancellation fees kept
 * 3. Cancellation rates
 */
exports.getAdminReports = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const [sanctuaries] = await db.query(
      'SELECT sanctuary_id, name FROM sanctuaries WHERE admin_id = ?',
      [adminId]
    );

    if (sanctuaries.length === 0) {
      return res.json({
        slot_occupancy: [],
        monthly_revenue: [],
        cancellation_rate: []
      });
    }

    const sanctuaryIds = sanctuaries.map(s => s.sanctuary_id);

    // 1. Slot Occupancy Rate (CORRELATED SUBQUERY)
    const [slotOccupancy] = await db.query(
      `SELECT 
         s.name AS sanctuary_name,
         a.activity_name,
         sl.slot_id,
         sl.slot_date,
         sl.slot_time,
         sl.capacity AS total_capacity,
         (
           SELECT COALESCE(SUM(b.number_of_people), 0)
           FROM bookings b
           WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED'
         ) AS booked_seats,
         ROUND(
           ((SELECT COALESCE(SUM(b.number_of_people), 0)
             FROM bookings b
             WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED') / sl.capacity) * 100, 1
         ) AS occupancy_rate_percent
       FROM slots sl
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE s.admin_id = ? AND sl.is_active = TRUE
       ORDER BY sl.slot_date DESC, sl.slot_time DESC
       LIMIT 30`,
      [adminId]
    );

    // 2. Monthly Revenue including cancellation fees kept
    const [monthlyRevenue] = await db.query(
      `SELECT 
         s.name AS sanctuary_name,
         DATE_FORMAT(b.booked_at, '%Y-%m') AS booking_month,
         COUNT(b.booking_id) AS total_bookings,
         SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_amount ELSE 0 END) AS confirmed_revenue,
         SUM(CASE WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) ELSE 0 END) AS cancellation_fees_kept,
         SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_amount WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) ELSE 0 END) AS net_revenue
       FROM sanctuaries s
       JOIN activities a ON s.sanctuary_id = a.sanctuary_id
       JOIN slots sl ON a.activity_id = sl.activity_id
       JOIN bookings b ON sl.slot_id = b.slot_id
       WHERE s.admin_id = ? AND b.status IN ('CONFIRMED', 'CANCELLED')
       GROUP BY s.sanctuary_id, s.name, DATE_FORMAT(b.booked_at, '%Y-%m')
       ORDER BY booking_month DESC`,
      [adminId]
    );

    // 3. Cancellation Rate per Activity
    const [cancellationRate] = await db.query(
      `SELECT 
         a.activity_id,
         a.activity_name,
         COUNT(b.booking_id) AS total_reservations,
         SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
         SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
         ROUND(
           (SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) / NULLIF(COUNT(b.booking_id), 0)) * 100, 1
         ) AS cancellation_rate_percent,
         COALESCE(SUM(b.cancellation_fee), 0) AS total_cancellation_fees_collected
       FROM activities a
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       JOIN slots sl ON a.activity_id = sl.activity_id
       JOIN bookings b ON sl.slot_id = b.slot_id
       WHERE s.admin_id = ? AND b.status IN ('CONFIRMED', 'CANCELLED')
       GROUP BY a.activity_id, a.activity_name
       ORDER BY cancellation_rate_percent DESC`,
      [adminId]
    );

    return res.json({
      slot_occupancy: slotOccupancy,
      monthly_revenue: monthlyRevenue,
      cancellation_rate: cancellationRate
    });
  } catch (err) {
    next(err);
  }
};
