# Restaurant Booking Voice Agent 🎙️🍽️

An intelligent frontend-only voice agent that helps users book restaurant tables through natural conversation. Built with React, the Web Speech API, and browser local storage.

## 🎯 Features

- **Voice Interaction**: Natural speech-to-text and text-to-speech conversation
- **Smart Booking**: Collects guest count, date/time, cuisine preference, and special requests via voice
- **Availability Checks**: Checks table capacity before confirmation and suggests nearby available slots
- **Table Assignment**: Assigns the best-fit indoor/outdoor table based on party size and seating preference
- **Arrival Guidance**: Estimates when the customer should arrive, when staff should start preparing, and when the table is ready
- **Demo Weather Guidance**: Local demo forecast for seating suggestions without API keys
- **Browser Storage**: Bookings persist in `localStorage` without MongoDB or a backend server
- **Frontend-Only Demo**: Runs locally with just the React app

## 🛠️ Tech Stack

### Frontend
- React.js
- Web Speech API (SpeechRecognition & SpeechSynthesis)
- Browser localStorage for booking persistence
- CSS3 for styling

## 📁 Project Structure

```
restaurant-booking-voice-agent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and voice services
│   │   └── utils/         # Speech utilities
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   └── services/      # External services
└── docs/                   # Documentation
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd restaurant-booking-voice-agent
```

### 2. Frontend Setup
```bash
cd client
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

You can also start it from the repository root:
```bash
npm start
```

## 🎤 How to Use

1. **Allow Microphone Access**: Browser will prompt for microphone permission
2. **Click "Start Conversation"**: Begin voice interaction
3. **Follow the Voice Prompts**:
   - Say number of guests
   - Provide booking date and time
   - Choose cuisine preference
   - Mention any special requests
4. **Availability Check**: Agent checks table capacity and estimates arrival/prep timing
5. **Weather Check**: Agent fetches weather and suggests seating
6. **Confirm Booking**: Review table assignment, timing guidance, and reservation details

### Voice Commands Examples:
- "I want to book a table"
- "Table for 4 people"
- "Tomorrow at 7 PM"
- "Italian cuisine"
- "It's a birthday celebration"

## 📡 API Endpoints

This version does not require API endpoints. The frontend uses a local service wrapper that saves bookings, checks availability, cancels reservations, and generates demo weather guidance inside the browser.

## 🗄️ Database Schema

```javascript
{
  bookingId: String,
  customerName: String,
  numberOfGuests: Number,
  bookingDate: Date,
  bookingTime: String,
  cuisinePreference: String,
  specialRequests: String,
  weatherInfo: Object,
  seatingPreference: String,
  tableAssignment: Object,
  bookingDurationMinutes: Number,
  estimatedArrivalTime: String,
  prepStartTime: String,
  tableReadyTime: String,
  bookingEndTime: String,
  arrivalGuidance: Object,
  status: String,
  createdAt: Date
}
```

## 🌤️ Weather Integration

The agent uses a local demo forecast to suggest indoor or outdoor seating. This keeps the project free to run without OpenWeatherMap credentials.

## 🔧 Environment Variables

No environment variables are required for the frontend-only demo.

## 🎥 Demo Video

Check the `demo/` folder for a screen recording demonstrating the complete booking flow.

## 🐛 Troubleshooting

### Microphone Not Working
- Ensure browser has microphone permissions
- Use HTTPS in production (required for Web Speech API)
- Test in Chrome/Edge (best browser support)

### Booking Data Not Showing
- Bookings are saved in the current browser only
- Check that browser storage is enabled
- Clearing site data will remove saved demo bookings

## 📝 Code Quality

- Clean, commented code
- Separation of concerns
- Error handling implemented
- Frontend-only local service design
- Responsive UI

## 🚀 Future Enhancements

- [ ] Multi-language support (Hindi + English)
- [ ] SMS/Email confirmations
- [ ] Calendar integration
- [ ] Admin dashboard with analytics
- [x] Restaurant availability checking

## 👨‍💻 Developer

Created for Vaiu AI Software Developer Internship Assignment

## 📄 License

MIT License - feel free to use for learning purposes

---

**Note**: This project uses browser's built-in Web Speech API. For production, consider using more robust solutions like Google Cloud Speech-to-Text or OpenAI Whisper.
