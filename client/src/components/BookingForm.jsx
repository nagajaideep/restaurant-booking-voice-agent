import React, { useState } from 'react';
import apiService from '../services/apiService';
import './BookingForm.css';

const BookingForm = ({ onBookingCreated }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    numberOfGuests: 1,
    bookingDate: '',
    bookingTime: '',
    cuisinePreference: 'Italian',
    specialRequests: '',
    seatingPreference: 'No Preference'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cuisineOptions = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Other'];
  const seatingOptions = ['Indoor', 'Outdoor', 'No Preference'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Combine date and time
      const bookingDateTime = new Date(`${formData.bookingDate}T${formData.bookingTime}`);

      const bookingData = {
        ...formData,
        bookingDate: bookingDateTime.toISOString(),
        numberOfGuests: parseInt(formData.numberOfGuests),
        weatherInfo: {},
        status: 'confirmed'
      };

      const response = await apiService.createBooking(bookingData);

      if (response.success) {
        setSuccess(`Booking created successfully! Booking ID: ${response.data.bookingId}`);

        // Reset form
        setFormData({
          customerName: '',
          numberOfGuests: 1,
          bookingDate: '',
          bookingTime: '',
          cuisinePreference: 'Italian',
          specialRequests: '',
          seatingPreference: 'No Preference'
        });

        if (onBookingCreated) {
          onBookingCreated(response.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form-container">
      <h2>Manual Booking Form</h2>
      <p className="form-subtitle">Prefer typing? Use this form to create a booking</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="customerName">Customer Name *</label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            placeholder="Enter your name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numberOfGuests">Number of Guests *</label>
            <input
              type="number"
              id="numberOfGuests"
              name="numberOfGuests"
              value={formData.numberOfGuests}
              onChange={handleChange}
              min="1"
              max="20"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cuisinePreference">Cuisine Preference *</label>
            <select
              id="cuisinePreference"
              name="cuisinePreference"
              value={formData.cuisinePreference}
              onChange={handleChange}
              required
            >
              {cuisineOptions.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bookingDate">Booking Date *</label>
            <input
              type="date"
              id="bookingDate"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookingTime">Booking Time *</label>
            <input
              type="time"
              id="bookingTime"
              name="bookingTime"
              value={formData.bookingTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="seatingPreference">Seating Preference</label>
          <select
            id="seatingPreference"
            name="seatingPreference"
            value={formData.seatingPreference}
            onChange={handleChange}
          >
            {seatingOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="specialRequests">Special Requests</label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            placeholder="Any special requests? (birthday, anniversary, dietary restrictions, etc.)"
            rows="3"
          />
        </div>

        <button type="submit" className="btn btn-submit" disabled={loading}>
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
