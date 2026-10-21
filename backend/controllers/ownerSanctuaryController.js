'use strict';
const pool = require('../config/db');

// ── 1. GET /api/owner/sanctuaries ─────────────────────────────────────────────
// Returns list of sanctuaries with status tab counts, search, and operator info
async function getOwnerSanctuaries(req, res, next) {
  try {
    const { status = 'ALL', search = '', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // 1. Fetch live tab counts
    const [countRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_all,
        SUM(CASE WHEN listing_status = 'PENDING' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN listing_status = 'APPROVED' THEN 1 ELSE 0 END) AS total_approved,
        SUM(CASE WHEN listing_status = 'REJECTED' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN listing_status = 'DRAFT' THEN 1 ELSE 0 END) AS total_draft
       FROM sanctuaries`
    );

    const counts = {
      all: Number(countRows[0].total_all || 0),
      pending: Number(countRows[0].total_pending || 0),
      approved: Number(countRows[0].total_approved || 0),
      rejected: Number(countRows[0].total_rejected || 0),
      draft: Number(countRows[0].total_draft || 0),
    };

    // 2. Build filter conditions
    const whereClauses = [];
    const params = [];

    if (status && status.toUpperCase() !== 'ALL') {
      whereClauses.push('s.listing_status = ?');
      params.push(status.toUpperCase());
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      whereClauses.push(
        '(s.name LIKE ? OR s.location LIKE ? OR u.name LIKE ? OR ap.organisation_name LIKE ?)'
      );
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 3. Count matching
    const [totalMatching] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM sanctuaries s
       JOIN users u ON s.admin_id = u.user_id
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       ${whereSql}`,
      params
    );
    const totalRecords = Number(totalMatching[0].total || 0);

    // 4. Query records
    const [rows] = await pool.query(
      `SELECT 
        s.sanctuary_id,
        s.name,
        s.location,
        s.description,
        s.listing_status,
        s.review_note,
        s.reviewed_at,
        s.created_at,
        u.user_id AS admin_id,
        u.name AS admin_name,
        u.email AS admin_email,
        ap.organisation_name,
        ap.license_number,
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
        ) AS images_count,
        (
          SELECT COUNT(*) 
          FROM activities a 
          WHERE a.sanctuary_id = s.sanctuary_id AND a.is_active = TRUE
        ) AS activities_count,
        (
          SELECT COUNT(*) 
          FROM slots sl
          JOIN activities a ON sl.activity_id = a.activity_id
          WHERE a.sanctuary_id = s.sanctuary_id AND sl.is_active = TRUE
        ) AS slots_count
       FROM sanctuaries s
       JOIN users u ON s.admin_id = u.user_id
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       ${whereSql}
       ORDER BY 
         CASE WHEN s.listing_status = 'PENDING' THEN 1 ELSE 2 END,
         s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      counts,
      sanctuaries: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. GET /api/owner/sanctuaries/:id ─────────────────────────────────────────
// Returns comprehensive sanctuary submission review data (gallery, activities, slots breakdown)
async function getOwnerSanctuaryById(req, res, next) {
  try {
    const sanctuaryId = req.params.id;

    // 1. Fetch sanctuary and operator details
    const [sanctuaryRows] = await pool.query(
      `SELECT 
        s.*,
        u.user_id AS admin_id,
        u.name AS admin_name,
        u.email AS admin_email,
        u.phone AS admin_phone,
        ap.organisation_name,
        ap.license_number,
        ap.designation,
        ap.registered_address,
        rev.name AS reviewer_name
       FROM sanctuaries s
       JOIN users u ON s.admin_id = u.user_id
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN users rev ON s.reviewed_by = rev.user_id
       WHERE s.sanctuary_id = ?`,
      [sanctuaryId]
    );

    if (sanctuaryRows.length === 0) {
      return res.status(404).json({ error: 'Sanctuary submission not found' });
    }

    const sanctuary = sanctuaryRows[0];

    // 2. Fetch images gallery
    const [images] = await pool.query(
      `SELECT image_id, image_path, is_cover, sort_order, uploaded_at
       FROM sanctuary_images
       WHERE sanctuary_id = ?
       ORDER BY is_cover DESC, sort_order ASC, image_id ASC`,
      [sanctuaryId]
    );

    // 3. Fetch activities with pricing
    const [activities] = await pool.query(
      `SELECT 
        a.activity_id,
        a.activity_name,
        a.description,
        a.duration_minutes,
        a.what_to_carry,
        a.price,
        a.is_active
       FROM activities a
       WHERE a.sanctuary_id = ?
       ORDER BY a.is_active DESC, a.activity_id ASC`,
      [sanctuaryId]
    );

    // 4. Fetch slots summary per activity
    const [slotsSummary] = await pool.query(
      `SELECT 
        a.activity_id,
        a.activity_name,
        COUNT(sl.slot_id) AS total_slots,
        SUM(CASE WHEN DAYOFWEEK(sl.slot_date) BETWEEN 2 AND 6 THEN 1 ELSE 0 END) AS weekday_slots,
        SUM(CASE WHEN DAYOFWEEK(sl.slot_date) IN (1, 7) THEN 1 ELSE 0 END) AS weekend_slots
       FROM activities a
       LEFT JOIN slots sl ON a.activity_id = sl.activity_id AND sl.is_active = TRUE
       WHERE a.sanctuary_id = ?
       GROUP BY a.activity_id, a.activity_name
       ORDER BY a.activity_id ASC`,
      [sanctuaryId]
    );

    const formattedSlotsSummary = slotsSummary.map((s) => ({
      activity_id: s.activity_id,
      activity_name: s.activity_name,
      total_slots: Number(s.total_slots || 0),
      weekday_slots: Number(s.weekday_slots || 0),
      weekend_slots: Number(s.weekend_slots || 0),
      weekday_display: `${Number(s.weekday_slots || 0)} slots/week`,
      weekend_display: `${Number(s.weekend_slots || 0)} slots/week`,
    }));

    return res.status(200).json({
      sanctuary,
      images,
      activities,
      slots_summary: formattedSlotsSummary,
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. PATCH /api/owner/sanctuaries/:id ────────────────────────────────────────
// Approves or Rejects a sanctuary submission
async function updateSanctuaryStatus(req, res, next) {
  try {
    const ownerId = req.user.user_id;
    const sanctuaryId = req.params.id;
    const { decision, note } = req.body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid decision. Must be either APPROVED or REJECTED.',
      });
    }

    const newStatus = decision.toUpperCase();

    // Rejection requires feedback note
    if (newStatus === 'REJECTED' && (!note || note.trim().length === 0)) {
      return res.status(400).json({
        error: 'A review note is required when rejecting a sanctuary submission.',
      });
    }

    // Verify sanctuary exists
    const [existing] = await pool.query(
      'SELECT sanctuary_id, name, listing_status FROM sanctuaries WHERE sanctuary_id = ?',
      [sanctuaryId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found' });
    }

    const reviewNote = note ? note.trim() : null;

    await pool.query(
      `UPDATE sanctuaries 
       SET listing_status = ?,
           review_note = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE sanctuary_id = ?`,
      [newStatus, reviewNote, ownerId, sanctuaryId]
    );

    const successMessage =
      newStatus === 'APPROVED'
        ? `Sanctuary "${existing[0].name}" approved and listed successfully.`
        : `Sanctuary "${existing[0].name}" rejected with feedback note.`;

    return res.status(200).json({
      message: successMessage,
      sanctuary_id: Number(sanctuaryId),
      listing_status: newStatus,
      review_note: reviewNote,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOwnerSanctuaries,
  getOwnerSanctuaryById,
  updateSanctuaryStatus,
};
