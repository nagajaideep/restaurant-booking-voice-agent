const Booking = require('../models/Booking');
const {
  RESTAURANT_TABLES,
  checkAvailability,
  toDateKey
} = require('../services/tableManagementService');

const getBookingsForDate = async (bookingDate) => {
  const dateKey = toDateKey(bookingDate);
  if (!dateKey) {
    return [];
  }

  const searchDate = new Date(`${dateKey}T00:00:00`);

  return Booking.find({
    status: { $ne: 'cancelled' },
    bookingDate: {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    }
  });
};

/**
 * Create New Booking
 * 
 * Creates a new restaurant table booking with provided customer details,
 * date/time, preferences, and weather information.
 * 
 * @async
 * @function createBooking
 * @param {Object} req - Express request object
 * @param {Object} req.body - Booking data (customerName, numberOfGuests, bookingDate, etc.)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with created booking data
 * 
 * @route POST /api/bookings
 * @access Public
 * 
 * @example
 * POST /api/bookings
 * Body: {
 *   "customerName": "John Doe",
 *   "numberOfGuests": 4,
 *   "bookingDate": "2025-12-15",
 *   "bookingTime": "19:00",
 *   "cuisinePreference": "Indian",
 *   "seatingPreference": "Indoor"
 * }
 */
exports.createBooking = async (req, res, next) => {
  try {
    const bookingData = req.body;
    const existingBookings = await getBookingsForDate(bookingData.bookingDate);
    const availability = checkAvailability({
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
      numberOfGuests: Number(bookingData.numberOfGuests),
      seatingPreference: bookingData.seatingPreference,
      existingBookings
    });

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: availability.reason,
        data: availability
      });
    }

    const enrichedBookingData = {
      ...bookingData,
      bookingDate: availability.bookingDate,
      numberOfGuests: Number(bookingData.numberOfGuests),
      cuisinePreference: bookingData.cuisinePreference || 'No Preference',
      specialRequests: bookingData.specialRequests || 'None',
      seatingPreference: availability.tableAssignment.seating,
      tableAssignment: availability.tableAssignment,
      bookingDurationMinutes: availability.bookingDurationMinutes,
      estimatedArrivalTime: availability.arrivalGuidance.estimatedArrivalTime,
      prepStartTime: availability.arrivalGuidance.prepStartTime,
      tableReadyTime: availability.arrivalGuidance.tableReadyTime,
      bookingEndTime: availability.arrivalGuidance.bookingEndTime,
      arrivalGuidance: availability.arrivalGuidance,
      availabilitySnapshot: {
        availableTableCount: availability.availableTableCount,
        blockedTableCount: availability.blockedTableCount,
        totalTableCount: availability.totalTableCount,
        checkedAt: new Date().toISOString()
      }
    };

    // Create booking document in MongoDB
    const booking = await Booking.create(enrichedBookingData);

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

exports.checkAvailability = async (req, res, next) => {
  try {
    const { date, time, guests, seatingPreference } = req.query;
    const existingBookings = await getBookingsForDate(date);
    const availability = checkAvailability({
      bookingDate: date,
      bookingTime: time,
      numberOfGuests: Number(guests),
      seatingPreference,
      existingBookings
    });

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

exports.getRestaurantTables = async (req, res) => {
  res.status(200).json({
    success: true,
    count: RESTAURANT_TABLES.length,
    data: RESTAURANT_TABLES
  });
};

/**
 * Get All Bookings
 * 
 * Retrieves all bookings from the database with optional filtering
 * by status, date, or cuisine preference. Results are sorted by
 * creation date (most recent first).
 * 
 * @async
 * @function getAllBookings
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering
 * @param {string} [req.query.status] - Filter by status (confirmed/pending/cancelled)
 * @param {string} [req.query.date] - Filter by date (YYYY-MM-DD)
 * @param {string} [req.query.cuisine] - Filter by cuisine type
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with array of bookings
 * 
 * @route GET /api/bookings
 * @access Public
 * 
 * @example
 * GET /api/bookings?status=confirmed&date=2025-12-15
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    // Extract query parameters for filtering
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
 * Get Single Booking by ID
 * 
 * Retrieves a specific booking using its unique bookingId.
 * Returns 404 if booking is not found.
 * 
 * @async
 * @function getBookingById
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID to retrieve
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with booking data
 * 
 * @route GET /api/bookings/:id
 * @access Public
 * 
 * @example
 * GET /api/bookings/BK17650074001234
 */
exports.getBookingById = async (req, res, next) => {
  try {
    // Find booking by custom bookingId (not MongoDB _id)
    const booking = await Booking.findOne({
      bookingId: req.params.id
    });

    // Handle booking not found
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
 * Delete/Cancel Booking
 * 
 * Cancels a booking by updating its status to 'cancelled'.
 * Uses findOneAndUpdate to atomically update the booking.
 * 
 * @async
 * @function deleteBooking
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Booking ID to cancel
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with cancelled booking data
 * 
 * @route DELETE /api/bookings/:id
 * @access Public
 * 
 * @example
 * DELETE /api/bookings/BK17650074001234
 */
exports.deleteBooking = async (req, res, next) => {
  try {
    // Find and update booking status atomically
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status: 'cancelled' },
      { new: true } // Return updated document
    );

    // Handle booking not found
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Return success response with updated booking
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
