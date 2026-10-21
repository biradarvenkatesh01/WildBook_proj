'use strict';
const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// All payment routes require authentication
router.use(authRequired);

// POST /api/payments/:bookingId/pay: Process mock payment (success or failure)
router.post('/:bookingId/pay', paymentController.processMockPayment);

module.exports = router;
