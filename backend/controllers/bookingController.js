'use strict';
const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * POST /api/bookings
 * Body: { slot_id, attendees: [{ name, age, id_type, id_number }] }
 * Creates booking with 10-minute hold via sp_create_booking and saves attendees.
 */
async function createBooking(req, res, next) {
  try {
    const { slot_id, attendees } = req.body;
    const userId = req.user.user_id;

    if (!slot_id || isNaN(Number(slot_id))) {
      return res.status(400).json({ error: 'Valid slot_id is required' });
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'At least one attendee is required' });
    }

    // Validate attendees
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name || typeof a.name !== 'string' || !a.name.trim()) {
        return res.status(400).json({ error: `Attendee ${i + 1}: Name is required` });
      }
      const age = parseInt(a.age, 10);
      if (isNaN(age) || age <= 0) {
        return res.status(400).json({ error: `Attendee ${i + 1}: Valid age (> 0) is required` });
      }
      if (!a.id_type || typeof a.id_type !== 'string' || !a.id_type.trim()) {
        return res.status(400).json({ error: `Attendee ${i + 1}: ID Type is required` });
      }
      if (!a.id_number || typeof a.id_number !== 'string' || !a.id_number.trim()) {
        return res.status(400).json({ error: `Attendee ${i + 1}: ID Number is required` });
      }
    }

    // Verify attendee count matches number_of_people if specified (Per spec test T15)
    if (req.body.number_of_people !== undefined) {
      const declaredCount = parseInt(req.body.number_of_people, 10);
      if (!isNaN(declaredCount) && declaredCount !== attendees.length) {
        return res.status(400).json({
          error: `Attendee count (${attendees.length}) does not match the specified number of people (${declaredCount}).`
        });
      }
    }

    const peopleCount = attendees.length;

    // Call stored procedure
    await pool.query(
      'CALL sp_create_booking(?, ?, ?, @b_id, @b_code, @b_amt, @b_status)',
      [userId, Number(slot_id), peopleCount]
    );

    const [[result]] = await pool.query(
      'SELECT @b_id AS booking_id, @b_code AS booking_code, @b_amt AS total_amount, @b_status AS status_code'
    );

    if (result.status_code !== 'SUCCESS') {
      if (result.status_code === 'SLOT_NOT_FOUND') {
        return res.status(404).json({ error: 'Slot not found or is currently inactive' });
      }
      if (result.status_code === 'NOT_ENOUGH_SEATS') {
        return res.status(400).json({ error: 'Not enough available seats for this slot' });
      }
      if (result.status_code === 'INVALID_PEOPLE_COUNT') {
        return res.status(400).json({ error: 'Invalid number of people' });
      }
      return res.status(400).json({ error: `Booking failed: ${result.status_code}` });
    }

    const bookingId = result.booking_id;

    // Insert attendees into booking_attendees
    const attendeeValues = attendees.map((a) => [
      bookingId,
      a.name.trim(),
      parseInt(a.age, 10),
      a.id_type.trim(),
      a.id_number.trim(),
    ]);

    await pool.query(
      'INSERT INTO booking_attendees (booking_id, name, age, id_type, id_number) VALUES ?',
      [attendeeValues]
    );

    // Fetch created booking record with exact server-side remaining seconds
    const [[booking]] = await pool.query(
      `SELECT booking_id, booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at,
              GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), hold_expires_at), 0)) AS remaining_hold_seconds
       FROM bookings WHERE booking_id = ?`,
      [bookingId]
    );

    return res.status(201).json({
      booking: {
        booking_id: booking.booking_id,
        booking_code: booking.booking_code,
        status: booking.status,
        number_of_people: booking.number_of_people,
        total_amount: Number(booking.total_amount),
        hold_expires_at: booking.hold_expires_at,
        remaining_hold_seconds: Number(booking.remaining_hold_seconds),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id
 * Retrieve booking details and remaining hold seconds. Caller must own the booking.
 */
async function getBookingById(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const [[booking]] = await pool.query(
      `SELECT 
        b.booking_id, b.booking_code, b.user_id, b.slot_id, b.number_of_people, b.status,
        b.total_amount, b.hold_expires_at, b.booked_at,
        IF(b.status = 'PENDING', GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), b.hold_expires_at), 0)), 0) AS remaining_hold_seconds,
        s.slot_date, s.slot_time,
        a.activity_id, a.activity_name, a.duration_minutes, a.price AS base_price,
        sanc.sanctuary_id, sanc.name AS sanctuary_name, sanc.location AS sanctuary_location,
        p.payment_id, p.payment_status, p.transaction_ref, p.paid_at
      FROM bookings b
      JOIN slots s ON b.slot_id = s.slot_id
      JOIN activities a ON s.activity_id = a.activity_id
      JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Caller ownership check
    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this booking' });
    }

    // Fetch attendees
    const [attendees] = await pool.query(
      'SELECT attendee_id, name, age, id_type, id_number FROM booking_attendees WHERE booking_id = ? ORDER BY attendee_id ASC',
      [bookingId]
    );

    return res.json({
      booking: {
        ...booking,
        total_amount: Number(booking.total_amount),
        base_price: Number(booking.base_price),
        remaining_hold_seconds: Number(booking.remaining_hold_seconds),
        attendees,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id/ticket
 * Generates an in-memory PDF ticket with QR code for CONFIRMED bookings owned by the caller.
 * Tickets are never stored on disk.
 */
async function getBookingTicket(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const [[booking]] = await pool.query(
      `SELECT 
        b.booking_id, b.booking_code, b.user_id, b.slot_id, b.number_of_people, b.status,
        b.total_amount, b.booked_at,
        s.slot_date, s.slot_time,
        a.activity_id, a.activity_name, a.duration_minutes, a.price AS base_price,
        sanc.name AS sanctuary_name, sanc.location AS sanctuary_location,
        p.transaction_ref, p.paid_at
      FROM bookings b
      JOIN slots s ON b.slot_id = s.slot_id
      JOIN activities a ON s.activity_id = a.activity_id
      JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Role and caller ownership check
    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this booking ticket' });
    }

    // Status check
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Ticket is only available for CONFIRMED bookings' });
    }

    // Fetch attendees
    const [attendees] = await pool.query(
      'SELECT attendee_id, name, age, id_type, id_number FROM booking_attendees WHERE booking_id = ? ORDER BY attendee_id ASC',
      [bookingId]
    );

    // Generate QR code data buffer
    const qrData = JSON.stringify({
      code: booking.booking_code,
      booking_id: booking.booking_id,
      sanctuary: booking.sanctuary_name,
      activity: booking.activity_name,
      date: booking.slot_date,
      time: booking.slot_time,
      guests: booking.number_of_people,
    });
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1B3B2B',
        light: '#FFFFFF',
      },
    });

    // Stream PDF directly to client in-memory
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="WildBook_Ticket_${booking.booking_code}.pdf"`
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    doc.pipe(res);

    // Forest Header Banner
    doc.rect(40, 40, 515, 75).fill('#1B3B2B');

    doc
      .fillColor('#F4F6F0')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('WildBook', 55, 52);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#D4A373')
      .text('WILDLIFE SANCTUARIES & EXPEDITIONS', 55, 78);

    doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text('OFFICIAL SAFARI PERMIT & PASS', 360, 55, { align: 'right', width: 180 });

    doc
      .fontSize(9)
      .fillColor('#D4A373')
      .text(`Issued: ${new Date(booking.booked_at).toLocaleDateString()}`, 360, 72, { align: 'right', width: 180 });

    // Ticket Code Box
    doc.rect(40, 130, 515, 65).lineWidth(1.5).strokeColor('#D4A373').fillAndStroke('#FCFBF7', '#D4A373');

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#718096')
      .text('RESERVATION CONFIRMATION ID', 55, 142);

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1B3B2B')
      .text(booking.booking_code, 55, 158);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#2E7D32')
      .text('CONFIRMED & VERIFIED', 380, 155, { align: 'right', width: 160 });

    // Details Grid
    const gridY = 215;
    doc.rect(40, gridY, 515, 135).fill('#F8FAF6');

    // Column 1
    doc.fillColor('#718096').fontSize(9).font('Helvetica').text('SANCTUARY', 55, gridY + 12);
    doc.fillColor('#1B3B2B').fontSize(12).font('Helvetica-Bold').text(booking.sanctuary_name, 55, gridY + 24);
    doc.fillColor('#4A5568').fontSize(9).font('Helvetica').text(booking.sanctuary_location, 55, gridY + 40);

    doc.fillColor('#718096').fontSize(9).font('Helvetica').text('EXPERIENCE / ACTIVITY', 55, gridY + 68);
    doc.fillColor('#1B3B2B').fontSize(11).font('Helvetica-Bold').text(booking.activity_name, 55, gridY + 80);
    doc.fillColor('#4A5568').fontSize(9).font('Helvetica').text(`Duration: ${booking.duration_minutes} minutes`, 55, gridY + 95);

    // Column 2
    doc.fillColor('#718096').fontSize(9).font('Helvetica').text('SAFARI DATE & TIME', 230, gridY + 12);
    const dateFormatted = new Date(booking.slot_date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.fillColor('#1B3B2B').fontSize(11).font('Helvetica-Bold').text(dateFormatted, 230, gridY + 24);
    doc.fillColor('#4A5568').fontSize(10).font('Helvetica').text(`Slot Time: ${booking.slot_time}`, 230, gridY + 40);

    doc.fillColor('#718096').fontSize(9).font('Helvetica').text('PAYMENT DETAILS', 230, gridY + 68);
    doc.fillColor('#1B3B2B').fontSize(11).font('Helvetica-Bold').text(`Total Paid: Rs. ${Number(booking.total_amount).toLocaleString('en-IN')}`, 230, gridY + 80);
    doc.fillColor('#4A5568').fontSize(8).font('Helvetica').text(`Txn Ref: ${booking.transaction_ref || 'N/A'}`, 230, gridY + 95);

    // Column 3: QR Code
    doc.image(qrBuffer, 420, gridY + 10, { width: 115 });

    // Attendees Section
    const attY = 370;
    doc.fillColor('#1B3B2B').fontSize(12).font('Helvetica-Bold').text('REGISTERED ATTENDEES', 40, attY);

    // Attendee Table Header
    doc.rect(40, attY + 18, 515, 22).fill('#1B3B2B');
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
    doc.text('#', 50, attY + 24);
    doc.text('Full Name', 80, attY + 24);
    doc.text('Age', 250, attY + 24);
    doc.text('ID Type', 310, attY + 24);
    doc.text('ID Number', 420, attY + 24);

    let rowY = attY + 40;
    attendees.forEach((att, idx) => {
      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
      doc.rect(40, rowY, 515, 22).fill(bgColor);
      doc.fillColor('#2D3748').fontSize(9).font('Helvetica');
      doc.text(`${idx + 1}`, 50, rowY + 6);
      doc.font('Helvetica-Bold').text(att.name, 80, rowY + 6).font('Helvetica');
      doc.text(`${att.age} yrs`, 250, rowY + 6);
      doc.text(att.id_type, 310, rowY + 6);
      doc.text(att.id_number, 420, rowY + 6);
      rowY += 22;
    });

    // Important Guidelines & Conservation Notice
    const noticeY = Math.max(rowY + 25, 540);
    doc.rect(40, noticeY, 515, 95).strokeColor('#E2E8F0').fillAndStroke('#FFFDF9', '#CBD5E0');

    doc.fillColor('#C05621').fontSize(9).font('Helvetica-Bold').text('IMPORTANT SAFARI GUIDELINES:', 55, noticeY + 10);
    doc
      .fillColor('#4A5568')
      .fontSize(8)
      .font('Helvetica')
      .text('1. Please report to the sanctuary entry gate at least 30 minutes before your slot departure time.', 55, noticeY + 26)
      .text('2. Every attendee must present an original government-issued photo ID matching the details listed above.', 55, noticeY + 38)
      .text('3. Wear subdued, earth-toned clothing (khaki, olive, brown). Avoid loud noises, plastic litter, and bright clothing.', 55, noticeY + 50)
      .text('4. Cancellation Policy: Standard cancellations incur a 40% fee; remaining 60% is refunded to original payment method.', 55, noticeY + 62)
      .text('5. Safaris operate subject to weather conditions and forest department wildlife conservation protocols.', 55, noticeY + 74);

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#A0AEC0')
      .text('WildBook Sanctuary Management Platform • Support: help@wildbook.com', 40, 750, { align: 'center', width: 515 });

    doc.end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/slot/:slotId
 * Retrieve slot, activity, and sanctuary info needed to populate Page 07 (Booking Details).
 */
async function getSlotCheckoutInfo(req, res, next) {
  try {
    const slotId = parseInt(req.params.slotId, 10);
    if (isNaN(slotId)) {
      return res.status(400).json({ error: 'Invalid slot ID' });
    }

    const [[slot]] = await pool.query(
      `SELECT 
        s.slot_id,
        s.capacity AS total_capacity,
        DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(s.slot_time, '%H:%i:%s') AS slot_time,
        a.activity_id,
        a.activity_name,
        a.duration_minutes,
        a.price,
        sanc.sanctuary_id,
        sanc.name AS sanctuary_name,
        sanc.location AS sanctuary_location,
        (
          SELECT si.image_path 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = sanc.sanctuary_id 
          ORDER BY si.is_cover DESC, si.sort_order ASC, si.image_id ASC 
          LIMIT 1
        ) AS cover_image,
        COALESCE(
          s.capacity - (
            SELECT COALESCE(SUM(b.number_of_people), 0)
            FROM bookings b
            WHERE b.slot_id = s.slot_id
              AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
          ),
          s.capacity
        ) AS available_seats
      FROM slots s
      JOIN activities a ON s.activity_id = a.activity_id
      JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
      WHERE s.slot_id = ? AND s.is_active = TRUE AND sanc.listing_status = 'APPROVED'`,
      [slotId]
    );

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found or sanctuary is not approved' });
    }

    return res.json({
      slot: {
        ...slot,
        price: Number(slot.price),
        available_seats: Math.max(0, Number(slot.available_seats)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/mine?tab=upcoming|past|cancelled
 * Retrieve visitor's bookings grouped by tab.
 */
async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.user_id;
    const tab = (req.query.tab || 'upcoming').toLowerCase();

    // Base condition for user
    let whereClause = 'WHERE b.user_id = ?';
    const params = [userId];

    if (tab === 'past') {
      whereClause += " AND b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) <= NOW()";
    } else if (tab === 'cancelled') {
      whereClause += " AND b.status = 'CANCELLED'";
    } else {
      // default: upcoming
      whereClause += " AND b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) > NOW()";
    }

    const [rows] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_code,
        b.user_id,
        b.slot_id,
        b.number_of_people,
        b.status,
        b.total_amount,
        b.booked_at,
        DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(s.slot_time, '%H:%i:%s') AS slot_time,
        TIMESTAMP(s.slot_date, s.slot_time) <= NOW() AS is_past,
        a.activity_id,
        a.activity_name,
        a.duration_minutes,
        a.price AS base_price,
        sanc.sanctuary_id,
        sanc.name AS sanctuary_name,
        sanc.location AS sanctuary_location,
        (
          SELECT si.image_path 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = sanc.sanctuary_id 
          ORDER BY si.is_cover DESC, si.sort_order ASC, si.image_id ASC 
          LIMIT 1
        ) AS cover_image,
        c.fee_amount,
        c.refund_amount,
        c.cancelled_at,
        r.review_id,
        r.rating
      FROM bookings b
      JOIN slots s ON b.slot_id = s.slot_id
      JOIN activities a ON s.activity_id = a.activity_id
      JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
      LEFT JOIN cancellations c ON b.booking_id = c.booking_id
      LEFT JOIN reviews r ON b.booking_id = r.booking_id
      ${whereClause}
      ORDER BY s.slot_date DESC, s.slot_time DESC`,
      params
    );

    // Get counts for all 3 tabs
    const [[counts]] = await pool.query(
      `SELECT 
        SUM(CASE WHEN b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) > NOW() THEN 1 ELSE 0 END) AS upcoming_count,
        SUM(CASE WHEN b.status = 'CONFIRMED' AND TIMESTAMP(s.slot_date, s.slot_time) <= NOW() THEN 1 ELSE 0 END) AS past_count,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count
       FROM bookings b
       JOIN slots s ON b.slot_id = s.slot_id
       WHERE b.user_id = ?`,
      [userId]
    );

    const formattedBookings = rows.map((b) => ({
      ...b,
      total_amount: Number(b.total_amount),
      base_price: Number(b.base_price),
      is_past: Boolean(b.is_past),
      fee_amount: b.fee_amount !== null ? Number(b.fee_amount) : null,
      refund_amount: b.refund_amount !== null ? Number(b.refund_amount) : null,
    }));

    return res.json({
      bookings: formattedBookings,
      counts: {
        upcoming: Number(counts?.upcoming_count || 0),
        past: Number(counts?.past_count || 0),
        cancelled: Number(counts?.cancelled_count || 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:id/cancel-preview
 * Previews cancellation charges strictly calculated on the server.
 * Only CONFIRMED bookings whose slot has not started can be previewed/cancelled.
 */
async function getCancelPreview(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const [[booking]] = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_code,
        b.user_id,
        b.status,
        b.total_amount,
        b.number_of_people,
        DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(s.slot_time, '%H:%i:%s') AS slot_time,
        TIMESTAMP(s.slot_date, s.slot_time) <= NOW() AS is_past,
        a.activity_name,
        sanc.name AS sanctuary_name,
        sanc.location AS sanctuary_location,
        (
          SELECT si.image_path 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = sanc.sanctuary_id 
          ORDER BY si.is_cover DESC, si.sort_order ASC, si.image_id ASC 
          LIMIT 1
        ) AS cover_image
      FROM bookings b
      JOIN slots s ON b.slot_id = s.slot_id
      JOIN activities a ON s.activity_id = a.activity_id
      JOIN sanctuaries sanc ON a.sanctuary_id = sanc.sanctuary_id
      WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Caller ownership check
    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to cancel this booking' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Only CONFIRMED bookings can be cancelled' });
    }

    if (booking.is_past) {
      return res.status(400).json({ error: 'Cannot cancel a booking that has already started or occurred' });
    }

    // Server-computed fee breakdown: 40% cancellation fee, 60% refund
    const amountPaid = Number(booking.total_amount);
    const feeAmount = Math.round(amountPaid * 0.40 * 100) / 100;
    const refundAmount = Math.round((amountPaid - feeAmount) * 100) / 100;

    return res.json({
      booking_id: booking.booking_id,
      booking_code: booking.booking_code,
      sanctuary_name: booking.sanctuary_name,
      sanctuary_location: booking.sanctuary_location,
      activity_name: booking.activity_name,
      slot_date: booking.slot_date,
      slot_time: booking.slot_time,
      number_of_people: booking.number_of_people,
      cover_image: booking.cover_image,
      amount_paid: amountPaid,
      fee_percent: 40,
      fee_amount: feeAmount,
      refund_amount: refundAmount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/:id/cancel
 * Executes sp_cancel_booking to atomically mark booking CANCELLED, payment PARTIALLY_REFUNDED,
 * and create cancellation audit record with 40% fee and 60% refund.
 */
async function cancelBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const userId = req.user.user_id;

    // Check booking exists first for clear 404/403
    const [[booking]] = await pool.query(
      'SELECT booking_id, user_id, status FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'SITE_OWNER' && booking.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to cancel this booking' });
    }

    // Call stored procedure
    await pool.query(
      'CALL sp_cancel_booking(?, ?, @status_code, @fee_amount, @refund_amount)',
      [bookingId, userId]
    );

    const [[result]] = await pool.query(
      'SELECT @status_code AS status_code, @fee_amount AS fee_amount, @refund_amount AS refund_amount'
    );

    if (result.status_code !== 'SUCCESS') {
      if (result.status_code === 'ONLY_CONFIRMED_CAN_BE_CANCELLED') {
        return res.status(400).json({ error: 'Only CONFIRMED bookings can be cancelled' });
      }
      if (result.status_code === 'CANNOT_CANCEL_PAST_BOOKING') {
        return res.status(400).json({ error: 'Cannot cancel a booking that has already started or occurred' });
      }
      if (result.status_code === 'BOOKING_NOT_FOUND') {
        return res.status(404).json({ error: 'Booking not found' });
      }
      return res.status(400).json({ error: `Cancellation failed: ${result.status_code}` });
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking_id: bookingId,
      fee_amount: Number(result.fee_amount),
      refund_amount: Number(result.refund_amount),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  getBookingById,
  getBookingTicket,
  getSlotCheckoutInfo,
  getMyBookings,
  getCancelPreview,
  cancelBooking,
};
