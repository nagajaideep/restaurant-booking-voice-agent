import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import './BookingList.css';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const response = await apiService.getAllBookings(filters);

      if (response.success) {
        setBookings(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await apiService.cancelBooking(bookingId);

      if (response.success) {
        // Refresh bookings
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { class: 'badge-confirmed', label: '✓ Confirmed' },
      pending: { class: 'badge-pending', label: '⏳ Pending' },
      cancelled: { class: 'badge-cancelled', label: '✗ Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="booking-list-container">
        <div className="loading">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-list-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="booking-list-container">
      <div className="booking-list-header">
        <h2>📋 All Bookings</h2>

        <div className="filter-controls">
          <label>Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button onClick={fetchBookings} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>📭 No bookings found</p>
          <p className="empty-subtitle">Start by creating a booking using the voice agent!</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => {
            const badge = getStatusBadge(booking.status);

            return (
              <div key={booking._id} className={`booking-card ${booking.status}`}>
                <div className="booking-header">
                  <div className="booking-id">
                    <strong>ID:</strong> {booking.bookingId}
                  </div>
                  <span className={`status-badge ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span className="detail-icon">👤</span>
                    <strong>{booking.customerName}</strong>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">👥</span>
                    <span>{booking.numberOfGuests} guests</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span>{formatDate(booking.bookingDate)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏰</span>
                    <span>{booking.bookingTime}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🍽️</span>
                    <span>{booking.cuisinePreference}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">💺</span>
                    <span>{booking.seatingPreference}</span>
                  </div>

                  {booking.tableAssignment?.tableId && (
                    <div className="detail-row table-info">
                      <span className="detail-icon">T</span>
                      <span>
                        Table {booking.tableAssignment.tableId} ({booking.tableAssignment.seating}, seats {booking.tableAssignment.capacity})
                      </span>
                    </div>
                  )}

                  {booking.estimatedArrivalTime && (
                    <div className="detail-row arrival-info">
                      <span className="detail-icon">A</span>
                      <span>Customer arrival: {booking.estimatedArrivalTime}</span>
                    </div>
                  )}

                  {booking.prepStartTime && (
                    <div className="detail-row prep-info">
                      <span className="detail-icon">P</span>
                      <span>Prep starts: {booking.prepStartTime}</span>
                    </div>
                  )}

                  {booking.bookingEndTime && (
                    <div className="detail-row">
                      <span className="detail-icon">E</span>
                      <span>Reserved until: {booking.bookingEndTime}</span>
                    </div>
                  )}

                  {booking.specialRequests && booking.specialRequests !== 'None' && (
                    <div className="detail-row special-requests">
                      <span className="detail-icon">✨</span>
                      <span><em>{booking.specialRequests}</em></span>
                    </div>
                  )}

                  {booking.weatherInfo && booking.weatherInfo.temperature && (
                    <div className="detail-row weather-info">
                      <span className="detail-icon">🌤️</span>
                      <span>
                        {booking.weatherInfo.temperature}°C, {booking.weatherInfo.description}
                      </span>
                    </div>
                  )}
                </div>

                {booking.status === 'confirmed' && (
                  <div className="booking-actions">
                    <button
                      onClick={() => handleCancel(booking.bookingId)}
                      className="btn-cancel"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}

                <div className="booking-footer">
                  <small>Created: {new Date(booking.createdAt).toLocaleString()}</small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="booking-count">
        Total: {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default BookingList;
