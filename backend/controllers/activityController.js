'use strict';
const pool = require('../config/db');

// ── GET /api/activities/:id/slots ─────────────────────────────────────────────
// Returns upcoming slots for an activity with availability calculation, hiding past slots
async function getActivitySlots(req, res, next) {
  try {
    const activityId = req.params.id;
    const { date } = req.query;

    // 1. Verify activity exists, is active, and sanctuary is APPROVED
    const [actRows] = await pool.query(
      `SELECT 
        a.activity_id,
        a.activity_name,
        a.description,
        a.duration_minutes,
        a.what_to_carry,
        a.price,
        s.sanctuary_id,
        s.name AS sanctuary_name,
        s.location AS sanctuary_location,
        s.cover_image
       FROM activities a
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE a.activity_id = ? 
         AND a.is_active = TRUE 
         AND s.listing_status = 'APPROVED'`,
      [activityId]
    );

    if (actRows.length === 0) {
      return res.status(404).json({ error: 'Activity not found or sanctuary is not approved' });
    }

    const activity = actRows[0];

    // 2. Query available upcoming slots from v_slot_availability
    // Hiding past slots: TIMESTAMP(slot_date, slot_time) > NOW()
    let query = `
      SELECT 
        v.slot_id,
        v.activity_id,
        v.guide_id,
        v.guide_name,
        v.vehicle_id,
        v.vehicle_type,
        DATE_FORMAT(v.slot_date, '%Y-%m-%d') AS slot_date,
        TIME_FORMAT(v.slot_time, '%H:%i:%s') AS slot_time,
        v.total_capacity,
        v.booked_seats,
        v.available_seats
      FROM v_slot_availability v
      WHERE v.activity_id = ?
        AND TIMESTAMP(v.slot_date, v.slot_time) > NOW()
    `;
    const params = [activityId];

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query += ' AND v.slot_date = ?';
      params.push(date);
    }

    query += ' ORDER BY v.slot_date ASC, v.slot_time ASC';

    const [slots] = await pool.query(query, params);

    // 3. Also fetch all unique dates in future that have available slots (for calendar dots)
    const [availableDatesRows] = await pool.query(
      `SELECT DISTINCT DATE_FORMAT(v.slot_date, '%Y-%m-%d') AS slot_date
       FROM v_slot_availability v
       WHERE v.activity_id = ?
         AND TIMESTAMP(v.slot_date, v.slot_time) > NOW()
       ORDER BY slot_date ASC`,
      [activityId]
    );

    const availableDates = availableDatesRows.map((r) => r.slot_date);

    return res.status(200).json({
      activity,
      slots,
      available_dates: availableDates,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActivitySlots,
};
