'use strict';
const db = require('../config/db');

/**
 * GET /api/owner/stats
 * Aggregated authority statistics for the Site Owner Dashboard:
 * - Pending Admins count
 * - Pending Sanctuaries count
 * - Approved Sanctuaries count
 * - Total Bookings count
 * - Bookings per Sanctuary (for bar chart)
 * - Approvals Over Time (for line chart)
 * - Latest Pending Requests ("Needs Your Attention" table)
 */
exports.getOwnerStats = async (req, res, next) => {
  try {
    // 1. Pending Admins count
    const [pendingAdminsRows] = await db.query(
      `SELECT COUNT(user_id) AS count 
       FROM users 
       WHERE role = 'ADMIN' AND account_status = 'PENDING'`
    );
    const pendingAdmins = Number(pendingAdminsRows[0]?.count || 0);

    // 2. Pending Sanctuaries count
    const [pendingSanctuariesRows] = await db.query(
      `SELECT COUNT(sanctuary_id) AS count 
       FROM sanctuaries 
       WHERE listing_status = 'PENDING'`
    );
    const pendingSanctuaries = Number(pendingSanctuariesRows[0]?.count || 0);

    // 3. Approved Sanctuaries count
    const [approvedSanctuariesRows] = await db.query(
      `SELECT COUNT(sanctuary_id) AS count 
       FROM sanctuaries 
       WHERE listing_status = 'APPROVED'`
    );
    const approvedSanctuaries = Number(approvedSanctuariesRows[0]?.count || 0);

    // 4. Total Bookings count (CONFIRMED + CANCELLED)
    const [totalBookingsRows] = await db.query(
      `SELECT COUNT(booking_id) AS count 
       FROM bookings 
       WHERE status IN ('CONFIRMED', 'CANCELLED')`
    );
    const totalBookings = Number(totalBookingsRows[0]?.count || 0);

    // 5. Bookings per Sanctuary (for bar chart)
    const [bookingsPerSanctuary] = await db.query(
      `SELECT 
         s.sanctuary_id,
         s.name,
         COUNT(b.booking_id) AS booking_count
       FROM sanctuaries s
       LEFT JOIN activities a ON s.sanctuary_id = a.sanctuary_id
       LEFT JOIN slots sl ON a.activity_id = sl.activity_id
       LEFT JOIN bookings b ON sl.slot_id = b.slot_id AND b.status IN ('CONFIRMED', 'CANCELLED')
       WHERE s.listing_status = 'APPROVED'
       GROUP BY s.sanctuary_id, s.name
       ORDER BY booking_count DESC
       LIMIT 10`
    );

    // 6. Approvals Over Time (grouped by month over past 6 months)
    const [approvalsOverTime] = await db.query(
      `SELECT 
         DATE_FORMAT(m.month_date, '%Y-%m') AS month,
         DATE_FORMAT(m.month_date, '%b ''%y') AS label,
         (
           (SELECT COUNT(*) 
            FROM sanctuaries s 
            WHERE s.listing_status = 'APPROVED' 
              AND s.reviewed_at IS NOT NULL 
              AND DATE_FORMAT(s.reviewed_at, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m'))
           +
           (SELECT COUNT(*) 
            FROM users u 
            WHERE u.account_status = 'APPROVED' 
              AND u.reviewed_at IS NOT NULL 
              AND DATE_FORMAT(u.reviewed_at, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m'))
         ) AS total_approvals
       FROM (
         SELECT CURDATE() - INTERVAL (5 - a.n) MONTH AS month_date
         FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) a
       ) m
       ORDER BY m.month_date ASC`
    );

    // 7. Latest Pending Requests (Needs Your Attention)
    // Combine pending admins and pending sanctuaries
    const [pendingAdminList] = await db.query(
      `SELECT 
         u.user_id AS id,
         'Admin Request' AS type,
         u.name AS name,
         u.email AS submitted_by,
         u.created_at AS date_submitted,
         CONCAT('Requesting admin access for ', COALESCE(ap.organisation_name, 'Sanctuary Operator')) AS details,
         'Pending' AS status,
         '/owner/admin-requests' AS review_url
       FROM users u
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       WHERE u.role = 'ADMIN' AND u.account_status = 'PENDING'
       ORDER BY u.created_at DESC
       LIMIT 5`
    );

    const [pendingSanctuaryList] = await db.query(
      `SELECT 
         s.sanctuary_id AS id,
         'Sanctuary Request' AS type,
         s.name AS name,
         COALESCE(s.contact_email, u.email) AS submitted_by,
         s.reviewed_at AS date_submitted,
         'New sanctuary registration request' AS details,
         'Pending' AS status,
         CONCAT('/owner/sanctuary-requests/', s.sanctuary_id) AS review_url
       FROM sanctuaries s
       JOIN users u ON s.admin_id = u.user_id
       WHERE s.listing_status = 'PENDING'
       ORDER BY s.sanctuary_id DESC
       LIMIT 5`
    );

    // Merge and sort pending requests by date (newest first)
    const combinedPending = [...pendingAdminList, ...pendingSanctuaryList].sort(
      (a, b) => new Date(b.date_submitted || 0) - new Date(a.date_submitted || 0)
    ).slice(0, 8);

    return res.json({
      pending_admins: pendingAdmins,
      pending_sanctuaries: pendingSanctuaries,
      approved_sanctuaries: approvedSanctuaries,
      total_bookings: totalBookings,
      bookings_per_sanctuary: bookingsPerSanctuary,
      approvals_over_time: approvalsOverTime,
      latest_pending_requests: combinedPending
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/owner/reports
 * Comprehensive platform analytical SQL reports:
 * 1. Most-booked sanctuaries
 * 2. Frequent bookers (Includes GROUP BY with HAVING)
 * 3. Monthly revenue per sanctuary including cancellation fees kept
 * 4. Slot occupancy rates (Includes CORRELATED SUBQUERY)
 * 5. Cancellation rate per sanctuary
 */
exports.getOwnerReports = async (req, res, next) => {
  try {
    // 1. Most-booked sanctuaries
    const [mostBooked] = await db.query(
      `SELECT 
         s.sanctuary_id,
         s.name AS sanctuary_name,
         s.location,
         COUNT(b.booking_id) AS total_bookings,
         COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.number_of_people ELSE 0 END), 0) AS total_visitors,
         COALESCE(SUM(CASE 
           WHEN b.status = 'CONFIRMED' THEN b.total_amount 
           WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) 
           ELSE 0 
         END), 0) AS total_revenue
       FROM sanctuaries s
       LEFT JOIN activities a ON s.sanctuary_id = a.sanctuary_id
       LEFT JOIN slots sl ON a.activity_id = sl.activity_id
       LEFT JOIN bookings b ON sl.slot_id = b.slot_id AND b.status IN ('CONFIRMED', 'CANCELLED')
       WHERE s.listing_status = 'APPROVED'
       GROUP BY s.sanctuary_id, s.name, s.location
       ORDER BY total_bookings DESC, total_revenue DESC
       LIMIT 15`
    );

    // 2. Frequent bookers (MANDATORY: GROUP BY with HAVING)
    const [frequentBookers] = await db.query(
      `SELECT 
         u.user_id,
         u.name AS visitor_name,
         u.email AS visitor_email,
         u.phone AS visitor_phone,
         COUNT(b.booking_id) AS total_bookings,
         COALESCE(SUM(b.number_of_people), 0) AS total_seats,
         COALESCE(SUM(CASE 
           WHEN b.status = 'CONFIRMED' THEN b.total_amount 
           WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) 
           ELSE 0 
         END), 0) AS total_spend
       FROM users u
       JOIN bookings b ON u.user_id = b.user_id
       WHERE b.status IN ('CONFIRMED', 'CANCELLED')
       GROUP BY u.user_id, u.name, u.email, u.phone
       HAVING COUNT(b.booking_id) >= 1
       ORDER BY total_bookings DESC, total_spend DESC
       LIMIT 20`
    );

    // 3. Monthly revenue per sanctuary including cancellation fees kept
    const [monthlyRevenue] = await db.query(
      `SELECT 
         s.sanctuary_id,
         s.name AS sanctuary_name,
         DATE_FORMAT(b.booked_at, '%Y-%m') AS booking_month,
         COUNT(b.booking_id) AS total_bookings,
         COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_amount ELSE 0 END), 0) AS confirmed_revenue,
         COALESCE(SUM(CASE WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) ELSE 0 END), 0) AS cancellation_fees_kept,
         COALESCE(SUM(CASE 
           WHEN b.status = 'CONFIRMED' THEN b.total_amount 
           WHEN b.status = 'CANCELLED' THEN COALESCE(b.cancellation_fee, 0) 
           ELSE 0 
         END), 0) AS net_revenue
       FROM sanctuaries s
       JOIN activities a ON s.sanctuary_id = a.sanctuary_id
       JOIN slots sl ON a.activity_id = sl.activity_id
       JOIN bookings b ON sl.slot_id = b.slot_id
       WHERE b.status IN ('CONFIRMED', 'CANCELLED')
       GROUP BY s.sanctuary_id, s.name, DATE_FORMAT(b.booked_at, '%Y-%m')
       ORDER BY booking_month DESC, net_revenue DESC
       LIMIT 25`
    );

    // 4. Slot occupancy rates (MANDATORY: CORRELATED SUBQUERY)
    const [slotOccupancy] = await db.query(
      `SELECT 
         s.sanctuary_id,
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
       WHERE sl.is_active = TRUE
       ORDER BY sl.slot_date DESC, sl.slot_time DESC
       LIMIT 30`
    );

    // 5. Cancellation rate
    const [cancellationRate] = await db.query(
      `SELECT 
         s.sanctuary_id,
         s.name AS sanctuary_name,
         COUNT(b.booking_id) AS total_reservations,
         SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
         SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
         ROUND(
           (SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) / NULLIF(COUNT(b.booking_id), 0)) * 100, 1
         ) AS cancellation_rate_percent,
         COALESCE(SUM(b.cancellation_fee), 0) AS total_cancellation_fees_collected
       FROM sanctuaries s
       JOIN activities a ON s.sanctuary_id = a.sanctuary_id
       JOIN slots sl ON a.activity_id = sl.activity_id
       JOIN bookings b ON sl.slot_id = b.slot_id
       WHERE b.status IN ('CONFIRMED', 'CANCELLED')
       GROUP BY s.sanctuary_id, s.name
       ORDER BY cancellation_rate_percent DESC`
    );

    return res.json({
      most_booked_sanctuaries: mostBooked,
      frequent_bookers: frequentBookers,
      monthly_revenue: monthlyRevenue,
      slot_occupancy: slotOccupancy,
      cancellation_rate: cancellationRate
    });
  } catch (err) {
    next(err);
  }
};
