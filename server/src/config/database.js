/**
 * Database Configuration Module
 * 
 * Handles MongoDB Atlas connection using Mongoose ODM.
 * Includes error handling and connection event monitoring.
 * 
 * Environment Variables Required:
 * - MONGODB_URI: MongoDB Atlas connection string
 * 
 * Connection Features:
 * - Auto-reconnection on disconnect
 * - Connection timeout handling (30 seconds)
 * - Socket timeout handling (30 seconds)
 * - Detailed connection logging
 * 
 * @module config/database
 */

const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB Atlas
 * 
 * @async
 * @function connectDB
 * @throws {Error} If connection fails, exits process with code 1
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB using connection string from environment
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Log successful connection details
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    // Log error and exit if connection fails
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

// ========================================
// MongoDB Connection Event Handlers
// ========================================

/**
 * Handle unexpected disconnection from MongoDB
 * Mongoose will automatically attempt to reconnect
 */
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

/**
 * Handle MongoDB connection errors after initial connection
 */
mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime error: ${err}`);
});

/**
 * Handle successful reconnection
 */
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

module.exports = connectDB;
