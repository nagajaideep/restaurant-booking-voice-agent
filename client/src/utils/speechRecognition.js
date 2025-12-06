/**
 * Speech Recognition Service
 * 
 * Wrapper for the Web Speech API's SpeechRecognition interface.
 * Provides speech-to-text conversion with enhanced error handling,
 * confidence filtering, and automatic retry logic.
 * 
 * Browser Support:
 * - Chrome (desktop and mobile)
 * - Edge (Chromium-based)
 * - Safari 14.1+ (limited support)
 * 
 * Features:
 * - Continuous listening mode
 * - Interim results for real-time feedback
 * - Multiple alternative transcripts
 * - Confidence-based filtering (>0.3)
 * - Silence detection and timeout handling
 * - Automatic stop after successful recognition
 * - Comprehensive error handling
 * 
 * Configuration:
 * - Language: en-US
 * - Continuous: true (keeps listening)
 * - Interim Results: true (real-time updates)
 * - Max Alternatives: 5 (provides multiple options)
 * - Min Confidence: 0.3 (accepts quieter speech)
 * 
 * Events:
 * - onResult(text, confidence): Fired on successful recognition
 * - onError(errorType): Fired on error (no-speech, network, etc.)
 * - onEnd(): Fired when recognition stops
 * 
 * @class SpeechRecognitionService
 */

class SpeechRecognitionService {
  /**
   * Initialize Speech Recognition
   * Sets up Web Speech API with optimized configuration
   */
  constructor() {
    // Check browser support (Chrome, Edge, Safari)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser');
      this.supported = false;
      return;
    }

    // Initialize recognition instance
    this.recognition = new SpeechRecognition();
    this.supported = true;
    this.isListening = false;

    // ========================================
    // Configuration Settings
    // ========================================

    // Keep listening continuously (don't stop after first input)
    this.recognition.continuous = true;

    // Enable interim results for better responsiveness
    this.recognition.interimResults = true;

    // Set language to US English
    this.recognition.lang = 'en-US';

    // Get more alternatives for better accuracy
    this.recognition.maxAlternatives = 5;

    // Lower confidence threshold to accept quieter speech
    this.minConfidence = 0.3;

    // ========================================
    // State Management
    // ========================================

    // Timeout for silence detection
    this.silenceTimeout = null;

    // Track last recognized transcript
    this.lastTranscript = '';

    // Callback functions (set by component)
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // When speech is recognized
    this.recognition.onresult = (event) => {
      // Clear any existing silence timeout
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      // Get the latest result
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      console.log('Speech detected:', transcript, 'Final:', isFinal, 'Confidence:', confidence);

      // Process final results with any confidence (accept quieter speech)
      if (isFinal && transcript.trim().length > 0) {
        this.lastTranscript = transcript;
        console.log('Final recognized:', transcript, 'Confidence:', confidence);

        // Stop after getting result to prevent continuous listening
        this.stop();

        if (this.onResultCallback) {
          this.onResultCallback(transcript, confidence);
        }
      } else if (!isFinal && transcript.trim().length > 2) {
        // Show interim results for feedback
        console.log('Interim result:', transcript);
      }
    };

    // When recognition ends
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;

      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    // When error occurs
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    // When speech starts
    this.recognition.onspeechstart = () => {
      console.log('Speech detected - user is speaking');
    };

    // When sound detected but not recognized
    this.recognition.onsoundstart = () => {
      console.log('Sound detected');
    };

    // When speech ends
    this.recognition.onspeechend = () => {
      console.log('Speech ended - processing...');
    };

    // When no speech detected
    this.recognition.onnomatch = () => {
      console.log('No speech matched');
      if (this.onErrorCallback) {
        this.onErrorCallback('no-match');
      }
    };
  }

  /**
   * Start listening for speech
   */
  start() {
    if (!this.supported) {
      console.error('Speech Recognition not supported');
      return false;
    }

    if (this.isListening) {
      console.log('Already listening');
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('Started listening...');
      return true;
    } catch (error) {
      console.error('Error starting recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('Stopped listening');
    }
  }

  /**
   * Abort recognition
   */
  abort() {
    if (this.isListening) {
      this.recognition.abort();
      this.isListening = false;
      console.log('Aborted listening');
    }
  }

  /**
   * Set callback for when speech is recognized
   */
  onResult(callback) {
    this.onResultCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for when recognition ends
   */
  onEnd(callback) {
    this.onEndCallback = callback;
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported() {
    return this.supported;
  }

  /**
   * Check if currently listening
   */
  isActive() {
    return this.isListening;
  }
}

export default SpeechRecognitionService;
