# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Endpoints

### 1. Health Check

Check if API is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "Restaurant Booking API is running",
  "timestamp": "2025-12-04T10:30:00.000Z"
}
```

---

### 2. Create Booking

Create a new restaurant booking.

**Endpoint:** `POST /api/bookings`

**Request Body:**
```json
{
  "customerName": "John Doe",
  "numberOfGuests": 4,
  "bookingDate": "2025-12-10T00:00:00.000Z",
  "bookingTime": "19:00",
  "cuisinePreference": "Italian",
  "specialRequests": "Birthday celebration",
  "seatingPreference": "Outdoor",
  "weatherInfo": {
    "temperature": 25,
    "condition": "Clear",
    "description": "clear sky"
  },
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "bookingId": "BK1733313600123",
    "customerName": "John Doe",
    "numberOfGuests": 4,
    "bookingDate": "2025-12-10T00:00:00.000Z",
    "bookingTime": "19:00",
    "cuisinePreference": "Italian",
    "specialRequests": "Birthday celebration",
    "weatherInfo": {
      "temperature": 25,
      "condition": "Clear",
      "description": "clear sky"
    },
    "seatingPreference": "Outdoor",
    "status": "confirmed",
    "createdAt": "2025-12-04T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- `customerName`: Required, string
- `numberOfGuests`: Required, number (1-20)
- `bookingDate`: Required, valid date
- `bookingTime`: Required, string (HH:mm format)
- `cuisinePreference`: Required, enum ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Other']
- `seatingPreference`: Optional, enum ['Indoor', 'Outdoor', 'No Preference']
- `status`: Optional, enum ['confirmed', 'pending', 'cancelled']

---

### 3. Get All Bookings

Retrieve all bookings with optional filtering.

**Endpoint:** `GET /api/bookings`

**Query Parameters:**
- `status` (optional): Filter by status (confirmed, pending, cancelled)
- `date` (optional): Filter by booking date (YYYY-MM-DD)
- `cuisine` (optional): Filter by cuisine preference

**Examples:**
```
GET /api/bookings
GET /api/bookings?status=confirmed
GET /api/bookings?date=2025-12-10
GET /api/bookings?cuisine=Italian&status=confirmed
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "bookingId": "BK1733313600123",
      "customerName": "John Doe",
      "numberOfGuests": 4,
      "bookingDate": "2025-12-10T00:00:00.000Z",
      "bookingTime": "19:00",
      "cuisinePreference": "Italian",
      "specialRequests": "Birthday celebration",
      "seatingPreference": "Outdoor",
      "status": "confirmed",
      "createdAt": "2025-12-04T10:30:00.000Z"
    },
    {
      "_id": "65f1234567890abcdef12346",
      "bookingId": "BK1733313600456",
      "customerName": "Jane Smith",
      "numberOfGuests": 2,
      "bookingDate": "2025-12-11T00:00:00.000Z",
      "bookingTime": "20:00",
      "cuisinePreference": "Chinese",
      "specialRequests": "None",
      "seatingPreference": "Indoor",
      "status": "confirmed",
      "createdAt": "2025-12-04T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Booking by ID

Retrieve a specific booking by its booking ID.

**Endpoint:** `GET /api/bookings/:id`

**Example:**
```
GET /api/bookings/BK1733313600123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "bookingId": "BK1733313600123",
    "customerName": "John Doe",
    "numberOfGuests": 4,
    "bookingDate": "2025-12-10T00:00:00.000Z",
    "bookingTime": "19:00",
    "cuisinePreference": "Italian",
    "specialRequests": "Birthday celebration",
    "seatingPreference": "Outdoor",
    "status": "confirmed",
    "createdAt": "2025-12-04T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

### 5. Cancel Booking

Cancel a booking by setting its status to 'cancelled'.

**Endpoint:** `DELETE /api/bookings/:id`

**Example:**
```
DELETE /api/bookings/BK1733313600123
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "bookingId": "BK1733313600123",
    "customerName": "John Doe",
    "status": "cancelled",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

### 6. Get Weather Forecast

Get weather forecast for a specific date and location.

**Endpoint:** `GET /api/weather`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format
- `location` (optional): City name (defaults to Hyderabad)

**Example:**
```
GET /api/weather?date=2025-12-10&location=Hyderabad
```

**Response:**
```json
{
  "success": true,
  "data": {
    "weather": {
      "location": "Hyderabad",
      "country": "IN",
      "temperature": 28,
      "feelsLike": 30,
      "condition": "Clear",
      "description": "clear sky",
      "humidity": 45,
      "windSpeed": 3.5,
      "icon": "01d",
      "timestamp": "2025-12-10T12:00:00.000Z"
    },
    "seatingSuggestion": {
      "preference": "Outdoor",
      "message": "Perfect weather for outdoor dining! It's 28°C with clear sky."
    }
  }
}
```

**Weather Conditions & Seating Suggestions:**
- **Clear/Sunny (20-30°C)**: Outdoor seating recommended
- **Clear/Sunny (>30°C)**: Indoor (air-conditioned) recommended
- **Clear/Sunny (<20°C)**: Indoor (comfortable) recommended
- **Rainy/Drizzle/Thunderstorm**: Indoor strongly recommended
- **Cloudy/Snow**: Indoor recommended

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch weather data"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limits

- Weather API: 60 requests per minute (OpenWeatherMap free tier)
- Booking APIs: No rate limit (adjust based on production requirements)

---

## CORS

The API accepts requests from:
- `http://localhost:3000` (frontend development)

Configure `CLIENT_URL` in `.env` to change allowed origins.

---

## Notes

1. All dates should be in ISO 8601 format
2. Times should be in 24-hour format (HH:mm)
3. Weather data is cached for 10 minutes for the same date/location
4. Booking IDs are auto-generated: `BK{timestamp}{random}`
5. Weather forecasts are accurate up to 5 days ahead
