const mongoose = require('mongoose');

/**
 * Booking Schema - Matches exact requirements
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
    enum: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Other']
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
