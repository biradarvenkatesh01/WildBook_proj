'use strict';
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * authRequired middleware
 * Extracts Bearer token from Authorization header, verifies signature,
 * and attaches user record to req.user (excluding password_hash).
 */
async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'wildbook_secret_jwt_key_2026';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    // Query user to ensure account is active and get latest role/status
    const [rows] = await pool.query(
      `SELECT user_id, name, email, phone, role, account_status, profile_image, review_note, created_at 
       FROM users 
       WHERE user_id = ?`,
      [decoded.user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    const user = rows[0];

    if (user.account_status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Your account has been suspended.',
        review_note: user.review_note || null,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authRequired;
