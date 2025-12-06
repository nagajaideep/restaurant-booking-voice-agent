const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// POST /api/bookings - Create new booking
router.post('/', bookingController.createBooking);

// GET /api/bookings - Get all bookings
router.get('/', bookingController.getAllBookings);

// GET /api/bookings/:id - Get specific booking
router.get('/:id', bookingController.getBookingById);

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
