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

const toDateKey = (value) => {
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
  if (!dateKey || !bookingTime) {
    return null;
  }

  const [hours, minutes] = bookingTime.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return new Date(`${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const formatClockTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

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
  if (value === 'Indoor' || value === 'Outdoor') {
    return value;
  }

  return 'No Preference';
};

const bookingOverlaps = (booking, requestedStart, requestedEnd) => {
  const existingStart = parseBookingStart(booking.bookingDate, booking.bookingTime);
  if (!existingStart) {
    return false;
  }

  const duration = booking.bookingDurationMinutes || getBookingDurationMinutes(booking.numberOfGuests || 2);
  const existingEnd = addMinutes(existingStart, duration);

  return existingStart < requestedEnd && existingEnd > requestedStart;
};

const pickFallbackTableForBooking = (booking, blockedTableIds) => {
  const seatingPreference = normalizeSeatingPreference(booking.seatingPreference);
  const candidates = RESTAURANT_TABLES
    .filter((table) => table.capacity >= booking.numberOfGuests)
    .filter((table) => seatingPreference === 'No Preference' || table.seating === seatingPreference)
    .filter((table) => !blockedTableIds.has(table.tableId))
    .sort((a, b) => a.capacity - b.capacity || a.tableId.localeCompare(b.tableId));

  return candidates[0] || null;
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
      if (fallbackTable) {
        blocked.add(fallbackTable.tableId);
      }
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

const getAlternativeSlots = (bookingDate, bookingTime, numberOfGuests, seatingPreference, existingBookings) => {
  const baseStart = parseBookingStart(bookingDate, bookingTime);
  const offsets = [-60, -30, 30, 60, 90, 120];

  return offsets
    .map((offset) => addMinutes(baseStart, offset))
    .filter((slot) => slot.getHours() >= OPENING_HOUR && slot.getHours() < CLOSING_HOUR)
    .map((slot) => {
      const time = `${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`;
      return checkAvailability({
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

function checkAvailability({
  bookingDate,
  bookingTime,
  numberOfGuests,
  seatingPreference = 'No Preference',
  existingBookings = [],
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
  const blockedTableIds = getBlockedTableIds(existingBookings, bookingStart, requestedEnd);
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
    bookingDate: toDateKey(bookingDate),
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
    result.alternativeSlots = getAlternativeSlots(
      bookingDate,
      bookingTime,
      guests,
      normalizedSeating,
      existingBookings
    );
  }

  return result;
}

module.exports = {
  RESTAURANT_TABLES,
  checkAvailability,
  parseBookingStart,
  toDateKey
};
