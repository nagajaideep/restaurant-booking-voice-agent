/**
 * Booking Model
 * 
 * Mongoose schema and model for restaurant table bookings.
 * Stores all booking information including customer details,
 * date/time, preferences, and weather data.
 * 
 * Schema Design:
 * - bookingId: Unique auto-generated identifier (BK + timestamp + random)
 * - customerName: Guest name (required, trimmed)
 * - numberOfGuests: Party size (1-20, required)
 * - bookingDate: Reservation date (required)
 * - bookingTime: Reservation time in 24-hour format (required)
 * - cuisinePreference: Type of cuisine (enum, required)
 * - specialRequests: Additional requests (optional, default: 'None')
 * - weatherInfo: Weather data at booking time (object, optional)
 * - seatingPreference: Indoor/Outdoor preference (enum)
 * - status: Booking status (confirmed/pending/cancelled)
 * - createdAt: Timestamp of booking creation
 * 
 * Indexes:
 * - bookingId: Unique identifier for fast lookups
 * - bookingDate: For date-based queries
 * - status: For filtering by booking status
 * 
 * @module models/Booking
 */

const mongoose = require('mongoose');

/**
 * Booking Schema Definition
 * Defines the structure and validation rules for booking documents
 */
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    default: () => `BK${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  numberOfGuests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'At least 1 guest is required'],
    max: [20, 'Maximum 20 guests allowed']
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  bookingTime: {
    type: String,
    required: [true, 'Booking time is required']
  },
  cuisinePreference: {
    type: String,
    required: [true, 'Cuisine preference is required'],
    enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Other', 'No Preference']
  },
  specialRequests: {
    type: String,
    default: 'None'
  },
  weatherInfo: {
    type: Object,
    default: {}
  },
  seatingPreference: {
    type: String,
    enum: ['Indoor', 'Outdoor', 'No Preference'],
    default: 'No Preference'
  },
  tableAssignment: {
    tableId: String,
    seating: String,
    capacity: Number
  },
  bookingDurationMinutes: {
    type: Number,
    default: 90
  },
  estimatedArrivalTime: {
    type: String,
    default: ''
  },
  prepStartTime: {
    type: String,
    default: ''
  },
  tableReadyTime: {
    type: String,
    default: ''
  },
  bookingEndTime: {
    type: String,
    default: ''
  },
  arrivalGuidance: {
    type: Object,
    default: {}
  },
  availabilitySnapshot: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
