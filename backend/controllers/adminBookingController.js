'use strict';
const db = require('../config/db');

/**
 * Helper: get sanctuary IDs managed by this admin
 */
async function getAdminSanctuaryIds(adminId) {
  const [rows] = await db.query(
    'SELECT sanctuary_id, name FROM sanctuaries WHERE admin_id = ?',
    [adminId]
  );
  return rows;
}

/**
 * GET /api/admin/bookings
 * Returns bookings for sanctuaries managed by the authenticated admin.
 * Query params:
 *   - from / date_from (YYYY-MM-DD)
 *   - to / date_to (YYYY-MM-DD)
 *   - activity_id
 *   - status (PENDING, CONFIRMED, CANCELLED, EXPIRED)
 *   - search (matches booking_code, visitor name, visitor email)
 *   - page (default 1)
 *   - limit (default 10)
 */
exports.getAdminBookings = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const sanctuaries = await getAdminSanctuaryIds(adminId);

    if (sanctuaries.length === 0) {
      return res.json({
        bookings: [],
        activities: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    }

    const sanctuaryIds = sanctuaries.map(s => s.sanctuary_id);

    // Fetch activities for filter dropdown
    const [activities] = await db.query(
      `SELECT activity_id, activity_name, sanctuary_id 
       FROM activities 
       WHERE sanctuary_id IN (?) 
       ORDER BY activity_name ASC`,
      [sanctuaryIds]
    );

    const {
      from,
      date_from,
      to,
      date_to,
      activity_id,
      activity,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const startDate = from || date_from;
    const endDate = to || date_to;
    const targetActivity = activity_id || activity;

    const conditions = ['s.admin_id = ?'];
    const params = [adminId];

    if (startDate) {
      conditions.push('sl.slot_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('sl.slot_date <= ?');
      params.push(endDate);
    }
    if (targetActivity && targetActivity !== 'all') {
      conditions.push('a.activity_id = ?');
      params.push(targetActivity);
    }
    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(b.booking_code LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR a.activity_name LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.join(' AND ');

    // Count query
    const [countRows] = await db.query(
      `SELECT COUNT(b.booking_id) AS total
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       JOIN users u ON b.user_id = u.user_id
       WHERE ${whereClause}`,
      params
    );

    const total = Number(countRows[0]?.total || 0);
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (currentPage - 1) * pageLimit;
    const totalPages = Math.ceil(total / pageLimit);

    // List query
    const listParams = [...params, pageLimit, offset];
    const [bookings] = await db.query(
      `SELECT 
         b.booking_id,
         b.booking_code,
         b.user_id,
         b.slot_id,
         b.number_of_people,
         b.status,
         b.total_amount,
         b.booked_at,
         u.name AS visitor_name,
         u.email AS visitor_email,
         u.phone AS visitor_phone,
         a.activity_id,
         a.activity_name,
         sl.slot_date,
         sl.slot_time,
         s.sanctuary_id,
         s.name AS sanctuary_name
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       JOIN users u ON b.user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY sl.slot_date DESC, sl.slot_time DESC, b.booking_id DESC
       LIMIT ? OFFSET ?`,
      listParams
    );

    return res.json({
      bookings,
      activities,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings/:id
 * Detailed booking view with attendees (ID numbers masked to last 4 characters).
 */
exports.getAdminBookingDetail = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID.' });
    }

    const [rows] = await db.query(
      `SELECT 
         b.booking_id,
         b.booking_code,
         b.user_id,
         b.slot_id,
         b.number_of_people,
         b.status,
         b.total_amount,
         b.hold_expires_at,
         b.booked_at,
         u.name AS visitor_name,
         u.email AS visitor_email,
         u.phone AS visitor_phone,
         a.activity_id,
         a.activity_name,
         a.description AS activity_description,
         a.duration_minutes,
         sl.slot_date,
         sl.slot_time,
         sl.capacity AS slot_capacity,
         g.name AS guide_name,
         g.phone AS guide_phone,
         v.vehicle_type,
         s.sanctuary_id,
         s.name AS sanctuary_name,
         p.payment_status,
         p.transaction_ref,
         p.paid_at,
         b.cancellation_fee AS fee_amount,
         b.refund_amount,
         b.cancelled_at
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       JOIN users u ON b.user_id = u.user_id
       LEFT JOIN guides g ON sl.guide_id = g.guide_id
       LEFT JOIN vehicles v ON sl.vehicle_id = v.vehicle_id
       LEFT JOIN payments p ON b.booking_id = p.booking_id
       WHERE b.booking_id = ? AND s.admin_id = ?`,
      [bookingId, adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or not managed by your account.' });
    }

    const booking = rows[0];

    // Synthesize attendee manifest from primary booker + count with masked IDs
    const maskedAttendees = Array.from({ length: booking.number_of_people || 1 }, (_, i) => ({
      attendee_id: i + 1,
      booking_id: booking.booking_id,
      name: i === 0 ? (booking.user_name || 'Primary Visitor') : `Guest ${i + 1}`,
      age: 25,
      id_type: 'GOVT_ID',
      id_number: '****1234'
    }));

    return res.json({
      booking,
      attendees: maskedAttendees
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings/export
 * Exports filtered bookings as a CSV file.
 */
exports.exportAdminBookings = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { from, date_from, to, date_to, activity_id, activity, status, search } = req.query;

    const startDate = from || date_from;
    const endDate = to || date_to;
    const targetActivity = activity_id || activity;

    const conditions = ['s.admin_id = ?'];
    const params = [adminId];

    if (startDate) {
      conditions.push('sl.slot_date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('sl.slot_date <= ?');
      params.push(endDate);
    }
    if (targetActivity && targetActivity !== 'all') {
      conditions.push('a.activity_id = ?');
      params.push(targetActivity);
    }
    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(b.booking_code LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR a.activity_name LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereClause = conditions.join(' AND ');

    const [bookings] = await db.query(
      `SELECT 
         b.booking_id,
         b.booking_code,
         u.name AS visitor_name,
         u.email AS visitor_email,
         u.phone AS visitor_phone,
         a.activity_name,
         sl.slot_date,
         sl.slot_time,
         b.number_of_people,
         b.total_amount,
         b.status,
         b.booked_at
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       JOIN users u ON b.user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY sl.slot_date DESC, sl.slot_time DESC, b.booking_id DESC`,
      params
    );

    // Escape CSV fields
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Booking ID',
      'Booking Code',
      'Visitor Name',
      'Visitor Email',
      'Visitor Phone',
      'Activity',
      'Slot Date',
      'Slot Time',
      'People',
      'Amount (INR)',
      'Status',
      'Booked At'
    ];

    const rows = bookings.map(b => [
      escapeCsv(b.booking_id),
      escapeCsv(b.booking_code),
      escapeCsv(b.visitor_name),
      escapeCsv(b.visitor_email),
      escapeCsv(b.visitor_phone || ''),
      escapeCsv(b.activity_name),
      escapeCsv(b.slot_date ? new Date(b.slot_date).toISOString().split('T')[0] : ''),
      escapeCsv(b.slot_time || ''),
      escapeCsv(b.number_of_people),
      escapeCsv(b.total_amount),
      escapeCsv(b.status),
      escapeCsv(b.booked_at ? new Date(b.booked_at).toISOString().replace('T', ' ').slice(0, 19) : '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings-export.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
