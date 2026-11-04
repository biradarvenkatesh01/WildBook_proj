'use strict';
const express = require('express');
const router = express.Router();

const adminSanctuaryController = require('../controllers/adminSanctuaryController');
const adminOperationsController = require('../controllers/adminOperationsController');
const adminSlotController = require('../controllers/adminSlotController');
const adminBookingController = require('../controllers/adminBookingController');
const adminStatsController = require('../controllers/adminStatsController');

const authRequired = require('../middleware/auth');
const { requireRole, requireApprovedAdmin } = require('../middleware/role');
const { sanctuaryUpload } = require('../middleware/sanctuaryUpload');

// Enforce authentication, role ADMIN, and APPROVED account status on all admin routes
router.use(authRequired);
router.use(requireRole('ADMIN'));
router.use(requireApprovedAdmin);

// ── Dashboard Stats & Analytics ───────────────────────────────────────────────
router.get('/stats', adminStatsController.getAdminStats);
router.get('/reports', adminStatsController.getAdminReports);

// ── Bookings & Attendee Management ────────────────────────────────────────────
router.get('/bookings/export', adminBookingController.exportAdminBookings);
router.get('/bookings', adminBookingController.getAdminBookings);
router.get('/bookings/:id', adminBookingController.getAdminBookingDetail);

// ── Sanctuaries CRUD (Draft & Management) ─────────────────────────────────────
router.get('/sanctuaries', adminSanctuaryController.getSanctuaries);
router.post('/sanctuaries', adminSanctuaryController.createSanctuary);
router.get('/sanctuaries/:id', adminSanctuaryController.getSanctuaryById);
router.put('/sanctuaries/:id', adminSanctuaryController.updateSanctuary);
router.post('/sanctuaries/:id/submit', adminSanctuaryController.submitSanctuary);
router.post('/sanctuaries/:id/auto-prerequisites', adminSanctuaryController.autoPrerequisites);

// ── Images Management (Multer, cover star, sort order, deletion) ──────────────
router.post(
  '/sanctuaries/:id/images',
  sanctuaryUpload.array('images', 10),
  adminSanctuaryController.uploadSanctuaryImages
);
router.patch('/sanctuaries/:id/images/:imageId', adminSanctuaryController.updateSanctuaryImage);
router.delete('/sanctuaries/:id/images/:imageId', adminSanctuaryController.deleteSanctuaryImage);

// ── Activities CRUD ───────────────────────────────────────────────────────────
router.get('/activities', adminOperationsController.getActivities);
router.post('/activities', adminOperationsController.createActivity);
router.put('/activities/:id', adminOperationsController.updateActivity);
router.delete('/activities/:id', adminOperationsController.deleteActivity);

// ── Guides CRUD ───────────────────────────────────────────────────────────────
router.get('/guides', adminOperationsController.getGuides);
router.post('/guides', adminOperationsController.createGuide);
router.put('/guides/:id', adminOperationsController.updateGuide);
router.delete('/guides/:id', adminOperationsController.deleteGuide);

// ── Vehicles CRUD ─────────────────────────────────────────────────────────────
router.get('/vehicles', adminOperationsController.getVehicles);
router.post('/vehicles', adminOperationsController.createVehicle);
router.put('/vehicles/:id', adminOperationsController.updateVehicle);
router.delete('/vehicles/:id', adminOperationsController.deleteVehicle);

// ── Slots CRUD ────────────────────────────────────────────────────────────────
router.get('/slots', adminSlotController.getSlots);
router.get('/slots/:id', adminSlotController.getSlotById);
router.post('/slots', adminSlotController.createSlot);
router.put('/slots/:id', adminSlotController.updateSlot);
router.delete('/slots/:id', adminSlotController.deleteSlot);

module.exports = router;
