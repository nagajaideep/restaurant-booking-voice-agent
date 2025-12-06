# Setup Guide - Restaurant Booking Voice Agent

Complete step-by-step guide to set up and run the project.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software:
1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

3. **MongoDB Atlas Account** (Free tier)
   - Sign up: https://www.mongodb.com/cloud/atlas/register

4. **OpenWeatherMap API Key** (Free)
   - Sign up: https://openweathermap.org/api
   - Get API key from dashboard

5. **Modern Browser** (Chrome or Edge recommended)
   - Required for Web Speech API support

---

## Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd restaurant-booking-voice-agent
```

---

## Step 2: MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google

2. **Create Free Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select cloud provider and region (Mumbai for India)
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `restaurant_user`
   - Password: Generate secure password (SAVE THIS!)
   - Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Address**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP address
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and latest version
   - Copy connection string:
   ```
   mongodb+srv://restaurant_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add `/restaurant-booking` before the `?`:
   ```
   mongodb+srv://restaurant_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/restaurant-booking?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Select your OS and download

2. **Install MongoDB**
   - Follow installation wizard
   - Install as a Service
   - Install MongoDB Compass (GUI tool)

3. **Verify Installation**
   ```bash
   mongod --version
   ```

4. **Connection String**
   ```
   mongodb://localhost:27017/restaurant-booking
   ```

---

## Step 3: OpenWeatherMap API Key

1. **Sign Up**
   - Go to https://openweathermap.org/api
   - Click "Sign Up" and create account

2. **Get API Key**
   - Log in to your account
   - Go to "API keys" section
   - Copy your default API key (or generate new one)
   - Example: `6f332f6b3f4637bb9cfcbfc3e9e07dea`

3. **Note**: Free tier allows 60 calls/minute, 1,000,000 calls/month

---

## Step 4: Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # Create .env file in server directory
   ```

4. **Add environment variables**
   
   Create `server/.env` with the following content:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Connection (use YOUR connection string)
   MONGODB_URI=mongodb+srv://restaurant_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/restaurant-booking?retryWrites=true&w=majority

   # OpenWeatherMap API (use YOUR API key)
   WEATHER_API_KEY=your_api_key_here
   DEFAULT_LOCATION=Hyderabad

   # CORS
   CLIENT_URL=http://localhost:3000
   ```

   **Replace:**
   - `YOUR_PASSWORD` with your MongoDB password
   - `cluster0.xxxxx` with your actual cluster address
   - `your_api_key_here` with your OpenWeatherMap API key

5. **Start backend server**
   ```bash
   npm start
   ```

6. **Verify backend is running**
   - Open browser: http://localhost:5000/api/health
   - Should see: `{"status":"OK","message":"Restaurant Booking API is running"}`

7. **Check console output**
   ```
   ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
   📊 Database Name: restaurant-booking
   🚀 Server running on port 5000
   ```

---

## Step 5: Frontend Setup

1. **Open new terminal** (keep backend running)

2. **Navigate to client directory**
   ```bash
   cd client
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create .env file**
   
   Create `client/.env` with:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

5. **Start frontend**
   ```bash
   npm start
   ```

6. **Application opens automatically**
   - Frontend: http://localhost:3000
   - Browser should open automatically

---

## Step 6: Grant Microphone Permission

1. **When you first use the voice agent:**
   - Browser will ask for microphone permission
   - Click "Allow" to enable voice features

2. **If permission denied:**
   - Click the microphone icon in browser address bar
   - Change permission to "Allow"
   - Refresh the page

---

## Step 7: Test the Application

### Test Backend API:

1. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Get Bookings**
   ```bash
   curl http://localhost:5000/api/bookings
   ```

3. **Get Weather**
   ```bash
   curl "http://localhost:5000/api/weather?date=2025-12-10&location=Hyderabad"
   ```

### Test Frontend:

1. **Voice Agent**
   - Click "Voice Agent" tab
   - Click "Start Conversation"
   - Allow microphone access
   - Follow voice prompts to create booking

2. **Manual Form**
   - Click "Manual Form" tab
   - Fill in booking details
   - Submit form

3. **View Bookings**
   - Click "All Bookings" tab
   - See all created bookings

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Error
```
❌ MongoDB Connection Error: ...
```
**Solutions:**
- Verify connection string is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions
- Check if password contains special characters (URL encode them)

#### Weather API Error
```
Failed to fetch weather data
```
**Solutions:**
- Verify API key is correct
- Check if you've exceeded rate limit (60 calls/minute)
- Ensure location name is correct

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solutions:**
- Change PORT in `.env` to different number (e.g., 5001)
- Or kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F

  # Linux/Mac
  lsof -ti:5000 | xargs kill -9
  ```

### Frontend Issues

#### Microphone Not Working
**Solutions:**
- Ensure using Chrome or Edge browser
- Check browser microphone permissions
- Use HTTPS in production (required for Web Speech API)
- Check if another application is using microphone

#### Speech Recognition Not Supported
**Solutions:**
- Use Chrome (v25+) or Edge browser
- Update browser to latest version
- Web Speech API not available in Firefox/Safari

#### Cannot Connect to Backend
```
No response from server
```
**Solutions:**
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in client `.env`
- Verify CORS settings in backend

#### Build Errors
```
npm ERR! ...
```
**Solutions:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

---

## Running in Production

### Backend Deployment (Example: Heroku)

1. **Prepare for deployment**
   ```bash
   # Add start script in package.json
   "scripts": {
     "start": "node src/server.js"
   }
   ```

2. **Set environment variables**
   - Add all `.env` variables in hosting platform

3. **Update CORS**
   - Change `CLIENT_URL` to production frontend URL

### Frontend Deployment (Example: Vercel/Netlify)

1. **Build production version**
   ```bash
   npm run build
   ```

2. **Update API URL**
   - Set `REACT_APP_API_URL` to production backend URL

3. **Note about HTTPS**
   - Web Speech API requires HTTPS in production
   - Most hosting platforms provide HTTPS by default

---

## Project Structure Reference

```
restaurant-booking-voice-agent/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API & voice services
│   │   ├── utils/              # Speech utilities
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env
│
├── server/                      # Node.js Backend
│   ├── src/
│   │   ├── config/             # Database config
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # Express routes
│   │   ├── controllers/        # Business logic
│   │   ├── services/           # External services
│   │   ├── middleware/         # Error handling
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
│
└── README.md
```

---

## Useful Commands

### Backend
```bash
cd server
npm install              # Install dependencies
npm start                # Start server
npm run dev              # Start with nodemon (auto-reload)
```

### Frontend
```bash
cd client
npm install              # Install dependencies
npm start                # Start development server
npm run build            # Build for production
```

### Both (from root directory)
```bash
npm run install-all      # Install both frontend & backend
npm run dev              # Run both concurrently
```

---

## Additional Resources

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **OpenWeatherMap API Docs**: https://openweathermap.org/api
- **Web Speech API Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **React Docs**: https://react.dev/
- **Express Docs**: https://expressjs.com/

---

## Support

If you encounter any issues not covered here:

1. Check console logs (browser & terminal)
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check API documentation for correct request format

---

**Happy Coding! 🚀**
