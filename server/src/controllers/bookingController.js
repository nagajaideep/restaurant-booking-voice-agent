const Booking = require('../models/Booking');

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Public
 */
exports.createBooking = async (req, res, next) => {
  try {
    const bookingData = req.body;

    // Create booking
    const booking = await Booking.create(bookingData);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    next(error);
  }
};

/**
 * @desc    Get all bookings
 * @route   GET /api/bookings
 * @access  Public
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    // Query parameters for filtering
    const { status, date, cuisine } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) {
      const searchDate = new Date(date);
      filter.bookingDate = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }
    if (cuisine) filter.cuisinePreference = cuisine;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Public
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      bookingId: req.params.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Cancel booking
 * @route   DELETE /api/bookings/:id
 * @access  Public
 */
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
