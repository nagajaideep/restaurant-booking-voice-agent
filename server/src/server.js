/**
 * Restaurant Booking Voice Agent - Server Entry Point
 * 
 * This file initializes the Express server, connects to MongoDB,
 * sets up middleware, and defines API routes for the restaurant booking system.
 * 
 * Features:
 * - RESTful API for booking management (CRUD operations)
 * - Weather API integration for seating recommendations
 * - MongoDB database for persistent storage
 * - CORS enabled for frontend communication
 * 
 * @author Jaideep
 * @date December 2025
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Establish MongoDB connection
connectDB();

// ========================================
// Middleware Configuration
// ========================================

// Enable CORS for frontend communication
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ========================================
// API Routes
// ========================================

// Booking routes - Handle all booking-related operations
// POST /api/bookings - Create new booking
// GET /api/bookings - Get all bookings
// GET /api/bookings/:id - Get booking by ID
// DELETE /api/bookings/:id - Cancel booking
app.use('/api/bookings', require('./routes/bookings'));

// Weather routes - Fetch weather data and seating recommendations
// GET /api/weather?date=YYYY-MM-DD&location=City - Get weather forecast
app.use('/api/weather', require('./routes/weather'));

// ========================================
// Health Check Endpoint
// ========================================

/**
 * Health check endpoint to verify API is running
 * @route GET /api/health
 * @returns {Object} Status object with timestamp
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Restaurant Booking API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========================================
// Error Handling Middleware
// ========================================

// Global error handler - catches all errors from routes
app.use(errorHandler);

// ========================================
// Server Startup
// ========================================

/**
 * Start the Express server on configured port
 * Default port is 5000 if not specified in environment variables
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Health: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
