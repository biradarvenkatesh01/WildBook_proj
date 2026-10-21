'use strict';
const db = require('../config/db');

/**
 * Format a Date object to YYYY-MM-DD using local calendar date
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute Monday and Sunday for the given week reference date
 */
function getWeekRange(dateInput) {
  let d;
  if (dateInput && typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, dayNum] = dateInput.split('-').map(Number);
    d = new Date(y, m - 1, dayNum);
  } else {
    d = new Date();
  }

  // Monday as start of week
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
    mondayDate: monday,
  };
}

/**
 * Map database trigger errors and unique constraint violations to friendly messages
 */
function handleSlotDatabaseError(err, res) {
  const errMsg = err.message || '';

  // Trigger: capacity > vehicle
  if (errMsg.includes('Slot capacity cannot exceed vehicle capacity')) {
    return res.status(400).json({ error: 'Slot capacity cannot exceed vehicle capacity' });
  }

  // Trigger: consistency
  if (errMsg.includes('Vehicle, guide, and activity must belong to the same sanctuary')) {
    return res.status(400).json({ error: 'Vehicle, guide, and activity must belong to the same sanctuary' });
  }

  // Trigger: approved admin
  if (errMsg.includes('Only an APPROVED admin can add slots')) {
    return res.status(403).json({ error: 'Only an APPROVED admin can add slots' });
  }

  // Unique constraint on Guide: uq_slot_guide (guide_id, slot_date, slot_time)
  if (err.code === 'ER_DUP_ENTRY' && (errMsg.includes('uq_slot_guide') || errMsg.includes('guide_id'))) {
    return res.status(409).json({ error: 'Guide is already assigned to another slot at this date and time' });
  }

  // Unique constraint on Vehicle: uq_slot_vehicle (vehicle_id, slot_date, slot_time)
  if (err.code === 'ER_DUP_ENTRY' && (errMsg.includes('uq_slot_vehicle') || errMsg.includes('vehicle_id'))) {
    return res.status(409).json({ error: 'Vehicle is already assigned to another slot at this date and time' });
  }

  // Generic fallback for custom signals
  if (err.sqlState === '45000') {
    return res.status(400).json({ error: errMsg });
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// SLOTS CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/slots?sanctuary_id=&week=
 * Returns week slots with booked seats and capacity
 */
exports.getSlots = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id, week } = req.query;

    const { startDate, endDate } = getWeekRange(week);

    let query = `
      SELECT 
        sl.slot_id,
        sl.activity_id,
        a.activity_name,
        a.price AS activity_price,
        a.duration_minutes AS activity_duration,
        s.sanctuary_id,
        s.name AS sanctuary_name,
        sl.guide_id,
        g.name AS guide_name,
        g.phone AS guide_phone,
        sl.vehicle_id,
        v.vehicle_type,
        v.capacity AS vehicle_capacity,
        DATE_FORMAT(sl.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(sl.slot_time, '%H:%i:%s') AS slot_time,
        sl.capacity,
        sl.is_active,
        CAST(COALESCE((
          SELECT SUM(b.number_of_people)
          FROM bookings b
          WHERE b.slot_id = sl.slot_id
            AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
        ), 0) AS SIGNED) AS booked_seats,
        CAST((
          sl.capacity - COALESCE((
            SELECT SUM(b.number_of_people)
            FROM bookings b
            WHERE b.slot_id = sl.slot_id
              AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
          ), 0)
        ) AS SIGNED) AS available_seats,
        CAST(COALESCE((
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED'
        ), 0) AS SIGNED) AS confirmed_bookings_count
      FROM slots sl
      JOIN activities a ON sl.activity_id = a.activity_id
      JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
      JOIN guides g ON sl.guide_id = g.guide_id
      JOIN vehicles v ON sl.vehicle_id = v.vehicle_id
      WHERE s.admin_id = ?
        AND sl.slot_date >= ?
        AND sl.slot_date <= ?
    `;
    const params = [adminId, startDate, endDate];

    if (sanctuary_id) {
      query += ' AND s.sanctuary_id = ?';
      params.push(sanctuary_id);
    }

    query += ' ORDER BY sl.slot_date ASC, sl.slot_time ASC';

    const [slots] = await db.query(query, params);

    return res.json({
      week_start: startDate,
      week_end: endDate,
      slots,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/slots/:id
 */
exports.getSlotById = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT 
        sl.slot_id,
        sl.activity_id,
        a.activity_name,
        a.price AS activity_price,
        s.sanctuary_id,
        s.name AS sanctuary_name,
        sl.guide_id,
        g.name AS guide_name,
        sl.vehicle_id,
        v.vehicle_type,
        v.capacity AS vehicle_capacity,
        DATE_FORMAT(sl.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(sl.slot_time, '%H:%i:%s') AS slot_time,
        sl.capacity,
        sl.is_active,
        CAST(COALESCE((
          SELECT SUM(b.number_of_people)
          FROM bookings b
          WHERE b.slot_id = sl.slot_id
            AND (b.status = 'CONFIRMED' OR (b.status = 'PENDING' AND b.hold_expires_at > NOW()))
        ), 0) AS SIGNED) AS booked_seats,
        CAST(COALESCE((
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED'
        ), 0) AS SIGNED) AS confirmed_bookings_count
      FROM slots sl
      JOIN activities a ON sl.activity_id = a.activity_id
      JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
      JOIN guides g ON sl.guide_id = g.guide_id
      JOIN vehicles v ON sl.vehicle_id = v.vehicle_id
      WHERE sl.slot_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found or unauthorized' });
    }

    return res.json({ slot: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/slots
 */
exports.createSlot = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity } = req.body;

    if (!activity_id || !guide_id || !vehicle_id || !slot_date || !slot_time || capacity === undefined) {
      return res.status(400).json({
        error: 'Activity, guide, vehicle, date, time, and capacity are required',
      });
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({ error: 'Capacity must be greater than 0' });
    }

    // Format slot_time if provided as "HH:mm" -> "HH:mm:00"
    let formattedTime = slot_time.trim();
    if (/^\d{1,2}:\d{2}$/.test(formattedTime)) {
      formattedTime = `${formattedTime}:00`;
    }

    // Check ownership of the activity
    const [act] = await db.query(
      `SELECT a.sanctuary_id FROM activities a
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE a.activity_id = ? AND s.admin_id = ?`,
      [activity_id, adminId]
    );

    if (act.length === 0) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }

    // Insert slot (triggers will enforce vehicle capacity, same sanctuary, approved admin)
    const [result] = await db.query(
      `INSERT INTO slots 
        (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [activity_id, guide_id, vehicle_id, slot_date, formattedTime, cap]
    );

    return res.status(201).json({
      message: 'Slot scheduled successfully',
      slot_id: result.insertId,
    });
  } catch (err) {
    const handled = handleSlotDatabaseError(err, res);
    if (handled) return;
    next(err);
  }
};

/**
 * PUT /api/admin/slots/:id
 * Rule: A slot with confirmed bookings cannot change date, time or capacity.
 */
exports.updateSlot = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;
    const { activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active } = req.body;

    // Check existing slot and ownership
    const [existing] = await db.query(
      `SELECT 
        sl.*,
        DATE_FORMAT(sl.slot_date, '%Y-%m-%d') AS formatted_date,
        TIME_FORMAT(sl.slot_time, '%H:%i:%s') AS formatted_time,
        (SELECT COUNT(*) FROM bookings b WHERE b.slot_id = sl.slot_id AND b.status = 'CONFIRMED') AS confirmed_count
       FROM slots sl
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE sl.slot_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Slot not found or unauthorized' });
    }

    const current = existing[0];
    const hasConfirmedBookings = current.confirmed_count > 0;

    // Parse values
    const newActivityId = activity_id !== undefined ? activity_id : current.activity_id;
    const newGuideId = guide_id !== undefined ? guide_id : current.guide_id;
    const newVehicleId = vehicle_id !== undefined ? vehicle_id : current.vehicle_id;
    const newDate = slot_date !== undefined ? slot_date : current.formatted_date;
    let newTime = slot_time !== undefined ? slot_time.trim() : current.formatted_time;
    if (newTime && /^\d{1,2}:\d{2}$/.test(newTime)) {
      newTime = `${newTime}:00`;
    }
    const newCapacity = capacity !== undefined ? parseInt(capacity, 10) : current.capacity;
    const newActive = is_active !== undefined ? Boolean(is_active) : Boolean(current.is_active);

    // Rule: A slot with confirmed bookings cannot change date, time or capacity
    if (hasConfirmedBookings) {
      const dateChanged = newDate !== current.formatted_date;
      const timeChanged = newTime !== current.formatted_time;
      const capacityChanged = newCapacity !== current.capacity;

      if (dateChanged || timeChanged || capacityChanged) {
        return res.status(400).json({
          error: 'A slot with confirmed bookings cannot change date, time or capacity',
        });
      }
    }

    if (isNaN(newCapacity) || newCapacity <= 0) {
      return res.status(400).json({ error: 'Capacity must be greater than 0' });
    }

    await db.query(
      `UPDATE slots SET
        activity_id = ?,
        guide_id = ?,
        vehicle_id = ?,
        slot_date = ?,
        slot_time = ?,
        capacity = ?,
        is_active = ?
       WHERE slot_id = ?`,
      [newActivityId, newGuideId, newVehicleId, newDate, newTime, newCapacity, newActive, id]
    );

    return res.json({ message: 'Slot updated successfully' });
  } catch (err) {
    const handled = handleSlotDatabaseError(err, res);
    if (handled) return;
    next(err);
  }
};

/**
 * DELETE /api/admin/slots/:id
 * Rule: Use is_active instead of deleting anything that has bookings.
 */
exports.deleteSlot = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.query(
      `SELECT sl.slot_id, sl.is_active
       FROM slots sl
       JOIN activities a ON sl.activity_id = a.activity_id
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE sl.slot_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Slot not found or unauthorized' });
    }

    // Check if any bookings exist (confirmed, pending, expired, cancelled)
    const [bookingCheck] = await db.query(
      'SELECT COUNT(*) AS total_bookings FROM bookings WHERE slot_id = ?',
      [id]
    );

    if (bookingCheck[0].total_bookings > 0) {
      // Must use is_active instead of deleting
      await db.query('UPDATE slots SET is_active = FALSE WHERE slot_id = ?', [id]);
      return res.json({
        message: 'Slot deactivated because bookings exist for this slot',
        is_active: false,
      });
    }

    // No bookings exist: safely delete row
    await db.query('DELETE FROM slots WHERE slot_id = ?', [id]);
    return res.json({ message: 'Slot deleted successfully' });
  } catch (err) {
    next(err);
  }
};
