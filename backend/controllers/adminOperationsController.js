'use strict';
const db = require('../config/db');

/**
 * Helper to verify that the specified sanctuary belongs to the authenticated admin
 */
async function verifySanctuaryOwnership(sanctuaryId, adminId) {
  const [rows] = await db.query(
    'SELECT sanctuary_id, name, listing_status FROM sanctuaries WHERE sanctuary_id = ? AND admin_id = ?',
    [sanctuaryId, adminId]
  );
  if (rows.length === 0) {
    const error = new Error('Sanctuary not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES CRUD
// ══════════════════════════════════════════════════════════════════════════════

exports.getActivities = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id } = req.query;

    let query = `
      SELECT 
        a.activity_id,
        a.sanctuary_id,
        s.name AS sanctuary_name,
        a.activity_name,
        a.description,
        a.duration_minutes,
        a.what_to_carry,
        a.price,
        a.is_active,
        (
          SELECT COUNT(*) 
          FROM bookings b
          JOIN slots sl ON b.slot_id = sl.slot_id
          WHERE sl.activity_id = a.activity_id
        ) AS total_bookings
      FROM activities a
      JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
      WHERE s.admin_id = ?
    `;
    const params = [adminId];

    if (sanctuary_id) {
      query += ' AND a.sanctuary_id = ?';
      params.push(sanctuary_id);
    }

    query += ' ORDER BY a.is_active DESC, a.activity_id ASC';

    const [activities] = await db.query(query, params);
    return res.json({ activities });
  } catch (err) {
    next(err);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price } = req.body;

    if (!sanctuary_id || !activity_name || duration_minutes === undefined || price === undefined) {
      return res.status(400).json({ error: 'Sanctuary ID, activity name, duration, and price are required' });
    }

    const duration = parseInt(duration_minutes, 10);
    const numPrice = parseFloat(price);

    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0 minutes' });
    }
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    await verifySanctuaryOwnership(sanctuary_id, adminId);

    const [result] = await db.query(
      `INSERT INTO activities 
        (sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [sanctuary_id, activity_name.trim(), description || null, duration, what_to_carry || null, numPrice]
    );

    return res.status(201).json({
      message: 'Activity created successfully',
      activity_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;
    const { activity_name, description, duration_minutes, what_to_carry, price, is_active } = req.body;

    // Verify activity belongs to one of admin's sanctuaries
    const [existing] = await db.query(
      `SELECT a.* FROM activities a
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE a.activity_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }

    const current = existing[0];
    const newName = activity_name !== undefined ? activity_name.trim() : current.activity_name;
    const newDesc = description !== undefined ? description : current.description;
    const newDuration = duration_minutes !== undefined ? parseInt(duration_minutes, 10) : current.duration_minutes;
    const newCarry = what_to_carry !== undefined ? what_to_carry : current.what_to_carry;
    const newPrice = price !== undefined ? parseFloat(price) : current.price;
    const newActive = is_active !== undefined ? Boolean(is_active) : Boolean(current.is_active);

    if (!newName) {
      return res.status(400).json({ error: 'Activity name cannot be empty' });
    }
    if (isNaN(newDuration) || newDuration <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0 minutes' });
    }
    if (isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    await db.query(
      `UPDATE activities SET
        activity_name = ?,
        description = ?,
        duration_minutes = ?,
        what_to_carry = ?,
        price = ?,
        is_active = ?
       WHERE activity_id = ?`,
      [newName, newDesc, newDuration, newCarry, newPrice, newActive, id]
    );

    return res.json({ message: 'Activity updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;

    // Verify ownership
    const [existing] = await db.query(
      `SELECT a.* FROM activities a
       JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
       WHERE a.activity_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Activity not found or unauthorized' });
    }

    // Check if bookings exist for this activity's slots
    const [bookingCheck] = await db.query(
      `SELECT COUNT(*) AS booking_count
       FROM bookings b
       JOIN slots sl ON b.slot_id = sl.slot_id
       WHERE sl.activity_id = ?`,
      [id]
    );

    if (bookingCheck[0].booking_count > 0) {
      // Must use is_active instead of hard deleting
      await db.query('UPDATE activities SET is_active = FALSE WHERE activity_id = ?', [id]);
      return res.json({
        message: 'Activity deactivated because past or current bookings exist',
        is_active: false,
      });
    }

    // Check if any slots exist (even without bookings)
    const [slotCheck] = await db.query('SELECT COUNT(*) AS slot_count FROM slots WHERE activity_id = ?', [id]);
    if (slotCheck[0].slot_count > 0) {
      await db.query('UPDATE activities SET is_active = FALSE WHERE activity_id = ?', [id]);
      return res.json({
        message: 'Activity deactivated because scheduled slots exist',
        is_active: false,
      });
    }

    // No slots, safe to delete completely
    await db.query('DELETE FROM activities WHERE activity_id = ?', [id]);
    return res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GUIDES CRUD
// ══════════════════════════════════════════════════════════════════════════════

exports.getGuides = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id } = req.query;

    let query = `
      SELECT 
        g.guide_id,
        g.sanctuary_id,
        s.name AS sanctuary_name,
        g.name,
        g.phone,
        g.experience,
        (SELECT COUNT(*) FROM slots sl WHERE sl.guide_id = g.guide_id) AS total_slots
      FROM guides g
      JOIN sanctuaries s ON g.sanctuary_id = s.sanctuary_id
      WHERE s.admin_id = ?
    `;
    const params = [adminId];

    if (sanctuary_id) {
      query += ' AND g.sanctuary_id = ?';
      params.push(sanctuary_id);
    }

    query += ' ORDER BY g.name ASC';

    const [guides] = await db.query(query, params);
    return res.json({ guides });
  } catch (err) {
    next(err);
  }
};

exports.createGuide = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id, name, phone, experience } = req.body;

    if (!sanctuary_id || !name || !phone) {
      return res.status(400).json({ error: 'Sanctuary ID, guide name, and phone number are required' });
    }

    const exp = experience !== undefined ? parseInt(experience, 10) : 0;
    if (isNaN(exp) || exp < 0) {
      return res.status(400).json({ error: 'Experience years cannot be negative' });
    }

    await verifySanctuaryOwnership(sanctuary_id, adminId);

    const [result] = await db.query(
      'INSERT INTO guides (sanctuary_id, name, phone, experience) VALUES (?, ?, ?, ?)',
      [sanctuary_id, name.trim(), phone.trim(), exp]
    );

    return res.status(201).json({
      message: 'Guide registered successfully',
      guide_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateGuide = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;
    const { name, phone, experience } = req.body;

    const [existing] = await db.query(
      `SELECT g.* FROM guides g
       JOIN sanctuaries s ON g.sanctuary_id = s.sanctuary_id
       WHERE g.guide_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Guide not found or unauthorized' });
    }

    const current = existing[0];
    const newName = name !== undefined ? name.trim() : current.name;
    const newPhone = phone !== undefined ? phone.trim() : current.phone;
    const newExp = experience !== undefined ? parseInt(experience, 10) : current.experience;

    if (!newName || !newPhone) {
      return res.status(400).json({ error: 'Name and phone cannot be empty' });
    }
    if (isNaN(newExp) || newExp < 0) {
      return res.status(400).json({ error: 'Experience cannot be negative' });
    }

    await db.query(
      'UPDATE guides SET name = ?, phone = ?, experience = ? WHERE guide_id = ?',
      [newName, newPhone, newExp, id]
    );

    return res.json({ message: 'Guide updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteGuide = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;

    const [existing] = await db.query(
      `SELECT g.* FROM guides g
       JOIN sanctuaries s ON g.sanctuary_id = s.sanctuary_id
       WHERE g.guide_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Guide not found or unauthorized' });
    }

    // Check if assigned to any slots
    const [slots] = await db.query('SELECT COUNT(*) AS slot_count FROM slots WHERE guide_id = ?', [id]);
    if (slots[0].slot_count > 0) {
      return res.status(400).json({
        error: 'Cannot delete guide assigned to scheduled slots. Please reassign or remove the slots first.',
      });
    }

    await db.query('DELETE FROM guides WHERE guide_id = ?', [id]);
    return res.json({ message: 'Guide deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// VEHICLES CRUD
// ══════════════════════════════════════════════════════════════════════════════

exports.getVehicles = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id } = req.query;

    let query = `
      SELECT 
        v.vehicle_id,
        v.sanctuary_id,
        s.name AS sanctuary_name,
        v.vehicle_type,
        v.capacity,
        (SELECT COUNT(*) FROM slots sl WHERE sl.vehicle_id = v.vehicle_id) AS total_slots
      FROM vehicles v
      JOIN sanctuaries s ON v.sanctuary_id = s.sanctuary_id
      WHERE s.admin_id = ?
    `;
    const params = [adminId];

    if (sanctuary_id) {
      query += ' AND v.sanctuary_id = ?';
      params.push(sanctuary_id);
    }

    query += ' ORDER BY v.vehicle_type ASC';

    const [vehicles] = await db.query(query, params);
    return res.json({ vehicles });
  } catch (err) {
    next(err);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { sanctuary_id, vehicle_type, capacity } = req.body;

    if (!sanctuary_id || !vehicle_type || capacity === undefined) {
      return res.status(400).json({ error: 'Sanctuary ID, vehicle type, and capacity are required' });
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({ error: 'Vehicle capacity must be greater than 0' });
    }

    await verifySanctuaryOwnership(sanctuary_id, adminId);

    const [result] = await db.query(
      'INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity) VALUES (?, ?, ?)',
      [sanctuary_id, vehicle_type.trim(), cap]
    );

    return res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;
    const { vehicle_type, capacity } = req.body;

    const [existing] = await db.query(
      `SELECT v.* FROM vehicles v
       JOIN sanctuaries s ON v.sanctuary_id = s.sanctuary_id
       WHERE v.vehicle_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    const current = existing[0];
    const newType = vehicle_type !== undefined ? vehicle_type.trim() : current.vehicle_type;
    const newCap = capacity !== undefined ? parseInt(capacity, 10) : current.capacity;

    if (!newType) {
      return res.status(400).json({ error: 'Vehicle type cannot be empty' });
    }
    if (isNaN(newCap) || newCap <= 0) {
      return res.status(400).json({ error: 'Vehicle capacity must be greater than 0' });
    }

    // Check if lowering capacity below any existing slot capacity
    const [violatingSlots] = await db.query(
      'SELECT slot_id, capacity FROM slots WHERE vehicle_id = ? AND capacity > ?',
      [id, newCap]
    );
    if (violatingSlots.length > 0) {
      return res.status(400).json({
        error: `Cannot reduce vehicle capacity to ${newCap} because existing slot #${violatingSlots[0].slot_id} has capacity ${violatingSlots[0].capacity}`,
      });
    }

    await db.query(
      'UPDATE vehicles SET vehicle_type = ?, capacity = ? WHERE vehicle_id = ?',
      [newType, newCap, id]
    );

    return res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const adminId = req.user.user_id;
    const { id } = req.params;

    const [existing] = await db.query(
      `SELECT v.* FROM vehicles v
       JOIN sanctuaries s ON v.sanctuary_id = s.sanctuary_id
       WHERE v.vehicle_id = ? AND s.admin_id = ?`,
      [id, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    // Check if vehicle is used in any slots
    const [slots] = await db.query('SELECT COUNT(*) AS slot_count FROM slots WHERE vehicle_id = ?', [id]);
    if (slots[0].slot_count > 0) {
      return res.status(400).json({
        error: 'Cannot delete vehicle assigned to scheduled slots. Please remove or reassign the slots first.',
      });
    }

    await db.query('DELETE FROM vehicles WHERE vehicle_id = ?', [id]);
    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};
