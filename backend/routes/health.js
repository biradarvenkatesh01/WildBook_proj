'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/health
// Runs SELECT 1 to verify DB connectivity
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      db: rows[0].ok === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
