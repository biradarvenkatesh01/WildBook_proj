'use strict';
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

// ── 1. GET /api/owner/admins ──────────────────────────────────────────────────
// Returns paginated list of admin applications with search, sort, filter, and tab counts
async function getAdmins(req, res, next) {
  try {
    const {
      status = 'ALL',
      search = '',
      sort = 'submitted_desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // 1. Fetch tab counts (ALL, PENDING, APPROVED, REJECTED, SUSPENDED)
    const [countRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_all,
        SUM(CASE WHEN account_status = 'PENDING' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN account_status = 'APPROVED' THEN 1 ELSE 0 END) AS total_approved,
        SUM(CASE WHEN account_status = 'REJECTED' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN account_status = 'SUSPENDED' THEN 1 ELSE 0 END) AS total_suspended
       FROM users
       WHERE role = 'ADMIN'`
    );

    const counts = {
      all: Number(countRows[0].total_all || 0),
      pending: Number(countRows[0].total_pending || 0),
      approved: Number(countRows[0].total_approved || 0),
      rejected: Number(countRows[0].total_rejected || 0),
      suspended: Number(countRows[0].total_suspended || 0),
    };

    // 2. Build filtered query
    const whereClauses = ["u.role = 'ADMIN'"];
    const params = [];

    if (status && status.toUpperCase() !== 'ALL') {
      whereClauses.push('u.account_status = ?');
      params.push(status.toUpperCase());
    }

    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push(
        '(u.name LIKE ? OR u.email LIKE ? OR ap.organisation_name LIKE ? OR ap.license_number LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 3. Sorting
    let orderBySql = 'ORDER BY u.created_at DESC';
    switch (sort) {
      case 'submitted_asc':
        orderBySql = 'ORDER BY u.created_at ASC';
        break;
      case 'name_asc':
        orderBySql = 'ORDER BY u.name ASC';
        break;
      case 'name_desc':
        orderBySql = 'ORDER BY u.name DESC';
        break;
      case 'org_asc':
        orderBySql = 'ORDER BY ap.organisation_name ASC';
        break;
      case 'org_desc':
        orderBySql = 'ORDER BY ap.organisation_name DESC';
        break;
      case 'status_asc':
        orderBySql = 'ORDER BY u.account_status ASC';
        break;
      default:
        orderBySql = 'ORDER BY u.created_at DESC';
    }

    // 4. Get total matching items
    const [totalMatchingRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       ${whereSql}`,
      params
    );
    const totalMatching = totalMatchingRows[0].total || 0;

    // 5. Query page items
    const queryParams = [...params, limitNum, offset];
    const [rows] = await pool.query(
      `SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.account_status,
        u.review_note,
        u.reviewed_at,
        u.created_at,
        ap.organisation_name,
        ap.license_number,
        ap.designation,
        ap.registered_address,
        ap.website,
        ((ap.license_doc IS NOT NULL) + (ap.identity_doc IS NOT NULL) + (ap.auth_letter_doc IS NOT NULL)) AS document_count
       FROM users u
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       ${whereSql}
       ${orderBySql}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    return res.status(200).json({
      admins: rows,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalMatching / limitNum) || 1,
      },
      counts,
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. GET /api/owner/admins/:id ──────────────────────────────────────────────
// Returns full profile and uploaded documents for a specific administrator
async function getAdminById(req, res, next) {
  try {
    const adminId = parseInt(req.params.id, 10);
    if (!adminId) {
      return res.status(400).json({ error: 'Invalid admin ID' });
    }

    const [users] = await pool.query(
      `SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.account_status,
        u.reviewed_by,
        u.reviewed_at,
        u.review_note,
        u.created_at,
        reviewer.name AS reviewer_name,
        ap.organisation_name,
        ap.license_number,
        ap.designation,
        ap.registered_address,
        ap.website,
        ap.license_doc,
        ap.identity_doc,
        ap.auth_letter_doc
       FROM users u
       LEFT JOIN admin_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN users reviewer ON u.reviewed_by = reviewer.user_id
       WHERE u.user_id = ? AND u.role = 'ADMIN'`,
      [adminId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Admin application not found' });
    }

    const admin = users[0];

    // Fetch documents from admin_profiles
    const docItems = [
      { docId: 1, doc_type: 'LICENSE_PROOF', file_path: admin.license_doc },
      { docId: 2, doc_type: 'IDENTITY_PROOF', file_path: admin.identity_doc },
      { docId: 3, doc_type: 'AUTHORIZATION_LETTER', file_path: admin.auth_letter_doc },
    ].filter(d => d.file_path);

    // Compute document file sizes
    const docsWithMeta = docItems.map((doc) => {
      let sizeBytes = 0;
      let filename = path.basename(doc.file_path);
      try {
        const fullPath = path.resolve(__dirname, '..', doc.file_path);
        if (fs.existsSync(fullPath)) {
          sizeBytes = fs.statSync(fullPath).size;
        }
      } catch {
        sizeBytes = 0;
      }
      return {
        document_id: doc.docId,
        admin_id: adminId,
        doc_type: doc.doc_type,
        file_path: doc.file_path,
        uploaded_at: admin.created_at,
        filename,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
      };
    });

    return res.status(200).json({
      admin: {
        ...admin,
        documents: docsWithMeta,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── 3. GET /api/owner/admins/:id/documents/:docId ─────────────────────────────
// Streams the document securely to the owner only
async function streamDocument(req, res, next) {
  try {
    const adminId = parseInt(req.params.id, 10);
    const docId = parseInt(req.params.docId, 10);

    if (!adminId || !docId) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const [[prof]] = await pool.query(
      `SELECT license_doc, identity_doc, auth_letter_doc
       FROM admin_profiles
       WHERE user_id = ?`,
      [adminId]
    );

    if (!prof) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    let filePath = null;
    if (docId === 1) filePath = prof.license_doc;
    else if (docId === 2) filePath = prof.identity_doc;
    else if (docId === 3) filePath = prof.auth_letter_doc;

    if (!filePath) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const fullPath = path.resolve(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Document file missing on server' });
    }

    const ext = path.extname(doc.file_path).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.doc_type}_${path.basename(doc.file_path)}"`);

    return res.sendFile(fullPath);
  } catch (err) {
    next(err);
  }
}

// ── 4. PATCH /api/owner/admins/:id ────────────────────────────────────────────
// Approves, rejects, or suspends an admin application
async function updateAdminStatus(req, res, next) {
  try {
    const adminId = parseInt(req.params.id, 10);
    const { decision, note = '' } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'Invalid admin ID' });
    }

    const validDecisions = ['APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        error: `Invalid decision '${decision}'. Allowed decisions: [${validDecisions.join(', ')}]`,
      });
    }

    // A note is strictly required when rejecting an application
    if (decision === 'REJECTED' && (!note || note.trim().length === 0)) {
      return res.status(400).json({
        error: 'A review note is required when rejecting an admin application.',
      });
    }

    // Verify admin exists
    const [check] = await pool.query(
      "SELECT user_id, name, email, account_status FROM users WHERE user_id = ? AND role = 'ADMIN'",
      [adminId]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const reviewerId = req.user.user_id;

    await pool.query(
      `UPDATE users 
       SET account_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           review_note = ?
       WHERE user_id = ?`,
      [decision, reviewerId, note ? note.trim() : null, adminId]
    );

    // When approving an operator account, automatically approve any pending sanctuary belonging to them and provision demo slots
    if (decision === 'APPROVED') {
      const [pendingSancs] = await pool.query(
        'SELECT sanctuary_id FROM sanctuaries WHERE admin_id = ? AND listing_status = "PENDING"',
        [adminId]
      );

      for (const s of pendingSancs) {
        const [actRows] = await pool.query(
          'SELECT activity_id FROM activities WHERE sanctuary_id = ? AND is_active = TRUE LIMIT 1',
          [s.sanctuary_id]
        );
        const [guideRows] = await pool.query(
          'SELECT guide_id FROM guides WHERE sanctuary_id = ? LIMIT 1',
          [s.sanctuary_id]
        );
        const [vehRows] = await pool.query(
          'SELECT vehicle_id FROM vehicles WHERE sanctuary_id = ? LIMIT 1',
          [s.sanctuary_id]
        );

        if (actRows.length > 0 && guideRows.length > 0 && vehRows.length > 0) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 5);
          const slotDateStr = futureDate.toISOString().slice(0, 10);
          await pool.query(
            `INSERT INTO slots (activity_id, guide_id, vehicle_id, slot_date, slot_time, capacity, is_active)
             VALUES (?, ?, ?, ?, '06:30:00', 6, TRUE)`,
            [actRows[0].activity_id, guideRows[0].guide_id, vehRows[0].vehicle_id, slotDateStr]
          );
        }
      }

      await pool.query(
        `UPDATE sanctuaries 
         SET listing_status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_note = ?
         WHERE admin_id = ? AND listing_status = 'PENDING'`,
        [reviewerId, note ? note.trim() : 'Operator application approved', adminId]
      );
    }

    return res.status(200).json({
      message: `Admin account has been ${decision.toLowerCase()}.`,
      admin_id: adminId,
      account_status: decision,
      reviewed_by: reviewerId,
      review_note: note ? note.trim() : null,
      reviewed_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = {
  getAdmins,
  getAdminById,
  streamDocument,
  updateAdminStatus,
};
