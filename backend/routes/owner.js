'use strict';
const express = require('express');
const router = express.Router();

const ownerController = require('../controllers/ownerController');
const ownerSanctuaryController = require('../controllers/ownerSanctuaryController');
const ownerStatsController = require('../controllers/ownerStatsController');
const authRequired = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All owner routes require authenticated SITE_OWNER role
router.use(authRequired);
router.use(requireRole('SITE_OWNER'));

// ── Authority Dashboard Stats & Platform Reports ──────────────────────────────
router.get('/stats', ownerStatsController.getOwnerStats);
router.get('/reports', ownerStatsController.getOwnerReports);

// ── Admin applications review ─────────────────────────────────────────────────
router.get('/admins', ownerController.getAdmins);
router.get('/admins/:id', ownerController.getAdminById);
router.get('/admins/:id/documents/:docId', ownerController.streamDocument);
router.patch('/admins/:id', ownerController.updateAdminStatus);

// ── Sanctuary submissions review & approval ───────────────────────────────────
router.get('/sanctuaries', ownerSanctuaryController.getOwnerSanctuaries);
router.get('/sanctuaries/:id', ownerSanctuaryController.getOwnerSanctuaryById);
router.patch('/sanctuaries/:id', ownerSanctuaryController.updateSanctuaryStatus);

module.exports = router;
