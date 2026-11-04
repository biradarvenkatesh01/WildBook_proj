'use strict';
const express = require('express');
const router = express.Router();
const authRequired = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// All booking routes require authentication
router.use(authRequired);

// POST /api/bookings: Create new booking with 10-minute hold
router.post('/', bookingController.createBooking);

// GET /api/bookings/slot/:slotId: Retrieve slot checkout info for booking page
router.get('/slot/:slotId', bookingController.getSlotCheckoutInfo);

// GET /api/bookings/mine: Visitor bookings list with tabs (upcoming, past, cancelled)
router.get('/mine', bookingController.getMyBookings);

// GET /api/bookings/:id/cancel-preview: Cancellation fee breakdown
router.get('/:id/cancel-preview', bookingController.getCancelPreview);

// POST /api/bookings/:id/cancel: Cancel confirmed booking (supports { erase: true } or status update)
router.post('/:id/cancel', bookingController.cancelBooking);

// DELETE /api/bookings/:id: Erase booking directly from database (cascades payments, releases seats, 0 extra tables)
router.delete('/:id', bookingController.eraseBooking);

// GET /api/bookings/:id: View booking details (owner only, with remaining hold seconds)
router.get('/:id', bookingController.getBookingById);

// GET /api/bookings/:id/ticket: Download PDF ticket with QR code (CONFIRMED & caller owned only)
router.get('/:id/ticket', bookingController.getBookingTicket);

module.exports = router;
