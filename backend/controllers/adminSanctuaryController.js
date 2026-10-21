'use strict';
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

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
        (
          SELECT si.image_path 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = s.sanctuary_id 
          ORDER BY si.is_cover DESC, si.sort_order ASC, si.image_id ASC 
          LIMIT 1
        ) AS cover_image,
        (
          SELECT COUNT(*) 
          FROM sanctuary_images si 
          WHERE si.sanctuary_id = s.sanctuary_id
        ) AS image_count,
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

    // Fetch images
    const [images] = await pool.query(
      `SELECT image_id, sanctuary_id, image_path, is_cover, sort_order, uploaded_at
       FROM sanctuary_images
       WHERE sanctuary_id = ?
       ORDER BY is_cover DESC, sort_order ASC, image_id ASC`,
      [sanctuaryId]
    );

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

    const [result] = await pool.query(
      `INSERT INTO sanctuaries (
        admin_id, name, location, description, contact_email, contact_phone, 
        website, opening_time, closing_time, operating_days, best_time_to_visit, 
        latitude, longitude, listing_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
      [
        adminId,
        name.trim(),
        location.trim(),
        description.trim(),
        contact_email ? contact_email.trim() : null,
        contact_phone ? contact_phone.trim() : null,
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
        contact_phone ? contact_phone.trim() : null,
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

    // Check current count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM sanctuary_images WHERE sanctuary_id = ?',
      [sanctuaryId]
    );
    const currentCount = countRows[0].total || 0;

    if (currentCount + files.length > 10) {
      return res.status(400).json({
        error: `Upload exceeds maximum limit of 10 images. Currently: ${currentCount}, Uploading: ${files.length}.`,
      });
    }

    const insertedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imagePath = `/uploads/sanctuaries/${file.filename}`;
      // First image of a sanctuary defaults to cover
      const isCover = currentCount === 0 && i === 0;
      const sortOrder = currentCount + i + 1;

      const [resInsert] = await pool.query(
        `INSERT INTO sanctuary_images (sanctuary_id, image_path, is_cover, sort_order)
         VALUES (?, ?, ?, ?)`,
        [sanctuaryId, imagePath, isCover, sortOrder]
      );

      insertedImages.push({
        image_id: resInsert.insertId,
        sanctuary_id: sanctuaryId,
        image_path: imagePath,
        is_cover: isCover,
        sort_order: sortOrder,
      });
    }

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

    // Check ownership
    const [check] = await pool.query(
      'SELECT s.sanctuary_id, s.admin_id, s.listing_status FROM sanctuaries s WHERE s.sanctuary_id = ?',
      [sanctuaryId]
    );
    if (check.length === 0 || check[0].admin_id !== adminId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (check[0].listing_status === 'PENDING') {
      return res.status(400).json({ error: 'Edits blocked while review is PENDING' });
    }

    const { is_cover, sort_order } = req.body;

    if (is_cover === true) {
      // Unset all other covers for this sanctuary, then set this one
      await pool.query('UPDATE sanctuary_images SET is_cover = FALSE WHERE sanctuary_id = ?', [
        sanctuaryId,
      ]);
      await pool.query(
        'UPDATE sanctuary_images SET is_cover = TRUE WHERE image_id = ? AND sanctuary_id = ?',
        [imageId, sanctuaryId]
      );
    }

    if (typeof sort_order === 'number') {
      await pool.query(
        'UPDATE sanctuary_images SET sort_order = ? WHERE image_id = ? AND sanctuary_id = ?',
        [sort_order, imageId, sanctuaryId]
      );
    }

    return res.status(200).json({
      message: 'Image settings updated',
      image_id: imageId,
      is_cover: !!is_cover,
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

    // Check ownership
    const [check] = await pool.query(
      'SELECT s.sanctuary_id, s.admin_id, s.listing_status FROM sanctuaries s WHERE s.sanctuary_id = ?',
      [sanctuaryId]
    );
    if (check.length === 0 || check[0].admin_id !== adminId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (check[0].listing_status === 'PENDING') {
      return res.status(400).json({ error: 'Deletions blocked while review is PENDING' });
    }

    const [imgRows] = await pool.query(
      'SELECT image_id, image_path, is_cover FROM sanctuary_images WHERE image_id = ? AND sanctuary_id = ?',
      [imageId, sanctuaryId]
    );

    if (imgRows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const img = imgRows[0];

    // Delete file from disk
    try {
      const fullPath = path.resolve(__dirname, '..', img.image_path.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.warn('Failed to delete image file on disk:', e.message);
    }

    // Delete from DB
    await pool.query('DELETE FROM sanctuary_images WHERE image_id = ?', [imageId]);

    // If deleted image was cover, assign cover to next remaining image
    if (img.is_cover) {
      const [remaining] = await pool.query(
        'SELECT image_id FROM sanctuary_images WHERE sanctuary_id = ? ORDER BY sort_order ASC LIMIT 1',
        [sanctuaryId]
      );
      if (remaining.length > 0) {
        await pool.query('UPDATE sanctuary_images SET is_cover = TRUE WHERE image_id = ?', [
          remaining[0].image_id,
        ]);
      }
    }

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
      'SELECT sanctuary_id, name, listing_status FROM sanctuaries WHERE sanctuary_id = ? AND admin_id = ?',
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
    const [imageRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM sanctuary_images WHERE sanctuary_id = ?',
      [sanctuaryId]
    );
    const imageCount = Number(imageRows[0].count || 0);

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

module.exports = {
  getSanctuaries,
  getSanctuaryById,
  createSanctuary,
  updateSanctuary,
  uploadSanctuaryImages,
  updateSanctuaryImage,
  deleteSanctuaryImage,
  submitSanctuary,
};
