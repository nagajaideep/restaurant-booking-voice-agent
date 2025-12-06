# Restaurant Booking Voice Agent 🎙️🍽️

An intelligent voice-enabled AI agent that helps users book restaurant tables through natural conversation. Built with MERN stack and Web Speech API.

## 🎯 Features

- **Voice Interaction**: Natural speech-to-text and text-to-speech conversation
- **Smart Booking**: Collects guest count, date/time, cuisine preference, and special requests via voice
- **Weather Integration**: Real-time weather forecast for booking date with seating suggestions
- **Database Storage**: MongoDB for persistent booking management
- **RESTful API**: Complete CRUD operations for bookings

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- OpenWeatherMap API
- CORS, dotenv

### Frontend
- React.js
- Web Speech API (SpeechRecognition & SpeechSynthesis)
- Axios for API calls
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
- MongoDB Atlas account
- OpenWeatherMap API key

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd restaurant-booking-voice-agent
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create `.env` file in server directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
WEATHER_API_KEY=your_openweathermap_api_key
DEFAULT_LOCATION=Hyderabad
CLIENT_URL=http://localhost:3000
```

Start backend server:
```bash
npm start
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd client
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## 🎤 How to Use

1. **Allow Microphone Access**: Browser will prompt for microphone permission
2. **Click "Start Conversation"**: Begin voice interaction
3. **Follow the Voice Prompts**:
   - Say number of guests
   - Provide booking date and time
   - Choose cuisine preference
   - Mention any special requests
4. **Weather Check**: Agent fetches weather and suggests seating
5. **Confirm Booking**: Review details and confirm

### Voice Commands Examples:
- "I want to book a table"
- "Table for 4 people"
- "Tomorrow at 7 PM"
- "Italian cuisine"
- "It's a birthday celebration"

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings` | Get all bookings |
| GET | `/api/bookings/:id` | Get specific booking |
| DELETE | `/api/bookings/:id` | Cancel booking |
| GET | `/api/weather` | Get weather forecast |

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
  status: String,
  createdAt: Date
}
```

## 🌤️ Weather Integration

The agent fetches real-time weather data from OpenWeatherMap API and intelligently suggests seating:
- **Sunny/Clear**: Suggests outdoor seating
- **Rainy/Cloudy**: Recommends indoor seating
- **Temperature-based**: Additional comfort suggestions

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/restaurant-booking
WEATHER_API_KEY=your_api_key
DEFAULT_LOCATION=Hyderabad
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🎥 Demo Video

Check the `demo/` folder for a screen recording demonstrating the complete booking flow.

## 🐛 Troubleshooting

### Microphone Not Working
- Ensure browser has microphone permissions
- Use HTTPS in production (required for Web Speech API)
- Test in Chrome/Edge (best browser support)

### MongoDB Connection Error
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

### Weather API Not Working
- Verify API key is valid
- Check API request limit (60 calls/minute for free tier)
- Ensure location name is correct

## 📝 Code Quality

- Clean, commented code
- Separation of concerns
- Error handling implemented
- RESTful API design
- Responsive UI

## 🚀 Future Enhancements

- [ ] Multi-language support (Hindi + English)
- [ ] SMS/Email confirmations
- [ ] Calendar integration
- [ ] Admin dashboard with analytics
- [ ] Restaurant availability checking

## 👨‍💻 Developer

Created for Vaiu AI Software Developer Internship Assignment

## 📄 License

MIT License - feel free to use for learning purposes

---

**Note**: This project uses browser's built-in Web Speech API. For production, consider using more robust solutions like Google Cloud Speech-to-Text or OpenAI Whisper.
