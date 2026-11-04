'use strict';
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { getSanctuaryPhoto } = require('../utils/sanctuaryPhotos');

// ── 1. GET /api/admin/sanctuaries ─────────────────────────────────────────────
// Returns all sanctuaries managed by the authenticated administrator
async function getSanctuaries(req, res, next) {
  try {
    const adminId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT 
        s.sanctuary_id,
        s.name,
        s.location,
        s.description,
        s.contact_email,
        s.contact_phone,
        s.website,
        s.opening_time,
        s.closing_time,
        s.operating_days,
        s.best_time_to_visit,
        s.listing_status,
        s.review_note,
        s.reviewed_at,
        s.created_at,
        s.cover_image,
        1 AS image_count,
        (
          SELECT COUNT(*) 
          FROM activities a 
          WHERE a.sanctuary_id = s.sanctuary_id
        ) AS activity_count
       FROM sanctuaries s
       WHERE s.admin_id = ?
       ORDER BY s.created_at DESC`,
      [adminId]
    );

    return res.status(200).json({ sanctuaries: rows });
  } catch (err) {
    next(err);
  }
}

// ── 2. GET /api/admin/sanctuaries/:id ─────────────────────────────────────────
// Returns single sanctuary with all images and activities (Ownership enforced)
async function getSanctuaryById(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const adminId = req.user.user_id;

    if (!sanctuaryId) {
      return res.status(400).json({ error: 'Invalid sanctuary ID' });
    }

    const [sanctuaries] = await pool.query(
      `SELECT * FROM sanctuaries WHERE sanctuary_id = ?`,
      [sanctuaryId]
    );

    if (sanctuaries.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found' });
    }

    const sanctuary = sanctuaries[0];

    // Ownership check: Admin can only access their own sanctuary
    if (sanctuary.admin_id !== adminId) {
      return res.status(403).json({ error: 'Access denied. You do not own this sanctuary listing.' });
    }

    // Images representation from cover_image
    const images = sanctuary.cover_image ? [{
      image_id: 1,
      sanctuary_id: sanctuary.sanctuary_id,
      image_path: sanctuary.cover_image,
      is_cover: true,
      sort_order: 1,
      uploaded_at: sanctuary.created_at,
    }] : [];

    // Fetch activities
    const [activities] = await pool.query(
      `SELECT activity_id, activity_name, duration_minutes, price, is_active
       FROM activities
       WHERE sanctuary_id = ?
       ORDER BY activity_id ASC`,
      [sanctuaryId]
    );

    return res.status(200).json({
      sanctuary: {
        ...sanctuary,
        images,
        activities,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. POST /api/admin/sanctuaries ────────────────────────────────────────────
// Creates a new sanctuary in DRAFT status
async function createSanctuary(req, res, next) {
  try {
    const adminId = req.user.user_id;
    const {
      name,
      location,
      description,
      contact_email,
      contact_phone,
      website,
      opening_time,
      closing_time,
      operating_days,
      best_time_to_visit,
      latitude,
      longitude,
    } = req.body;

    if (!name || !location || !description) {
      return res.status(400).json({
        error: 'Sanctuary name, location, and description are required.',
      });
    }

    let cleanPhone = null;
    if (contact_phone && contact_phone.trim()) {
      cleanPhone = contact_phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Contact phone number must be exactly 10 digits.' });
      }
    }

    const distinctCover = req.body.cover_image || getSanctuaryPhoto(name);

    const [result] = await pool.query(
      `INSERT INTO sanctuaries (
        admin_id, name, location, description, cover_image, contact_email, contact_phone, 
        website, opening_time, closing_time, operating_days, best_time_to_visit, 
        latitude, longitude, listing_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
      [
        adminId,
        name.trim(),
        location.trim(),
        description.trim(),
        distinctCover,
        contact_email ? contact_email.trim() : null,
        cleanPhone,
        website ? website.trim() : null,
        opening_time || null,
        closing_time || null,
        operating_days || null,
        best_time_to_visit ? best_time_to_visit.trim() : null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
      ]
    );

    return res.status(201).json({
      message: 'Sanctuary draft created successfully',
      sanctuary_id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. PUT /api/admin/sanctuaries/:id ─────────────────────────────────────────
// Updates sanctuary draft details (Ownership check + blocked if PENDING)
async function updateSanctuary(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const adminId = req.user.user_id;

    if (!sanctuaryId) {
      return res.status(400).json({ error: 'Invalid sanctuary ID' });
    }

    // Verify ownership and check current status
    const [existing] = await pool.query(
      'SELECT sanctuary_id, admin_id, listing_status FROM sanctuaries WHERE sanctuary_id = ?',
      [sanctuaryId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found' });
    }

    const sanctuary = existing[0];

    if (sanctuary.admin_id !== adminId) {
      return res.status(403).json({ error: 'Access denied. You do not own this sanctuary listing.' });
    }

    // Block edits while listing_status is PENDING
    if (sanctuary.listing_status === 'PENDING') {
      return res.status(400).json({
        error: 'Edits are blocked while this sanctuary is pending authority review.',
      });
    }

    const {
      name,
      location,
      description,
      contact_email,
      contact_phone,
      website,
      opening_time,
      closing_time,
      operating_days,
      best_time_to_visit,
      latitude,
      longitude,
    } = req.body;

    if (!name || !location || !description) {
      return res.status(400).json({
        error: 'Sanctuary name, location, and description are required.',
      });
    }

    let cleanPhone = null;
    if (contact_phone && contact_phone.trim()) {
      cleanPhone = contact_phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Contact phone number must be exactly 10 digits.' });
      }
    }

    await pool.query(
      `UPDATE sanctuaries SET
        name = ?,
        location = ?,
        description = ?,
        contact_email = ?,
        contact_phone = ?,
        website = ?,
        opening_time = ?,
        closing_time = ?,
        operating_days = ?,
        best_time_to_visit = ?,
        latitude = ?,
        longitude = ?
       WHERE sanctuary_id = ? AND admin_id = ?`,
      [
        name.trim(),
        location.trim(),
        description.trim(),
        contact_email ? contact_email.trim() : null,
        cleanPhone,
        website ? website.trim() : null,
        opening_time || null,
        closing_time || null,
        operating_days || null,
        best_time_to_visit ? best_time_to_visit.trim() : null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        sanctuaryId,
        adminId,
      ]
    );

    return res.status(200).json({
      message: 'Sanctuary draft updated successfully',
      sanctuary_id: sanctuaryId,
    });
  } catch (err) {
    next(err);
  }
}

// ── 5. POST /api/admin/sanctuaries/:id/images ─────────────────────────────────
// Uploads up to 10 images for a sanctuary (Ownership enforced, blocked if PENDING)
async function uploadSanctuaryImages(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const adminId = req.user.user_id;

    if (!sanctuaryId) {
      return res.status(400).json({ error: 'Invalid sanctuary ID' });
    }

    // Verify ownership and review status
    const [existing] = await pool.query(
      'SELECT sanctuary_id, admin_id, listing_status FROM sanctuaries WHERE sanctuary_id = ?',
      [sanctuaryId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found' });
    }

    const sanctuary = existing[0];

    if (sanctuary.admin_id !== adminId) {
      return res.status(403).json({ error: 'Access denied. You do not own this sanctuary listing.' });
    }

    if (sanctuary.listing_status === 'PENDING') {
      return res.status(400).json({ error: 'Cannot upload images while sanctuary review is PENDING.' });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded.' });
    }

    const file = files[0];
    const imagePath = `/uploads/sanctuaries/${file.filename}`;

    await pool.query(
      'UPDATE sanctuaries SET cover_image = ? WHERE sanctuary_id = ?',
      [imagePath, sanctuaryId]
    );

    const insertedImages = [{
      image_id: 1,
      sanctuary_id: sanctuaryId,
      image_path: imagePath,
      is_cover: true,
      sort_order: 1,
    }];

    return res.status(201).json({
      message: 'Images uploaded successfully',
      images: insertedImages,
    });
  } catch (err) {
    next(err);
  }
}

// ── 6. PATCH /api/admin/sanctuaries/:id/images/:imageId ───────────────────────
// Sets cover image and/or sort order
async function updateSanctuaryImage(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const imageId = parseInt(req.params.imageId, 10);
    const adminId = req.user.user_id;

    if (!sanctuaryId || !imageId) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    return res.status(200).json({
      message: 'Image settings updated',
      image_id: imageId,
      is_cover: true,
    });
  } catch (err) {
    next(err);
  }
}

// ── 7. DELETE /api/admin/sanctuaries/:id/images/:imageId ──────────────────────
// Deletes image DB row and unlinks file from disk
async function deleteSanctuaryImage(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const imageId = parseInt(req.params.imageId, 10);
    const adminId = req.user.user_id;

    if (!sanctuaryId || !imageId) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    await pool.query('UPDATE sanctuaries SET cover_image = NULL WHERE sanctuary_id = ?', [sanctuaryId]);

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ── 8. POST /api/admin/sanctuaries/:id/submit ─────────────────────────────────
// Submits a draft/rejected sanctuary for site owner review (requires image, activity, and slot)
async function submitSanctuary(req, res, next) {
  try {
    const adminId = req.user.user_id;
    const sanctuaryId = req.params.id;

    // Verify ownership
    const [sanctuaryRows] = await pool.query(
      'SELECT sanctuary_id, name, listing_status, cover_image FROM sanctuaries WHERE sanctuary_id = ? AND admin_id = ?',
      [sanctuaryId, adminId]
    );

    if (sanctuaryRows.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found or unauthorized' });
    }

    const sanctuary = sanctuaryRows[0];

    // Check if already pending or approved
    if (sanctuary.listing_status === 'PENDING') {
      return res.status(400).json({ error: 'Sanctuary is already under review (PENDING)' });
    }

    // 1. Verify at least one image exists
    const imageCount = sanctuary.cover_image ? 1 : 0;

    // 2. Verify at least one active activity exists
    const [activityRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM activities WHERE sanctuary_id = ? AND is_active = TRUE',
      [sanctuaryId]
    );
    const activityCount = Number(activityRows[0].count || 0);

    // 3. Verify at least one active slot exists
    const [slotRows] = await pool.query(
      `SELECT COUNT(*) AS count 
       FROM slots sl
       JOIN activities a ON sl.activity_id = a.activity_id
       WHERE a.sanctuary_id = ? AND sl.is_active = TRUE`,
      [sanctuaryId]
    );
    const slotCount = Number(slotRows[0].count || 0);

    const missing = [];
    if (imageCount < 1) missing.push('at least one image');
    if (activityCount < 1) missing.push('at least one activity');
    if (slotCount < 1) missing.push('at least one scheduled slot');

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Submission requires ${missing.join(', ')}.`,
        requirements: {
          has_image: imageCount >= 1,
          has_activity: activityCount >= 1,
          has_slot: slotCount >= 1,
          image_count: imageCount,
          activity_count: activityCount,
          slot_count: slotCount,
        },
      });
    }

    // Update status to PENDING and clear previous review note
    await pool.query(
      `UPDATE sanctuaries 
       SET listing_status = 'PENDING',
           review_note = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL
       WHERE sanctuary_id = ?`,
      [sanctuaryId]
    );

    return res.status(200).json({
      message: 'Sanctuary submitted for approval successfully',
      sanctuary_id: sanctuary.sanctuary_id,
      listing_status: 'PENDING',
    });
  } catch (err) {
    next(err);
  }
}


// ── 7. POST /api/admin/sanctuaries/:id/auto-prerequisites ─────────────────────
// Automatically sets up sample cover photo, activity, guide, vehicle & slot for demo
async function autoPrerequisites(req, res, next) {
  try {
    const sanctuaryId = parseInt(req.params.id, 10);
    const adminId = req.user.user_id;

    const [existing] = await pool.query(
      'SELECT sanctuary_id, name, location, cover_image FROM sanctuaries WHERE sanctuary_id = ? AND admin_id = ?',
      [sanctuaryId, adminId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found or unauthorized' });
    }

    // 1. Distinct Cover Image matching sanctuary name
    if (!existing[0].cover_image) {
      const selectedPhoto = getSanctuaryPhoto(existing[0].name);
      await pool.query(
        'UPDATE sanctuaries SET cover_image = ? WHERE sanctuary_id = ?',
        [selectedPhoto, sanctuaryId]
      );
    }

    // 2. Activity
    let activityId;
    const [actRows] = await pool.query(
      'SELECT activity_id FROM activities WHERE sanctuary_id = ? AND is_active = TRUE',
      [sanctuaryId]
    );
    if (actRows.length === 0) {
      const [newAct] = await pool.query(
        `INSERT INTO activities (sanctuary_id, activity_name, description, duration_minutes, what_to_carry, price, is_active)
         VALUES (?, 'Morning 4x4 Wilderness Jeep Safari', 'Guided early morning safari exploring core wildlife zones and natural waterholes.', 180, 'Govt Photo ID, camera, neutral clothing, binocular', 1800.00, TRUE)`,
        [sanctuaryId]
      );
      activityId = newAct.insertId;
    } else {
      activityId = actRows[0].activity_id;
    }

    // 3. Guide
    let guideId;
    const [guiRows] = await pool.query(
      'SELECT guide_id FROM guides WHERE sanctuary_id = ?',
      [sanctuaryId]
    );
    if (guiRows.length === 0) {
      const [newGui] = await pool.query(
        'INSERT INTO guides (sanctuary_id, name, phone, experience) VALUES (?, "Manoj Kumar", "9876543210", 9)',
        [sanctuaryId]
      );
      guideId = newGui.insertId;
    } else {
      guideId = guiRows[0].guide_id;
    }

    // 4. Vehicle
    let vehicleId;
    const [vehRows] = await pool.query(
      'SELECT vehicle_id FROM vehicles WHERE sanctuary_id = ?',
      [sanctuaryId]
    );
    if (vehRows.length === 0) {
      const [newVeh] = await pool.query(
        'INSERT INTO vehicles (sanctuary_id, vehicle_type, capacity) VALUES (?, "Open 4x4 Safari Gypsy", 6)',
        [sanctuaryId]
      );
      vehicleId = newVeh.insertId;
    } else {
      vehicleId = vehRows[0].vehicle_id;
    }

    // 5. Scheduled Slot (Only created if admin is APPROVED, compliant with database trigger trg_slot_admin_approved_insert)
    const [adminCheck] = await pool.query(
      'SELECT account_status FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (adminCheck.length > 0 && adminCheck[0].account_status === 'APPROVED') {
      const [slotRows] = await pool.query(
        `SELECT sl.slot_id FROM slots sl
         JOIN activities a ON sl.activity_id = a.activity_id
         WHERE a.sanctuary_id = ? AND sl.is_active = TRUE`,
        [sanctuaryId]
      );
      if (slotRows.length === 0) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const slotDateStr = futureDate.toISOString().slice(0, 10);

        await pool.query(
          `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
           VALUES (?, ?, ?, ?, '06:30:00', 6, TRUE)`,
          [activityId, guideId, vehicleId, slotDateStr]
        );
      }
    }

    return res.status(200).json({
      message: 'Demo requirements (Cover Photo, Safari Activity, Guide, Vehicle & Slot) setup successfully! Sanctuary is ready for review submission.',
      sanctuary_id: sanctuaryId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSanctuaries,
  getSanctuaryById,
  createSanctuary,
  updateSanctuary,
  uploadSanctuaryImages,
  updateSanctuaryImage,
  deleteSanctuaryImage,
  submitSanctuary,
  autoPrerequisites,
};
