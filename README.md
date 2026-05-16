# Restaurant Booking Voice Agent

A frontend-only restaurant reservation demo where customers can book a table through a voice-guided flow or a manual form. The app checks table availability, assigns a best-fit table, estimates arrival/prep timing, and stores demo bookings in the browser.

## Features

- Voice-based booking flow using the Web Speech API
- Manual booking form for typed reservations
- Local table availability checks
- Indoor/outdoor table assignment
- Arrival time, prep start time, ready time, and booking end estimates
- Demo weather guidance for seating suggestions
- Booking list with cancellation support
- Browser-only persistence with `localStorage`
- No backend, no MongoDB, no API keys, and no environment variables

## Tech Stack

- React
- Web Speech API
- Browser `localStorage`
- CSS

## Project Structure

```text
restaurant-booking-voice-agent/
  client/
    public/
    src/
      components/
      services/
      utils/
  netlify.toml
  package.json
  README.md
```

## Local Setup

Install dependencies:

```bash
cd client
npm install
```

Start the app:

```bash
npm start
```

The app runs at:

```text
http://localhost:3000
```

You can also start from the repository root:

```bash
npm start
```

## Netlify Deployment

This repo includes `netlify.toml`, so Netlify can detect the correct build settings.

Build settings:

```text
Base directory: client
Build command: npm run build
Publish directory: client/build
```

No environment variables are required.

## How To Use

1. Open the app in Chrome or Edge.
2. Use the Voice Agent tab and allow microphone access, or use the Manual Form tab.
3. Enter guest count, date, time, cuisine preference, seating preference, and requests.
4. The app checks local table availability and suggests timing.
5. Confirm the reservation.
6. View or cancel bookings in the All Bookings tab.

## Data Storage

Bookings are saved in the current browser using `localStorage`. This is ideal for a recruiter demo because it requires no backend setup. Data will remain in that browser until site data is cleared.

## Notes

- Voice recognition works best in Chrome or Edge.
- Microphone access may require HTTPS in deployed environments.
- The weather result is demo guidance generated locally, not a live weather API.
- Because this is frontend-only, bookings are not shared across different browsers or devices.

## License

MIT
