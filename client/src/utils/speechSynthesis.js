/**
 * Speech Synthesis Service
 * 
 * Wrapper for the Web Speech API's SpeechSynthesis interface.
 * Provides text-to-speech conversion with voice selection,
 * customizable speech parameters, and promise-based API.
 * 
 * Browser Support:
 * - Chrome (desktop and mobile)
 * - Edge (Chromium-based)
 * - Safari (desktop and mobile)
 * - Firefox (desktop)
 * 
 * Features:
 * - Text-to-speech conversion
 * - Voice selection (prefers female voices)
 * - Customizable pitch, rate, and volume
 * - Promise-based speak() method
 * - Pause/resume support
 * - Cancel ongoing speech
 * - Browser compatibility checking
 * 
 * Voice Settings:
 * - Language: en-US (US English)
 * - Pitch: 1.0 (normal)
 * - Rate: 1.0 (normal speed)
 * - Volume: 1.0 (full volume)
 * - Preferred Voice: Female US English voices
 * 
 * Events:
 * - onStart: Speech begins
 * - onEnd: Speech completes
 * - onError: Speech error occurs
 * - onPause: Speech paused
 * - onResume: Speech resumed
 * 
 * @class SpeechSynthesisService
 */

class SpeechSynthesisService {
  /**
   * Initialize Speech Synthesis
   * Sets up Web Speech API with default configuration
   */
  constructor() {
    // Check browser support for Speech Synthesis
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis not supported in this browser');
      this.supported = false;
      return;
    }

    // Initialize synthesis instance
    this.synth = window.speechSynthesis;
    this.supported = true;
    this.isSpeaking = false;
    this.currentUtterance = null;

    // ========================================
    // Voice Configuration
    // ========================================

    // Default voice settings (can be customized)
    this.voiceSettings = {
      lang: 'en-US',      // US English
      pitch: 1.0,         // Normal pitch (0.0-2.0)
      rate: 1.0,          // Normal speed (0.1-10)
      volume: 1.0         // Full volume (0.0-1.0)
    };

    // ========================================
    // Voice Loading
    // ========================================

    // Load available voices from browser
    this.voices = [];
    this.loadVoices();

    // Update voices when browser loads them (async in some browsers)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.synth.getVoices();
    console.log('Available voices:', this.voices.length);
  }

  /**
   * Get best voice for language
   */
  getVoice(lang = 'en-US') {
    // Try to find a voice matching the language
    let voice = this.voices.find(v => v.lang === lang);

    // If not found, try language code only (e.g., 'en')
    if (!voice) {
      const langCode = lang.split('-')[0];
      voice = this.voices.find(v => v.lang.startsWith(langCode));
    }

    // Default to first voice
    if (!voice && this.voices.length > 0) {
      voice = this.voices[0];
    }

    return voice;
  }

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {object} options - Optional settings
   * @returns {Promise} - Resolves when speech completes
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.supported) {
        reject(new Error('Speech Synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply settings
      utterance.lang = options.lang || this.voiceSettings.lang;
      utterance.pitch = options.pitch || this.voiceSettings.pitch;
      utterance.rate = options.rate || this.voiceSettings.rate;
      utterance.volume = options.volume || this.voiceSettings.volume;

      // Set voice
      const voice = this.getVoice(utterance.lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Event handlers
      utterance.onstart = () => {
        console.log('Speech started:', text);
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        console.log('Speech ended');
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      utterance.onpause = () => {
        console.log('Speech paused');
      };

      utterance.onresume = () => {
        console.log('Speech resumed');
      };

      // Speak
      try {
        this.synth.speak(utterance);
      } catch (error) {
        console.error('Error speaking:', error);
        this.isSpeaking = false;
        reject(error);
      }
    });
  }

  /**
   * Cancel current speech
   */
  cancel() {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('Speech cancelled');
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.isSpeaking && !this.synth.paused) {
      this.synth.pause();
      console.log('Speech paused');
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.isSpeaking && this.synth.paused) {
      this.synth.resume();
      console.log('Speech resumed');
    }
  }

  /**
   * Update voice settings
   */
  setSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
  }

  /**
   * Check if speech synthesis is supported
   */
  isSupported() {
    return this.supported;
  }

  /**
   * Check if currently speaking
   */
  isActive() {
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.voices;
  }
}

export default SpeechSynthesisService;
