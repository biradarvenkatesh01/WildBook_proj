'use strict';
const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// All review creation & booking context routes require authentication
router.use(authRequired);

// POST /api/reviews: Create review for past confirmed booking
router.post('/', reviewController.createReview);

// GET /api/reviews/booking/:bookingId: Pre-fill context for writing review
router.get('/booking/:bookingId', reviewController.getBookingReviewContext);

module.exports = router;
