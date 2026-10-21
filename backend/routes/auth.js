'use strict';
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authRequired = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { adminDocUpload } = require('../middleware/upload');

// ── Visitor routes ────────────────────────────────────────────────────────────
router.post('/user/signup', authController.userSignup);
router.post('/user/login', loginRateLimiter, authController.userLogin);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/admin/login', loginRateLimiter, authController.adminLogin);

// Admin signup requires 3 documents uploaded via multipart/form-data
router.post(
  '/admin/signup',
  adminDocUpload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'identity', maxCount: 1 },
    { name: 'authorization', maxCount: 1 },
  ]),
  authController.adminSignup
);

// ── Owner routes ──────────────────────────────────────────────────────────────
// Strictly login only — NO owner signup route!
router.post('/owner/login', loginRateLimiter, authController.ownerLogin);

// ── Current user info ─────────────────────────────────────────────────────────
router.get('/me', authRequired, authController.getMe);

module.exports = router;
