/**
 * API Service
 * 
 * Centralized HTTP client for communicating with the backend API.
 * Handles all API requests for bookings, weather, and other endpoints.
 * 
 * Base URL Configuration:
 * - Production: Set REACT_APP_API_URL in environment
 * - Development: Defaults to http://localhost:5000
 * 
 * Features:
 * - Axios-based HTTP client with interceptors
 * - Request/response logging for debugging
 * - Error handling and propagation
 * - Timeout configuration (10 seconds)
 * - Consistent JSON headers
 * - Automatic base URL prefixing
 * 
 * Endpoints:
 * - POST /api/bookings - Create new booking
 * - GET /api/bookings - Get all bookings
 * - GET /api/bookings/:id - Get booking by ID
 * - PUT /api/bookings/:id/cancel - Cancel booking
 * - GET /api/weather - Get weather forecast
 * 
 * Error Handling:
 * - Network errors: Connection issues, timeouts
 * - HTTP errors: 4xx client errors, 5xx server errors
 * - All errors are logged and re-thrown for component handling
 * 
 * @class ApiService
 */

import axios from 'axios';

// API base URL (configurable via environment variable)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  /**
   * Initialize API Service
   * Creates axios instance with interceptors for logging
   */
  constructor() {
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // ========================================
    // Request Interceptor
    // ========================================
    // Logs all outgoing requests for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // ========================================
    // Response Interceptor
    // ========================================
    // Logs all responses and errors for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.data);
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      const response = await this.client.post('/api/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all bookings
   */
  async getAllBookings(filters = {}) {
    try {
      const response = await this.client.get('/api/bookings', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId) {
    try {
      const response = await this.client.get(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId) {
    try {
      const response = await this.client.delete(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get weather forecast
   */
  async getWeather(date, location = 'Hyderabad', time = null) {
    try {
      const params = { date, location };
      if (time) params.time = time;

      const response = await this.client.get('/api/weather', {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return new Error(error.response.data.message || 'Server error occurred');
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check if backend is running.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new ApiService();
