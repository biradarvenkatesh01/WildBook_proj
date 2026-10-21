'use strict';
const express = require('express');
const router = express.Router();
const sanctuaryController = require('../controllers/sanctuaryController');

// Public Sanctuary endpoints
router.get('/', sanctuaryController.getSanctuaries);
router.get('/featured', sanctuaryController.getFeaturedSanctuaries);
router.get('/:id', sanctuaryController.getSanctuaryById);
router.get('/:id/reviews', sanctuaryController.getSanctuaryReviews);

module.exports = router;
