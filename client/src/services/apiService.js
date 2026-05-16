const STORAGE_KEY = 'restaurant-booking-voice-agent-bookings';

const RESTAURANT_TABLES = [
  { tableId: 'I-01', seating: 'Indoor', capacity: 2 },
  { tableId: 'I-02', seating: 'Indoor', capacity: 2 },
  { tableId: 'I-03', seating: 'Indoor', capacity: 4 },
  { tableId: 'I-04', seating: 'Indoor', capacity: 4 },
  { tableId: 'I-05', seating: 'Indoor', capacity: 6 },
  { tableId: 'I-06', seating: 'Indoor', capacity: 8 },
  { tableId: 'O-01', seating: 'Outdoor', capacity: 2 },
  { tableId: 'O-02', seating: 'Outdoor', capacity: 4 },
  { tableId: 'O-03', seating: 'Outdoor', capacity: 4 },
  { tableId: 'O-04', seating: 'Outdoor', capacity: 6 }
];

const OPENING_HOUR = 10;
const CLOSING_HOUR = 23;

const readBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error('Failed to read local bookings:', error);
    return [];
  }
};

const writeBookings = (bookings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const toDateKey = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const parseBookingStart = (bookingDate, bookingTime) => {
  const dateKey = toDateKey(bookingDate);
  if (!dateKey || !bookingTime) return null;

  const [hours, minutes] = bookingTime.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

  return new Date(`${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const formatClockTime = (date) => date.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

const getBookingDurationMinutes = (numberOfGuests) => {
  if (numberOfGuests >= 9) return 135;
  if (numberOfGuests >= 6) return 120;
  if (numberOfGuests >= 3) return 105;
  return 90;
};

const getPrepMinutes = (numberOfGuests) => {
  if (numberOfGuests >= 9) return 35;
  if (numberOfGuests >= 6) return 30;
  if (numberOfGuests >= 3) return 25;
  return 20;
};

const normalizeSeatingPreference = (value) => {
  if (value === 'Indoor' || value === 'Outdoor') return value;
  return 'No Preference';
};

const bookingOverlaps = (booking, requestedStart, requestedEnd) => {
  const existingStart = parseBookingStart(booking.bookingDate, booking.bookingTime);
  if (!existingStart) return false;

  const duration = booking.bookingDurationMinutes || getBookingDurationMinutes(booking.numberOfGuests || 2);
  const existingEnd = addMinutes(existingStart, duration);

  return existingStart < requestedEnd && existingEnd > requestedStart;
};

const pickFallbackTableForBooking = (booking, blockedTableIds) => {
  const seatingPreference = normalizeSeatingPreference(booking.seatingPreference);

  return RESTAURANT_TABLES
    .filter((table) => table.capacity >= booking.numberOfGuests)
    .filter((table) => seatingPreference === 'No Preference' || table.seating === seatingPreference)
    .filter((table) => !blockedTableIds.has(table.tableId))
    .sort((a, b) => a.capacity - b.capacity || a.tableId.localeCompare(b.tableId))[0] || null;
};

const getBlockedTableIds = (existingBookings, requestedStart, requestedEnd) => {
  const blocked = new Set();

  existingBookings
    .filter((booking) => booking.status !== 'cancelled')
    .filter((booking) => bookingOverlaps(booking, requestedStart, requestedEnd))
    .forEach((booking) => {
      if (booking.tableAssignment?.tableId) {
        blocked.add(booking.tableAssignment.tableId);
        return;
      }

      const fallbackTable = pickFallbackTableForBooking(booking, blocked);
      if (fallbackTable) blocked.add(fallbackTable.tableId);
    });

  return blocked;
};

const buildArrivalGuidance = (bookingDate, bookingTime, numberOfGuests) => {
  const bookingStart = parseBookingStart(bookingDate, bookingTime);
  const prepMinutes = getPrepMinutes(numberOfGuests);
  const arrivalBufferMinutes = numberOfGuests >= 6 ? 15 : 10;
  const bookingDurationMinutes = getBookingDurationMinutes(numberOfGuests);
  const arrivalTime = addMinutes(bookingStart, -arrivalBufferMinutes);
  const prepStartTime = addMinutes(bookingStart, -prepMinutes);
  const bookingEndTime = addMinutes(bookingStart, bookingDurationMinutes);

  return {
    estimatedArrivalTime: formatClockTime(arrivalTime),
    prepStartTime: formatClockTime(prepStartTime),
    tableReadyTime: formatClockTime(bookingStart),
    bookingEndTime: formatClockTime(bookingEndTime),
    prepMinutes,
    arrivalBufferMinutes,
    bookingDurationMinutes,
    message: `Please arrive by ${formatClockTime(arrivalTime)}. The team will start preparing your table at ${formatClockTime(prepStartTime)}, and it will be ready at ${formatClockTime(bookingStart)}.`
  };
};

const getAlternativeSlots = ({ bookingDate, bookingTime, numberOfGuests, seatingPreference, existingBookings }) => {
  const baseStart = parseBookingStart(bookingDate, bookingTime);
  if (!baseStart) return [];

  return [-60, -30, 30, 60, 90, 120]
    .map((offset) => addMinutes(baseStart, offset))
    .filter((slot) => slot.getHours() >= OPENING_HOUR && slot.getHours() < CLOSING_HOUR)
    .map((slot) => {
      const time = `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`;
      return checkAvailabilityLocally({
        bookingDate,
        bookingTime: time,
        numberOfGuests,
        seatingPreference,
        existingBookings,
        includeAlternatives: false
      });
    })
    .filter((result) => result.available)
    .slice(0, 3)
    .map((result) => ({
      bookingTime: result.bookingTime,
      displayTime: result.displayTime,
      tableAssignment: result.tableAssignment
    }));
};

function checkAvailabilityLocally({
  bookingDate,
  bookingTime,
  numberOfGuests,
  seatingPreference = 'No Preference',
  existingBookings = readBookings(),
  includeAlternatives = true
}) {
  const bookingStart = parseBookingStart(bookingDate, bookingTime);
  const guests = Number(numberOfGuests);

  if (!bookingStart || !Number.isInteger(guests) || guests < 1) {
    return {
      available: false,
      reason: 'Please provide a valid date, time, and guest count.'
    };
  }

  if (bookingStart.getHours() < OPENING_HOUR || bookingStart.getHours() >= CLOSING_HOUR) {
    return {
      available: false,
      reason: 'The restaurant accepts bookings from 10:00 AM to 11:00 PM.'
    };
  }

  const bookingDurationMinutes = getBookingDurationMinutes(guests);
  const requestedEnd = addMinutes(bookingStart, bookingDurationMinutes);
  const requestedDate = toDateKey(bookingDate);
  const sameDayBookings = existingBookings.filter((booking) => toDateKey(booking.bookingDate) === requestedDate);
  const blockedTableIds = getBlockedTableIds(sameDayBookings, bookingStart, requestedEnd);
  const normalizedSeating = normalizeSeatingPreference(seatingPreference);

  const availableTables = RESTAURANT_TABLES
    .filter((table) => table.capacity >= guests)
    .filter((table) => normalizedSeating === 'No Preference' || table.seating === normalizedSeating)
    .filter((table) => !blockedTableIds.has(table.tableId))
    .sort((a, b) => a.capacity - b.capacity || a.tableId.localeCompare(b.tableId));

  const tableAssignment = availableTables[0] || null;
  const arrivalGuidance = tableAssignment
    ? buildArrivalGuidance(bookingDate, bookingTime, guests)
    : null;

  const result = {
    available: Boolean(tableAssignment),
    bookingDate: requestedDate,
    bookingTime,
    displayTime: formatClockTime(bookingStart),
    requestedGuests: guests,
    seatingPreference: normalizedSeating,
    tableAssignment,
    availableTableCount: availableTables.length,
    totalTableCount: RESTAURANT_TABLES.length,
    blockedTableCount: blockedTableIds.size,
    bookingDurationMinutes,
    arrivalGuidance,
    reason: tableAssignment
      ? `Table ${tableAssignment.tableId} is available for ${guests} guest${guests === 1 ? '' : 's'}.`
      : 'No suitable table is available for that party size and time.'
  };

  if (!tableAssignment && includeAlternatives) {
    result.alternativeSlots = getAlternativeSlots({
      bookingDate,
      bookingTime,
      numberOfGuests: guests,
      seatingPreference: normalizedSeating,
      existingBookings
    });
  }

  return result;
}

const getDemoWeather = (date, location) => {
  const dateSeed = [...String(date || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const temperature = 24 + (dateSeed % 6);
  const condition = temperature <= 29 ? 'Clear' : 'Clouds';
  const description = condition === 'Clear' ? 'clear sky' : 'partly cloudy skies';
  const preference = condition === 'Clear' && temperature >= 20 && temperature <= 30 ? 'Outdoor' : 'Indoor';

  return {
    weather: {
      location,
      country: 'IN',
      temperature,
      feelsLike: temperature + 1,
      condition,
      description,
      humidity: 55,
      windSpeed: 2.5,
      icon: condition === 'Clear' ? '01d' : '02d',
      timestamp: new Date().toISOString(),
      note: 'Demo weather generated locally. No API key required.'
    },
    seatingSuggestion: {
      preference,
      message: preference === 'Outdoor'
        ? `Demo forecast looks pleasant at ${temperature}°C with ${description}. Outdoor seating should be comfortable.`
        : `Demo forecast shows ${description} around ${temperature}°C. Indoor seating is the safer choice.`
    },
    fetchedFrom: 'Local demo forecast',
    location
  };
};

class LocalApiService {
  async createBooking(bookingData) {
    const bookings = readBookings();
    const availability = checkAvailabilityLocally({
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
      numberOfGuests: Number(bookingData.numberOfGuests),
      seatingPreference: bookingData.seatingPreference,
      existingBookings: bookings
    });

    if (!availability.available) {
      throw new Error(availability.reason);
    }

    const now = new Date();
    const booking = {
      ...bookingData,
      _id: `local-${now.getTime()}`,
      bookingId: `BK${now.getTime()}${Math.floor(Math.random() * 1000)}`,
      bookingDate: availability.bookingDate,
      numberOfGuests: Number(bookingData.numberOfGuests),
      cuisinePreference: bookingData.cuisinePreference || 'No Preference',
      specialRequests: bookingData.specialRequests || 'None',
      seatingPreference: availability.tableAssignment.seating,
      tableAssignment: availability.tableAssignment,
      bookingDurationMinutes: availability.bookingDurationMinutes,
      estimatedArrivalTime: availability.arrivalGuidance.estimatedArrivalTime,
      prepStartTime: availability.arrivalGuidance.prepStartTime,
      tableReadyTime: availability.arrivalGuidance.tableReadyTime,
      bookingEndTime: availability.arrivalGuidance.bookingEndTime,
      arrivalGuidance: availability.arrivalGuidance,
      availabilitySnapshot: {
        availableTableCount: availability.availableTableCount,
        blockedTableCount: availability.blockedTableCount,
        totalTableCount: availability.totalTableCount,
        checkedAt: now.toISOString()
      },
      status: bookingData.status || 'confirmed',
      createdAt: now.toISOString()
    };

    writeBookings([booking, ...bookings]);

    return {
      success: true,
      message: 'Booking created locally',
      data: booking
    };
  }

  async checkAvailability({ date, time, guests, seatingPreference = 'No Preference' }) {
    return {
      success: true,
      data: checkAvailabilityLocally({
        bookingDate: date,
        bookingTime: time,
        numberOfGuests: Number(guests),
        seatingPreference
      })
    };
  }

  async getAllBookings(filters = {}) {
    const bookings = readBookings();
    const filteredBookings = filters.status
      ? bookings.filter((booking) => booking.status === filters.status)
      : bookings;

    return {
      success: true,
      count: filteredBookings.length,
      data: filteredBookings
    };
  }

  async getBookingById(bookingId) {
    const booking = readBookings().find((item) => item.bookingId === bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    return {
      success: true,
      data: booking
    };
  }

  async cancelBooking(bookingId) {
    const bookings = readBookings();
    const updatedBookings = bookings.map((booking) => (
      booking.bookingId === bookingId
        ? { ...booking, status: 'cancelled' }
        : booking
    ));

    const booking = updatedBookings.find((item) => item.bookingId === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    writeBookings(updatedBookings);

    return {
      success: true,
      message: 'Booking cancelled locally',
      data: booking
    };
  }

  async getWeather(date, location = 'Hyderabad') {
    return {
      success: true,
      data: getDemoWeather(date, location)
    };
  }

  async healthCheck() {
    return {
      status: 'OK',
      message: 'Frontend-only local mode is running',
      timestamp: new Date().toISOString()
    };
  }

  async getRestaurantTables() {
    return {
      success: true,
      count: RESTAURANT_TABLES.length,
      data: RESTAURANT_TABLES
    };
  }
}

const apiService = new LocalApiService();

export default apiService;
