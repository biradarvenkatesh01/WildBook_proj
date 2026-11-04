'use strict';
const pool = require('../config/db');

// ── 1. GET /api/sanctuaries ───────────────────────────────────────────────────
// Public directory listing of approved sanctuaries with search, filters & pagination
async function getSanctuaries(req, res, next) {
  try {
    const {
      search = '',
      location = '',
      activity = '',
      rating = '',
      page = 1,
      limit = 9,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = ['1=1'];
    const params = [];

    // Search query: matches sanctuary name, location, or description
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(v.name LIKE ? OR v.location LIKE ? OR v.description LIKE ?)');
      params.push(term, term, term);
    }

    // Location filter: matches state or region
    if (location && location.trim().length > 0) {
      whereClauses.push('v.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    // Activity type filter: sanctuary offers active activity matching term
    if (activity && activity.trim().length > 0) {
      whereClauses.push(
        'EXISTS (SELECT 1 FROM activities a WHERE a.sanctuary_id = v.sanctuary_id AND a.is_active = TRUE AND a.activity_name LIKE ?)'
      );
      params.push(`%${activity.trim()}%`);
    }

    // Minimum rating filter
    if (rating && !isNaN(parseFloat(rating))) {
      whereClauses.push('v.average_rating >= ?');
      params.push(parseFloat(rating));
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Total count query
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM v_public_sanctuaries v ${whereSql}`,
      params
    );
    const totalRecords = Number(totalRows[0]?.total || 0);

    // List query with starting price
    const [rows] = await pool.query(
      `SELECT 
        v.sanctuary_id,
        v.name,
        v.location,
        v.description,
        v.cover_image,
        v.average_rating,
        v.total_reviews,
        v.operating_days,
        v.best_time_to_visit,
        (
          SELECT MIN(a.price) 
          FROM activities a 
          WHERE a.sanctuary_id = v.sanctuary_id AND a.is_active = TRUE
        ) AS starting_price
       FROM v_public_sanctuaries v
       ${whereSql}
       ORDER BY v.created_at DESC, v.average_rating DESC, v.total_reviews DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
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

// ── 2. GET /api/sanctuaries/featured ──────────────────────────────────────────
// Featured approved sanctuaries for the homepage
async function getFeaturedSanctuaries(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(12, parseInt(req.query.limit, 10) || 6));

    const [rows] = await pool.query(
      `SELECT 
        v.sanctuary_id,
        v.name,
        v.location,
        v.description,
        v.cover_image,
        v.average_rating,
        v.total_reviews,
        (
          SELECT MIN(a.price) 
          FROM activities a 
          WHERE a.sanctuary_id = v.sanctuary_id AND a.is_active = TRUE
        ) AS starting_price
       FROM v_public_sanctuaries v
       ORDER BY v.average_rating DESC, v.total_reviews DESC, v.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return res.status(200).json({ sanctuaries: rows });
  } catch (err) {
    next(err);
  }
}

// ── 3. GET /api/sanctuaries/:id ───────────────────────────────────────────────
// Detailed public view of an approved sanctuary (strictly 404 for unapproved)
async function getSanctuaryById(req, res, next) {
  try {
    const sanctuaryId = req.params.id;

    // 1. Fetch from v_public_sanctuaries view (ensures APPROVED status)
    const [sanctuaryRows] = await pool.query(
      'SELECT * FROM v_public_sanctuaries WHERE sanctuary_id = ?',
      [sanctuaryId]
    );

    if (sanctuaryRows.length === 0) {
      return res.status(404).json({ error: 'Sanctuary not found or not currently listed' });
    }

    const sanctuary = sanctuaryRows[0];

    // 2. Cover image photo gallery
    const images = sanctuary.cover_image ? [{
      image_id: 1,
      image_path: sanctuary.cover_image,
      is_cover: true,
      sort_order: 1
    }] : [];

    // 3. Fetch active activities
    const [activities] = await pool.query(
      `SELECT 
        activity_id,
        activity_name,
        description,
        duration_minutes,
        what_to_carry,
        price
       FROM activities 
       WHERE sanctuary_id = ? AND is_active = TRUE
       ORDER BY price ASC`,
      [sanctuaryId]
    );

    // 4. Ratings summary from sanctuary direct rating columns
    const avgRating = Number(sanctuary.average_rating || 5.0);
    const totalReviews = Number(sanctuary.total_reviews || 0);

    const ratingsSummary = {
      average_rating: avgRating,
      total_reviews: totalReviews,
      counts: {
        5: totalReviews,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };

    // 5. Reviews array
    const reviews = [];

    return res.status(200).json({
      sanctuary,
      images,
      activities,
      reviews,
      ratings_summary: ratingsSummary,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4. GET /api/sanctuaries/:id/reviews ────────────────────────────────────────
// Paged list of guest reviews for an approved sanctuary
async function getSanctuaryReviews(req, res, next) {
  try {
    const sanctuaryId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));

    // Verify sanctuary exists and is approved
    const [[sanctuary]] = await pool.query(
      'SELECT sanctuary_id, name, average_rating, total_reviews FROM sanctuaries WHERE sanctuary_id = ? AND listing_status = "APPROVED"',
      [sanctuaryId]
    );

    if (!sanctuary) {
      return res.status(404).json({ error: 'Sanctuary not found or not approved' });
    }

    return res.json({
      reviews: [],
      pagination: {
        page,
        limit,
        total: Number(sanctuary.total_reviews || 0),
        totalPages: 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSanctuaries,
  getFeaturedSanctuaries,
  getSanctuaryById,
  getSanctuaryReviews,
};
