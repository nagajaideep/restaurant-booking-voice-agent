import React, { useState } from 'react';
import VoiceAgent from './components/VoiceAgent';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('voice');
  const [refreshBookings, setRefreshBookings] = useState(0);

  const handleBookingCreated = () => {
    // Trigger refresh of booking list
    setRefreshBookings(prev => prev + 1);

    // Optionally switch to bookings tab
    setTimeout(() => {
      setActiveTab('bookings');
    }, 1000);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🍽️ Restaurant Booking System</h1>
          <p className="app-subtitle">Voice-Enabled AI Assistant for Easy Table Reservations</p>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          🎤 Voice Agent
        </button>
        <button
          className={`nav-btn ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          📝 Manual Form
        </button>
        <button
          className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 All Bookings
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'voice' && (
          <VoiceAgent onBookingCreated={handleBookingCreated} />
        )}

        {activeTab === 'form' && (
          <BookingForm onBookingCreated={handleBookingCreated} />
        )}

        {activeTab === 'bookings' && (
          <BookingList key={refreshBookings} />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2025 Restaurant Booking Voice Agent</p>
          <p>Built with MERN Stack + Web Speech API</p>
          <p className="footer-note">
            💡 For best experience, use Chrome or Edge browser with microphone enabled
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
