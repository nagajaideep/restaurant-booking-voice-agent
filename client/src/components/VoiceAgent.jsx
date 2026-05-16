/**
 * Voice Agent Component
 * 
 * Main React component for the restaurant booking voice interface.
 * Provides voice-based interaction for making restaurant reservations.
 * 
 * Features:
 * - Speech-to-text for user input
 * - Text-to-speech for agent responses
 * - Conversation state management
 * - Weather API integration
 * - Real-time transcription display
 * - Error handling and retry logic (up to 3 retries)
 * - Visual feedback (listening, speaking states)
 * 
 * State Management:
 * - isActive: Whether conversation is active
 * - isListening: Currently capturing speech
 * - isSpeaking: Agent is speaking
 * - transcript: Current user speech text
 * - conversation: Array of {role, message} objects
 * - bookingConfirmed: Booking has been created
 * - retryCount: Number of retry attempts
 * - canContinue: User can continue to next question
 * 
 * Services Used:
 * - SpeechRecognitionService: Browser speech-to-text
 * - SpeechSynthesisService: Browser text-to-speech
 * - ConversationFlowService: Conversation state machine
 * - apiService: Backend API calls
 * 
 * @component
 */

import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognitionService from '../utils/speechRecognition';
import SpeechSynthesisService from '../utils/speechSynthesis';
import ConversationFlowService from '../services/conversationFlow';
import apiService from '../services/apiService';
import './VoiceAgent.css';

const VoiceAgent = ({ onBookingCreated }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const maxRetries = 3;

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const conversationFlowRef = useRef(null);

  useEffect(() => {
    // Initialize services
    recognitionRef.current = new SpeechRecognitionService();
    synthesisRef.current = new SpeechSynthesisService();
    conversationFlowRef.current = new ConversationFlowService();

    // Check browser support
    if (!recognitionRef.current.isSupported()) {
      setError('Speech Recognition is not supported in your browser. Please use Chrome or Edge.');
    }

    if (!synthesisRef.current.isSupported()) {
      setError('Speech Synthesis is not supported in your browser. Please use Chrome or Edge.');
    }

    // Setup recognition callbacks
    recognitionRef.current.onResult((text, confidence) => {
      console.log('Voice input received:', text, 'Confidence:', confidence);
      setTranscript(text);
      setIsListening(false);
      setRetryCount(0); // Reset retry count on successful input
      setCanContinue(false); // Reset continue state
      handleUserInput(text);
    });

    recognitionRef.current.onError((error) => {
      console.error('Recognition error:', error);
      setIsListening(false);

      if (error === 'no-speech' || error === 'no-match') {
        handleNoSpeechDetected();
      } else if (error === 'not-allowed' || error === 'permission-denied') {
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else if (error === 'audio-capture') {
        const audioErrorMsg = "I'm having trouble accessing the microphone. Let me try again.";
        speak(audioErrorMsg).then(() => {
          setTimeout(() => handleNoSpeechDetected(), 1000);
        });
      } else if (error === 'network') {
        const networkErrorMsg = "Network error. Let me try again.";
        speak(networkErrorMsg).then(() => {
          setTimeout(() => handleNoSpeechDetected(), 1000);
        });
      } else if (error === 'aborted') {
        console.log('Recognition aborted by user');
      } else {
        handleNoSpeechDetected();
      }
    });

    recognitionRef.current.onEnd(() => {
      console.log('Recognition ended, isListening:', recognitionRef.current.isActive());
      setIsListening(false);

      // Auto-restart if still active and not speaking
      if (isActive && !isSpeaking && !recognitionRef.current.isActive()) {
        console.log('Recognition ended unexpectedly, may need to restart');
      }
    });

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  /**
   * Start Conversation
   * 
   * Initiates the booking conversation flow.
   * Resets all state, plays greeting, and starts listening.
   * 
   * Flow:
   * 1. Reset all states (active, conversation, retry count)
   * 2. Reset conversation flow service
   * 3. Get and speak greeting message
   * 4. Wait for speech to complete (800ms delay)
   * 5. Start listening for user input
   * 
   * @async
   * @function startConversation
   */
  const startConversation = async () => {
    setIsActive(true);
    setError('');
    setBookingConfirmed(false);
    setConversation([]);
    setRetryCount(0);
    conversationFlowRef.current.reset();

    // Get greeting from conversation flow
    const greeting = conversationFlowRef.current.getPrompt();
    addMessage('agent', greeting);
    await speak(greeting);

    // Wait for speech synthesis to complete
    await new Promise(resolve => setTimeout(resolve, 800));

    // Start listening for user response
    startListening();
  };

  /**
   * Stop conversation
   */
  const stopConversation = () => {
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }

    addMessage('agent', 'Conversation ended. Feel free to start again anytime!');
  };

  /**
   * Continue conversation from current step
   */
  const continueConversation = async () => {
    setCanContinue(false);
    setIsActive(true);
    setRetryCount(0);

    // Get current prompt and repeat it
    const currentPrompt = conversationFlowRef.current.getPrompt();
    addMessage('agent', currentPrompt);
    await speak(currentPrompt);

    // Wait for speech to finish before starting to listen
    await new Promise(resolve => setTimeout(resolve, 800));

    // Start listening again
    startListening();
  };

  /**
   * Start listening
   */
  const startListening = () => {
    if (!recognitionRef.current.isSupported()) {
      setError('Speech Recognition not supported');
      return;
    }

    // Don't start if already listening
    if (recognitionRef.current.isActive()) {
      console.log('Already listening, skipping start');
      return;
    }

    // Don't start if speaking
    if (isSpeaking) {
      console.log('Currently speaking, will start listening after');
      return;
    }

    console.log('Starting to listen...');
    setIsListening(true);
    setTranscript('');

    try {
      const started = recognitionRef.current.start();
      if (!started) {
        console.error('Failed to start recognition');
        setIsListening(false);
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      // Try again after a delay
      setTimeout(() => {
        if (isActive && !isSpeaking) {
          startListening();
        }
      }, 1000);
    }
  };

  /**
   * Speak text
   */
  const speak = async (text) => {
    if (!synthesisRef.current.isSupported()) {
      console.error('Speech Synthesis not supported');
      return;
    }

    setIsSpeaking(true);

    try {
      await synthesisRef.current.speak(text);
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  /**
   * Handle no speech detected - repeat the current question
   */
  const handleNoSpeechDetected = async () => {
    // Check retry limit
    if (retryCount >= maxRetries) {
      const maxRetriesMsg = "I'm having trouble hearing you. Click the 'Continue' button below when you're ready to try again.";
      addMessage('agent', maxRetriesMsg);
      await speak(maxRetriesMsg);
      setCanContinue(true);
      setIsActive(false);
      return;
    }

    setRetryCount(prev => prev + 1);

    // Different messages for variety
    const retryMessages = [
      "I didn't hear anything. Let me ask again.",
      "Sorry, I didn't catch that. Let me repeat.",
      "I couldn't hear you clearly. One more time."
    ];

    const retryMsg = retryMessages[retryCount % retryMessages.length];
    addMessage('agent', retryMsg);
    await speak(retryMsg);

    // Wait a moment before repeating
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get current prompt and repeat it
    const currentPrompt = conversationFlowRef.current.getPrompt();
    addMessage('agent', currentPrompt);
    await speak(currentPrompt);

    // Wait for speech to finish before starting to listen
    await new Promise(resolve => setTimeout(resolve, 500));

    // Start listening again
    startListening();
  };

  /**
   * Handle user input
   */
  const handleUserInput = async (userInput) => {
    addMessage('user', userInput);

    // Process input through conversation flow
    const result = conversationFlowRef.current.processInput(userInput);

    if (!result.success) {
      // Error or didn't understand
      const errorMsg = result.message || "I didn't understand that. Could you please repeat?";
      addMessage('agent', errorMsg);
      await speak(errorMsg);

      // Wait a bit before listening again
      await new Promise(resolve => setTimeout(resolve, 800));
      startListening();
      return;
    }

    // Check if we need to fetch weather
    if (conversationFlowRef.current.getCurrentStep() === 'date_time') {
      await handleAvailabilityCheck();
      return;
    }

    // Re-check availability after the guest picks indoor/outdoor seating.
    if (conversationFlowRef.current.getCurrentStep() === 'seating') {
      await handleSeatingAvailabilityCheck();
      return;
    }

    // Check if we need to fetch weather
    if (conversationFlowRef.current.getCurrentStep() === 'special_requests') {
      await handleWeatherCheck();
      return;
    }

    // Check if confirmation
    if (conversationFlowRef.current.getCurrentStep() === 'confirmation') {
      if (result.confirmed) {
        await handleBookingConfirmation();
      } else {
        // User wants to start over
        const restartMsg = "Alright, let's start over.";
        addMessage('agent', restartMsg);
        await speak(restartMsg);
        setTimeout(() => startConversation(), 1000);
      }
      return;
    }

    // Get next prompt
    const nextPrompt = conversationFlowRef.current.getPrompt();
    addMessage('agent', nextPrompt);
    await speak(nextPrompt);

    // Wait for speech to finish before listening
    await new Promise(resolve => setTimeout(resolve, 800));

    // Continue listening if not complete
    if (!conversationFlowRef.current.isComplete()) {
      startListening();
    } else {
      setIsActive(false);
    }
  };

  const formatAlternatives = (alternativeSlots = []) => {
    if (!alternativeSlots.length) {
      return 'Please try another time or seating preference.';
    }

    const options = alternativeSlots.map(slot => slot.displayTime).join(', ');
    return `Nearby available times are ${options}.`;
  };

  const checkCurrentAvailability = async (seatingPreferenceOverride) => {
    const bookingData = conversationFlowRef.current.getBookingData();

    const response = await apiService.checkAvailability({
      date: bookingData.bookingDate,
      time: bookingData.bookingTime,
      guests: bookingData.numberOfGuests,
      seatingPreference: seatingPreferenceOverride || bookingData.seatingPreference || 'No Preference'
    });

    return response.data;
  };

  const handleAvailabilityCheck = async () => {
    const checkingMsg = 'Let me check table availability for that date and time.';
    addMessage('agent', checkingMsg);
    await speak(checkingMsg);

    try {
      const availability = await checkCurrentAvailability('No Preference');

      if (!availability.available) {
        conversationFlowRef.current.requestDifferentDateTime();
        const unavailableMsg = `I do not have a suitable table at that time. ${formatAlternatives(availability.alternativeSlots)} What date and time should I check instead?`;
        addMessage('agent', unavailableMsg);
        await speak(unavailableMsg);
        startListening();
        return;
      }

      conversationFlowRef.current.setAvailabilityPlan(availability);
      const availableMsg = `${availability.reason} ${availability.arrivalGuidance.message}`;
      addMessage('agent', availableMsg);
      await speak(availableMsg);

      const nextPrompt = conversationFlowRef.current.getPrompt();
      addMessage('agent', nextPrompt);
      await speak(nextPrompt);
      await new Promise(resolve => setTimeout(resolve, 800));
      startListening();
    } catch (error) {
      const fallbackMsg = 'I could not reach the availability service, but I can keep collecting the reservation details and verify at confirmation.';
      addMessage('agent', fallbackMsg);
      await speak(fallbackMsg);

      const nextPrompt = conversationFlowRef.current.getPrompt();
      addMessage('agent', nextPrompt);
      await speak(nextPrompt);
      startListening();
    }
  };

  const handleSeatingAvailabilityCheck = async () => {
    try {
      const availability = await checkCurrentAvailability();

      if (!availability.available) {
        conversationFlowRef.current.requestDifferentSeating();
        const unavailableMsg = `That seating area is full for your time. ${formatAlternatives(availability.alternativeSlots)} Would you prefer indoor, outdoor, or no preference?`;
        addMessage('agent', unavailableMsg);
        await speak(unavailableMsg);
        startListening();
        return;
      }

      conversationFlowRef.current.setAvailabilityPlan(availability);
      const tableMsg = `Good news, ${availability.tableAssignment.seating.toLowerCase()} table ${availability.tableAssignment.tableId} is available.`;
      addMessage('agent', tableMsg);
      await speak(tableMsg);

      const nextPrompt = conversationFlowRef.current.getPrompt();
      addMessage('agent', nextPrompt);
      await speak(nextPrompt);
      await new Promise(resolve => setTimeout(resolve, 800));
      startListening();
    } catch (error) {
      const nextPrompt = conversationFlowRef.current.getPrompt();
      addMessage('agent', nextPrompt);
      await speak(nextPrompt);
      startListening();
    }
  };

  /**
   * Handle weather check
   */
  const handleWeatherCheck = async () => {
    const bookingData = conversationFlowRef.current.getBookingData();

    console.log('🔍 Weather check - Raw booking data:', {
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime
    });

    const bookingDate = new Date(bookingData.bookingDate + 'T00:00:00');
    const formattedDate = bookingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const bookingTime = bookingData.bookingTime;

    // Format time to 12-hour format with AM/PM
    const [hours, minutes] = bookingTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;

    console.log('🔍 Formatted for display:', {
      formattedDate,
      formattedTime,
      originalTime: bookingTime
    });

    const location = process.env.REACT_APP_DEFAULT_LOCATION || 'Hyderabad';

    const checkingMsg = `Let me check the weather in ${location} for ${formattedDate} at ${formattedTime}, your booking time...`;
    addMessage('agent', checkingMsg);
    await speak(checkingMsg);

    try {
      const bookingData = conversationFlowRef.current.getBookingData();
      // Use the date string directly if it's already in YYYY-MM-DD format
      const bookingDate = bookingData.bookingDate.includes('-') ? bookingData.bookingDate : new Date(bookingData.bookingDate).toISOString().split('T')[0];
      const bookingTime = bookingData.bookingTime;
      const location = process.env.REACT_APP_DEFAULT_LOCATION || 'Hyderabad';

      const weatherResponse = await apiService.getWeather(bookingDate, location, bookingTime);
      const weatherData = weatherResponse.data;

      // Set weather in conversation flow
      conversationFlowRef.current.setWeatherSuggestion(weatherData);

      // Announce weather results
      const weatherInfoMsg = `I've checked the weather forecast from OpenWeatherMap API. ${weatherData.seatingSuggestion.message}`;
      addMessage('agent', weatherInfoMsg);
      await speak(weatherInfoMsg);

      // Wait before asking seating preference
      await new Promise(resolve => setTimeout(resolve, 800));

      // Ask for seating preference based on suggestion
      const suggestedSeating = weatherData.seatingSuggestion.preference;
      const seatingPrompt = `Would you like ${suggestedSeating.toLowerCase()} seating? You can say 'yes' for ${suggestedSeating.toLowerCase()}, or choose 'indoor' or 'outdoor' seating.`;
      addMessage('agent', seatingPrompt);
      await speak(seatingPrompt);

      startListening();
    } catch (error) {
      console.error('Weather fetch error:', error);
      const location = process.env.REACT_APP_DEFAULT_LOCATION || 'Hyderabad';
      const fallbackMsg = `I couldn't fetch the weather forecast for ${location} at the moment, but we can proceed. Would you prefer indoor or outdoor seating?`;
      addMessage('agent', fallbackMsg);
      await speak(fallbackMsg);
      conversationFlowRef.current.currentStep = 'weather_check';
      startListening();
    }
  };

  /**
   * Handle booking confirmation
   */
  const handleBookingConfirmation = async () => {
    const processingMsg = "Perfect! Let me confirm your booking...";
    addMessage('agent', processingMsg);
    await speak(processingMsg);

    try {
      const bookingData = conversationFlowRef.current.getBookingData();
      const response = await apiService.createBooking(bookingData);

      if (response.success) {
        setBookingConfirmed(true);
        const arrivalMessage = response.data.arrivalGuidance?.message
          ? ` ${response.data.arrivalGuidance.message}`
          : '';
        const tableMessage = response.data.tableAssignment?.tableId
          ? ` Table ${response.data.tableAssignment.tableId} is reserved for you.`
          : '';
        const confirmationMsg = `Excellent! Your booking has been confirmed. Your booking ID is ${response.data.bookingId}.${tableMessage}${arrivalMessage} Thank you for choosing our restaurant!`;
        addMessage('agent', confirmationMsg);
        await speak(confirmationMsg);

        if (onBookingCreated) {
          onBookingCreated(response.data);
        }

        conversationFlowRef.current.complete();

        setTimeout(() => {
          setIsActive(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg = `Sorry, there was an error confirming your booking: ${error.message}. Would you like to try again?`;
      addMessage('agent', errorMsg);
      await speak(errorMsg);
    }
  };

  /**
   * Add message to conversation
   */
  const addMessage = (sender, text) => {
    setConversation(prev => [...prev, { sender, text, timestamp: new Date() }]);
  };

  return (
    <div className="voice-agent">
      <div className="voice-agent-header">
        <h1>🎙️ Restaurant Booking Voice Agent</h1>
        <p>Click "Start" to book a table using your voice</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="voice-agent-controls">
        {!isActive ? (
          <button
            className="btn btn-start"
            onClick={startConversation}
            disabled={!!error}
          >
            🎤 Start Conversation
          </button>
        ) : (
          <button
            className="btn btn-stop"
            onClick={stopConversation}
          >
            ⏹️ Stop Conversation
          </button>
        )}

        {canContinue && (
          <button
            className="btn btn-continue"
            onClick={continueConversation}
          >
            ▶️ Continue from Here
          </button>
        )}
      </div>

      {isActive && (
        <div className="voice-status">
          {isSpeaking && (
            <div className="status-indicator speaking">
              <span className="pulse"></span>
              <span>Agent is speaking...</span>
            </div>
          )}
          {isListening && (
            <div className="status-indicator listening">
              <span className="pulse"></span>
              <span>Listening...</span>
            </div>
          )}
        </div>
      )}

      {transcript && (
        <div className="transcript-box">
          <strong>You said:</strong> {transcript}
        </div>
      )}

      <div className="conversation-container">
        {conversation.length === 0 && !isActive && (
          <div className="placeholder">
            <p>👋 Ready to make a reservation?</p>
            <p>Click "Start Conversation" to begin</p>
          </div>
        )}

        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender}`}
          >
            <div className="message-avatar">
              {msg.sender === 'agent' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.text}</div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {bookingConfirmed && (
          <div className="confirmation-badge">
            ✅ Booking Confirmed!
          </div>
        )}
      </div>

      <div className="voice-agent-footer">
        <p>💡 Tip: Speak clearly and wait for the agent to finish before responding</p>
        <p>🌐 Best experienced in Chrome or Edge browsers</p>
      </div>
    </div>
  );
};

export default VoiceAgent;
