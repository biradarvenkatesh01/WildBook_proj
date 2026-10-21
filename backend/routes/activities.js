'use strict';
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// Public Activity endpoints
router.get('/:id/slots', activityController.getActivitySlots);

module.exports = router;
