/**
 * Conversation Flow Service
 * 
 * State machine that manages the restaurant booking conversation flow.
 * Handles user input processing, validation, and progression through booking steps.
 * 
 * Conversation Steps (in order):
 * 1. GREETING - Welcome message
 * 2. NAME - Collect customer name
 * 3. GUESTS - Collect number of guests (1-20)
 * 4. DATE_TIME - Collect date and time (combined question)
 * 5. CUISINE - Collect cuisine preference (optional)
 * 6. SPECIAL_REQUESTS - Collect special requests (optional)
 * 7. WEATHER_CHECK - Fetch weather data for booking date
 * 8. SEATING - Indoor/outdoor preference (with weather-based suggestion)
 * 9. CONFIRMATION - Show summary and confirm booking
 * 10. COMPLETE - Final thank you message
 * 
 * Features:
 * - Natural language processing for dates and times
 * - Flexible input handling (various formats)
 * - Weather API integration
 * - Intelligent seating suggestions based on weather
 * - Comprehensive validation and error handling
 * - Optional fields (cuisine, special requests)
 * 
 * Data Structure:
 * bookingData = {
 *   customerName: string,
 *   numberOfGuests: number (1-20),
 *   bookingDate: string (YYYY-MM-DD),
 *   bookingTime: string (HH:MM 24-hour),
 *   cuisinePreference: string (enum),
 *   specialRequests: string (default: 'None'),
 *   seatingPreference: string (Indoor/Outdoor/No Preference),
 *   weatherInfo: object,
 *   status: string (default: 'confirmed')
 * }
 * 
 * @class ConversationFlowService
 */

/**
 * Conversation step constants
 * Defines all possible states in the booking flow
 */
const CONVERSATION_STEPS = {
  GREETING: 'greeting',
  NAME: 'name',
  GUESTS: 'guests',
  DATE_TIME: 'date_time',
  CUISINE: 'cuisine',
  SPECIAL_REQUESTS: 'special_requests',
  WEATHER_CHECK: 'weather_check',
  SEATING: 'seating',
  CONFIRMATION: 'confirmation',
  COMPLETE: 'complete'
};

/**
 * Available cuisine options
 * Used for validation and prompting
 */
const CUISINE_OPTIONS = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'Continental', 'Other'];

class ConversationFlowService {
  /**
   * Initialize conversation flow service
   * Sets up initial state and booking data structure
   */
  constructor() {
    this.currentStep = CONVERSATION_STEPS.GREETING;
    this.bookingData = {
      customerName: '',
      numberOfGuests: 0,
      bookingDate: '',
      bookingTime: '',
      cuisinePreference: '',
      specialRequests: 'None',
      seatingPreference: 'No Preference',
      weatherInfo: {},
      tableAssignment: null,
      bookingDurationMinutes: 90,
      estimatedArrivalTime: '',
      prepStartTime: '',
      tableReadyTime: '',
      bookingEndTime: '',
      arrivalGuidance: null,
      availabilitySnapshot: {},
      status: 'confirmed'
    };
    this.weatherSuggestion = null;
  }

  /**
   * Reset conversation
   */
  reset() {
    this.currentStep = CONVERSATION_STEPS.GREETING;
    this.bookingData = {
      customerName: '',
      numberOfGuests: 0,
      bookingDate: '',
      bookingTime: '',
      cuisinePreference: '',
      specialRequests: 'None',
      seatingPreference: 'No Preference',
      weatherInfo: {},
      tableAssignment: null,
      bookingDurationMinutes: 90,
      estimatedArrivalTime: '',
      prepStartTime: '',
      tableReadyTime: '',
      bookingEndTime: '',
      arrivalGuidance: null,
      availabilitySnapshot: {},
      status: 'confirmed'
    };
    this.weatherSuggestion = null;
  }

  /**
   * Get current step
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * Get prompt for current step
   */
  getPrompt() {
    switch (this.currentStep) {
      case CONVERSATION_STEPS.GREETING:
        return "Hello! Welcome to our restaurant booking service. I'm your voice assistant. May I have your name please?";

      case CONVERSATION_STEPS.NAME:
        return "Thank you! How many guests will be joining you? You can say a number like 'two', 'four', or 'six'.";

      case CONVERSATION_STEPS.GUESTS:
        return "Great! What date and time would you like to book? For example, 'tomorrow at 7 PM' or 'December 15th at 8 PM'.";

      case CONVERSATION_STEPS.DATE_TIME:
        return `Excellent! Do you have any cuisine preference? We have ${CUISINE_OPTIONS.slice(0, -1).join(', ')}, and ${CUISINE_OPTIONS[CUISINE_OPTIONS.length - 1]}. Or say 'no' to skip.`;

      case CONVERSATION_STEPS.CUISINE:
        return "Do you have any special requests? For example, birthday celebration, anniversary, or dietary restrictions? If not, just say 'none'.";

      case CONVERSATION_STEPS.SPECIAL_REQUESTS:
        return "Let me check the weather for your booking date...";

      case CONVERSATION_STEPS.WEATHER_CHECK:
        return this.weatherSuggestion?.message || "Would you prefer indoor or outdoor seating?";

      case CONVERSATION_STEPS.SEATING:
        return this.getConfirmationMessage();

      case CONVERSATION_STEPS.CONFIRMATION:
        return "Your booking has been confirmed! You'll receive a confirmation shortly. Is there anything else I can help you with?";

      case CONVERSATION_STEPS.COMPLETE:
        return "Thank you for using our booking service. Have a wonderful dining experience!";

      default:
        return "I'm ready to help you book a table. Shall we start?";
    }
  }

  /**
   * Process user input
   */
  processInput(input) {
    const normalizedInput = input.toLowerCase().trim();

    switch (this.currentStep) {
      case CONVERSATION_STEPS.GREETING:
        return this.processName(input);

      case CONVERSATION_STEPS.NAME:
        return this.processGuests(normalizedInput);

      case CONVERSATION_STEPS.GUESTS:
        return this.processDateTime(normalizedInput);

      case CONVERSATION_STEPS.DATE_TIME:
        return this.processCuisine(normalizedInput);

      case CONVERSATION_STEPS.CUISINE:
        return this.processSpecialRequests(input);

      case CONVERSATION_STEPS.WEATHER_CHECK:
        return this.processSeating(normalizedInput);

      case CONVERSATION_STEPS.SEATING:
        return this.processConfirmation(normalizedInput);

      default:
        return { success: false, message: "I didn't understand that. Could you please repeat?" };
    }
  }

  /**
   * Process name
   */
  processName(input) {
    if (input && input.trim().length > 0) {
      this.bookingData.customerName = input.trim();
      this.currentStep = CONVERSATION_STEPS.NAME;
      return { success: true, data: input.trim() };
    }
    return { success: false, message: "I didn't catch your name. Could you please repeat?" };
  }

  /**
   * Process number of guests
   */
  processGuests(input) {
    console.log('🎤 Processing guests input:', input);

    // Normalize input
    let normalizedInput = input.toLowerCase().trim();

    // Word to number map with variations
    const wordToNumber = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      // Common variations/misheard
      'for': 4, 'fore': 4,
      'to': 2, 'too': 2, 'tu': 2,
      'tree': 3, 'free': 3,
      'ate': 8,
      'won': 1,
      'sex': 6,
      'tin': 10,
      // Special phrases
      'couple': 2, 'few': 3, 'several': 4,
      'single': 1, 'alone': 1, 'one person': 1
    };

    let guests = 0;

    // 1. Try to extract direct number (e.g., "4", "10")
    const numberMatch = normalizedInput.match(/\b(\d+)\b/);
    if (numberMatch) {
      guests = parseInt(numberMatch[1]);
      console.log('✅ Found direct number:', guests);
    }

    // 2. If no direct number, check for word numbers
    if (guests === 0) {
      // Split into words and check each
      const words = normalizedInput.split(/\s+/);

      for (const word of words) {
        if (wordToNumber[word] !== undefined) {
          guests = wordToNumber[word];
          console.log('✅ Found word number:', word, '=', guests);
          break;
        }
      }

      // 3. Check for partial matches in the entire input
      if (guests === 0) {
        for (const [word, num] of Object.entries(wordToNumber)) {
          if (normalizedInput.includes(word)) {
            guests = num;
            console.log('✅ Found partial match:', word, '=', guests);
            break;
          }
        }
      }
    }

    // Validate and return
    if (guests > 0 && guests <= 20) {
      this.bookingData.numberOfGuests = guests;
      this.currentStep = CONVERSATION_STEPS.GUESTS;
      console.log('✅ Successfully set guests to:', guests);
      return { success: true, data: guests };
    }

    console.log('❌ Could not extract valid guest count from:', input);
    return {
      success: false,
      message: "I didn't catch that. How many people will be dining? Just say the number, like 'two', 'four', or 'six'."
    };
  }

  /**
   * Process date and time together
   */
  processDateTime(input) {
    console.log('📅⏰ Processing date and time input:', input);

    // First extract time - improved regex to handle all formats
    let time = '';
    let normalizedInput = input.toLowerCase().trim();
    normalizedInput = normalizedInput.replace(/\s+/g, ' ');
    normalizedInput = normalizedInput.replace(/\./g, ''); // Remove periods from p.m./a.m.

    console.log('Normalized input:', normalizedInput);

    // Match time pattern: 11:00 pm, 11 pm, 11:00pm, etc.
    const timeMatch = normalizedInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] || '00';
      const meridiem = timeMatch[3];

      console.log('Matched - Hours:', hours, 'Minutes:', minutes, 'Meridiem:', meridiem);

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
      }

      console.log('Converted to 24-hour:', hours);

      // Validate restaurant hours: 10 AM (10) to 11 PM (23)
      if (hours >= 10 && hours <= 23) {
        time = `${hours.toString().padStart(2, '0')}:${minutes}`;
        this.bookingData.bookingTime = time;
        console.log('✅ Time extracted and stored:', time);
      } else {
        console.log('❌ Hours out of range:', hours);
      }
    } else {
      console.log('❌ Time pattern not matched in:', normalizedInput);
    }

    if (!time) {
      return {
        success: false,
        message: "I didn't catch the time. Please say date and time together, like 'tomorrow at 7 PM' or 'December 15th at 8 PM'."
      };
    }

    // Now extract date
    let date = new Date();

    if (input.includes('today')) {
      date = new Date();
    } else if (input.includes('tomorrow')) {
      date = new Date();
      date.setDate(date.getDate() + 1);
    } else if (input.includes('day after tomorrow')) {
      date = new Date();
      date.setDate(date.getDate() + 2);
    } else {
      const dateMatch = input.match(/(\d{1,2})[/-\s](\d{1,2})[/-\s]?(\d{2,4})?/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
        date = new Date(year, month, day);
      } else {
        const parsedDate = this.parseNaturalDate(input);
        if (parsedDate) {
          date = parsedDate;
        } else {
          return {
            success: false,
            message: "I didn't catch the date. Please say date and time together, like 'tomorrow at 7 PM' or 'December 15th at 8 PM'."
          };
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return { success: false, message: "That date is in the past. Please choose a future date with time, like 'tomorrow at 7 PM'." };
    }

    // Store date in local format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.bookingData.bookingDate = `${year}-${month}-${day}`;

    this.currentStep = CONVERSATION_STEPS.DATE_TIME;
    console.log('✅ Date extracted:', date.toLocaleDateString());
    console.log('✅ Combined booking:', date.toLocaleDateString(), 'at', time);
    console.log('✅ Stored as:', this.bookingData.bookingDate, 'at', time);

    return {
      success: true,
      data: `${date.toLocaleDateString()} at ${time}`
    };
  }

  /**
   * Process date (legacy - keeping for reference)
   */
  processDate(input) {
    let date = new Date();

    // Check for common date keywords
    if (input.includes('today')) {
      date = new Date();
    } else if (input.includes('tomorrow')) {
      date = new Date();
      date.setDate(date.getDate() + 1);
    } else if (input.includes('day after tomorrow')) {
      date = new Date();
      date.setDate(date.getDate() + 2);
    } else {
      // Try to extract date
      const dateMatch = input.match(/(\d{1,2})[/-\s](\d{1,2})[/-\s]?(\d{2,4})?/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
        date = new Date(year, month, day);
      } else {
        // Try parsing natural language date
        const parsedDate = this.parseNaturalDate(input);
        if (parsedDate) {
          date = parsedDate;
        } else {
          return { success: false, message: "I didn't understand the date. Please say it like 'tomorrow' or 'December 5th'." };
        }
      }
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return { success: false, message: "That date is in the past. Please choose a future date." };
    }

    this.bookingData.bookingDate = date.toISOString();
    this.currentStep = CONVERSATION_STEPS.DATE_TIME;
    return { success: true, data: date.toLocaleDateString() };
  }

  /**
   * Parse natural language date
   */
  parseNaturalDate(input) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];

    for (let i = 0; i < months.length; i++) {
      if (input.includes(months[i])) {
        const dayMatch = input.match(/(\d{1,2})/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          const year = new Date().getFullYear();
          return new Date(year, i, day);
        }
      }
    }
    return null;
  }

  /**
   * Process time
   */
  processTime(input) {
    console.log('⏰ Processing time input:', input);

    let time = '';

    // Normalize input - remove extra spaces and standardize
    let normalizedInput = input.toLowerCase().trim();

    // Replace common speech-to-text variations
    normalizedInput = normalizedInput.replace(/\s+/g, ' '); // Normalize spaces
    normalizedInput = normalizedInput.replace(/\./g, ''); // Remove periods from a.m./p.m.

    console.log('Normalized input:', normalizedInput);    // Extract time patterns - more flexible regex
    // Matches: 8pm, 8 pm, 8:00pm, 8:00 pm, 800pm, etc.
    const timeMatch = normalizedInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] || '00';
      let meridiem = timeMatch[3]?.toLowerCase();

      // Also check if pm/am appears anywhere in the input
      if (!meridiem) {
        if (normalizedInput.includes('pm')) meridiem = 'pm';
        else if (normalizedInput.includes('am')) meridiem = 'am';
      }

      console.log('Parsed - Hours:', hours, 'Minutes:', minutes, 'Meridiem:', meridiem);

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours < 12) {
        hours += 12;
        console.log('Converted PM to 24-hour:', hours);
      } else if (meridiem === 'am' && hours === 12) {
        hours = 0;
        console.log('Converted 12 AM to midnight:', hours);
      } else if (!meridiem && hours < 12) {
        // No AM/PM specified - assume PM for typical dinner hours
        if (hours >= 6 && hours <= 11) {
          hours += 12;
          console.log('Assuming PM for dinner hour:', hours);
        } else if (hours === 12) {
          // Keep 12 as noon if no meridiem
          console.log('12 without meridiem - assuming noon');
        }
      }

      console.log('Final hours:', hours);

      // Validate restaurant hours: 10 AM (10) to 11 PM (23)
      if (hours >= 10 && hours <= 23) {
        time = `${hours.toString().padStart(2, '0')}:${minutes}`;
        this.bookingData.bookingTime = time;
        this.currentStep = CONVERSATION_STEPS.DATE_TIME;
        console.log('✅ Time accepted:', time);
        return { success: true, data: time };
      } else {
        console.log('❌ Hours out of range. Got:', hours, 'Need: 10-23');
        return {
          success: false,
          message: "We're open from 10 AM to 11 PM. Please choose a time within these hours, like '7 PM' or '8 PM'."
        };
      }
    }

    console.log('❌ Could not parse time from input:', normalizedInput);
    return {
      success: false,
      message: "I didn't catch the time. Please say it clearly like '7 PM', '8 PM', or '19:30'."
    };
  }

  /**
   * Process cuisine preference
   */
  processCuisine(input) {
    // Check if user wants to skip
    if (input.includes('no') || input.includes('none') || input.includes('skip') || input.includes('not sure')) {
      this.bookingData.cuisinePreference = 'No Preference';
      this.currentStep = CONVERSATION_STEPS.CUISINE;
      return { success: true, data: 'No Preference', skipped: true };
    }

    for (const cuisine of CUISINE_OPTIONS) {
      if (input.includes(cuisine.toLowerCase())) {
        this.bookingData.cuisinePreference = cuisine;
        this.currentStep = CONVERSATION_STEPS.CUISINE;
        return { success: true, data: cuisine };
      }
    }

    // Default to "Other" if specific cuisine not found
    this.bookingData.cuisinePreference = 'Other';
    this.currentStep = CONVERSATION_STEPS.CUISINE;
    return { success: true, data: 'Other' };
  }

  /**
   * Process special requests
   */
  processSpecialRequests(input) {
    const normalizedInput = input.toLowerCase().trim();

    if (normalizedInput.includes('no') || normalizedInput.includes('none') || normalizedInput.includes('nothing')) {
      this.bookingData.specialRequests = 'None';
    } else {
      this.bookingData.specialRequests = input.trim();
    }

    this.currentStep = CONVERSATION_STEPS.SPECIAL_REQUESTS;
    return { success: true, data: this.bookingData.specialRequests };
  }

  /**
   * Set weather suggestion
   */
  setWeatherSuggestion(weatherData) {
    this.weatherSuggestion = weatherData;
    this.bookingData.weatherInfo = weatherData.weather;
    this.currentStep = CONVERSATION_STEPS.WEATHER_CHECK;
  }

  setAvailabilityPlan(availability) {
    this.bookingData.tableAssignment = availability.tableAssignment;
    this.bookingData.bookingDurationMinutes = availability.bookingDurationMinutes;
    this.bookingData.arrivalGuidance = availability.arrivalGuidance;
    this.bookingData.estimatedArrivalTime = availability.arrivalGuidance?.estimatedArrivalTime || '';
    this.bookingData.prepStartTime = availability.arrivalGuidance?.prepStartTime || '';
    this.bookingData.tableReadyTime = availability.arrivalGuidance?.tableReadyTime || '';
    this.bookingData.bookingEndTime = availability.arrivalGuidance?.bookingEndTime || '';
    this.bookingData.availabilitySnapshot = {
      availableTableCount: availability.availableTableCount,
      blockedTableCount: availability.blockedTableCount,
      totalTableCount: availability.totalTableCount
    };
  }

  requestDifferentDateTime() {
    this.bookingData.bookingDate = '';
    this.bookingData.bookingTime = '';
    this.currentStep = CONVERSATION_STEPS.GUESTS;
  }

  requestDifferentSeating() {
    this.bookingData.seatingPreference = 'No Preference';
    this.bookingData.tableAssignment = null;
    this.currentStep = CONVERSATION_STEPS.WEATHER_CHECK;
  }

  /**
   * Process seating preference
   */
  processSeating(input) {
    let seating = 'Indoor';

    // If user says 'yes', use the weather suggestion
    if (input.includes('yes')) {
      seating = this.weatherSuggestion?.seatingSuggestion?.preference || 'Indoor';
      console.log('✅ User accepted suggestion:', seating);
    }
    // Check for outdoor preference
    else if (input.includes('outdoor') || input.includes('outside')) {
      seating = 'Outdoor';
    }
    // Check for indoor preference
    else if (input.includes('indoor') || input.includes('inside') || input.includes('no')) {
      seating = 'Indoor';
    }
    // Check for window seating request
    else if (input.includes('window')) {
      seating = 'Indoor';
      // Add window seating to special requests if not already there
      if (!this.bookingData.specialRequests.toLowerCase().includes('window')) {
        const current = this.bookingData.specialRequests === 'None' ? '' : this.bookingData.specialRequests + ', ';
        this.bookingData.specialRequests = current + 'Window seating';
      }
    }

    this.bookingData.seatingPreference = seating;
    this.currentStep = CONVERSATION_STEPS.SEATING;
    return { success: true, data: seating };
  }

  /**
   * Get confirmation message
   */
  getConfirmationMessage() {
    // Parse date correctly
    const dateObj = this.bookingData.bookingDate.includes('-')
      ? new Date(this.bookingData.bookingDate + 'T00:00:00')
      : new Date(this.bookingData.bookingDate);
    const date = dateObj.toLocaleDateString();

    // Format time to 12-hour
    const [hours, minutes] = this.bookingData.bookingTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;

    const cuisineText = this.bookingData.cuisinePreference !== 'No Preference'
      ? `${this.bookingData.cuisinePreference} cuisine.`
      : '';
    const specialRequestText = this.bookingData.specialRequests !== 'None'
      ? `Special requests: ${this.bookingData.specialRequests}.`
      : '';
    const tableText = this.bookingData.tableAssignment
      ? `Table ${this.bookingData.tableAssignment.tableId}, ${this.bookingData.tableAssignment.seating.toLowerCase()} seating.`
      : `${this.bookingData.seatingPreference} seating.`;
    const arrivalText = this.bookingData.arrivalGuidance?.message
      ? `${this.bookingData.arrivalGuidance.message}`
      : '';

    return `Let me confirm your booking: ${this.bookingData.customerName}, table for ${this.bookingData.numberOfGuests} guests on ${date} at ${formattedTime}. ${cuisineText} ${tableText} ${arrivalText} ${specialRequestText} Is this correct? Say 'yes' to confirm or 'no' to start over.`;
  }

  /**
   * Process confirmation
   */
  processConfirmation(input) {
    if (input.includes('yes') || input.includes('correct') || input.includes('confirm')) {
      this.currentStep = CONVERSATION_STEPS.CONFIRMATION;
      return { success: true, confirmed: true };
    } else if (input.includes('no') || input.includes('wrong') || input.includes('start over')) {
      this.reset();
      return { success: true, confirmed: false };
    }
    return { success: false, message: "Please say 'yes' to confirm or 'no' to start over." };
  }

  /**
   * Mark conversation as complete
   */
  complete() {
    this.currentStep = CONVERSATION_STEPS.COMPLETE;
  }

  /**
   * Get booking data
   */
  getBookingData() {
    return this.bookingData;
  }

  /**
   * Is conversation complete
   */
  isComplete() {
    return this.currentStep === CONVERSATION_STEPS.COMPLETE;
  }
}

export default ConversationFlowService;
export { CONVERSATION_STEPS, CUISINE_OPTIONS };
