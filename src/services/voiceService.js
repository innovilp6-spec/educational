/**
 * Voice Service - Core STT/TTS Engine
 * Handles all speech-to-text and text-to-speech operations
 */

import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { Platform } from 'react-native';

class VoiceService {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.isInitialized = false;
        this.voiceInitialized = false; // Track if Voice library (not just this service) is initialized
        this.transcript = '';
        this.recognizedText = '';
        this.language = 'en-US';

        // Callbacks
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onSpeechResults = null;
        this.onSpeechError = null;
        this.onTTSStart = null;
        this.onTTSFinish = null;
        this.onTTSError = null;

        // TTS queue for handling multiple speak requests
        this.ttsQueue = [];
        this.isProcessingTTS = false;

        console.log('[VOICE-SERVICE] Constructor: Service instance created');
    }

    /**
     * Initialize Voice Service
     * Sets up callbacks and Voice library event listeners (only once)
     */
    initialize = async (callbacks = {}) => {
        try {
            console.log('[VOICE-SERVICE] Initializing... voiceInitialized flag:', this.voiceInitialized);

            // Set up callbacks (can be updated on every call)
            if (callbacks.onSpeechStart) this.onSpeechStart = callbacks.onSpeechStart;
            if (callbacks.onSpeechEnd) this.onSpeechEnd = callbacks.onSpeechEnd;
            if (callbacks.onSpeechResults) this.onSpeechResults = callbacks.onSpeechResults;
            if (callbacks.onSpeechError) this.onSpeechError = callbacks.onSpeechError;
            if (callbacks.onTTSStart) this.onTTSStart = callbacks.onTTSStart;
            if (callbacks.onTTSFinish) this.onTTSFinish = callbacks.onTTSFinish;
            if (callbacks.onTTSError) this.onTTSError = callbacks.onTTSError;

            console.log('[VOICE-SERVICE] ✓ Callbacks updated');

            // Initialize Voice library ONLY ONCE
            // This prevents duplicate event listener registration
            if (!this.voiceInitialized) {
                console.log('[VOICE-SERVICE] Setting up Voice library event listeners (first time)...');
                
                // CRITICAL: Bind arrow functions to maintain 'this' context
                // These arrow functions delegate to this.onSpeechStart, etc.
                // which can be updated by calling initialize() again
                Voice.onSpeechStart = this.handleSpeechStart;
                Voice.onSpeechEnd = this.handleSpeechEnd;
                Voice.onSpeechResults = this.handleSpeechResults;
                Voice.onSpeechError = this.handleSpeechError;
                Voice.onSpeechPartialResults = this.handlePartialResults;

                console.log('[VOICE-SERVICE] ✓ Voice event listeners attached');

                // Initialize TTS
                Tts.setDefaultLanguage('en-US');
                Tts.setDefaultRate(0.5);
                Tts.setDefaultPitch(1.0);

                Tts.addEventListener('tts-start', this.handleTTSStart);
                Tts.addEventListener('tts-finish', this.handleTTSFinish);
                Tts.addEventListener('tts-cancel', this.handleTTSCancel);
                Tts.addEventListener('tts-error', this.handleTTSError);

                console.log('[VOICE-SERVICE] ✓ TTS event listeners attached');

                this.voiceInitialized = true;
            } else {
                console.log('[VOICE-SERVICE] Voice library already initialized, skipping listener setup');
            }

            console.log('[VOICE-SERVICE] ✓ Initialization complete');
            this.isInitialized = true;
            return { success: true };
        } catch (error) {
            console.error('[VOICE-SERVICE] Initialization error:', error);
            console.error('[VOICE-SERVICE] Error stack:', error.stack);
            return { success: false, error: error.message };
        }
    };

    /**
     * Start listening for speech
     */
    startListening = async (options = {}) => {
        try {
            if (this.isListening) {
                console.warn('[VOICE-SERVICE] Already listening');
                return;
            }

            const {
                language = 'en-US',
                maxOnDemandHitsPerSecond = 5,
                partial = true,
                request_id = 'unique-id',
            } = options;

            this.language = language;
            this.transcript = '';

            console.log('[VOICE-SERVICE] Starting to listen... Language:', language);
            console.log('[VOICE-SERVICE] Pre-call state: voiceInitialized=', this.voiceInitialized, 'callback set=', !!this.onSpeechStart);

            // Don't set isListening here - wait for onSpeechStart event!
            try {
                console.log('[VOICE-SERVICE] Calling Voice.start()...');
                await Voice.start(language, {
                    maxOnDemandHitsPerSecond,
                    partial,
                    request_id,
                });
                console.log('[VOICE-SERVICE] ✓ Voice.start() completed successfully');
                
                // Set a timeout to detect if onSpeechStart never fires
                // This catches cases where Voice.start() succeeds but the device doesn't actually listen
                setTimeout(() => {
                    if (!this.isListening) {
                        console.warn('[VOICE-SERVICE] ⚠️ WARNING: Voice.start() completed but onSpeechStart event never fired!');
                        console.warn('[VOICE-SERVICE] This usually means:');
                        console.warn('[VOICE-SERVICE]   1. Android emulator - doesn\'t support speech recognition');
                        console.warn('[VOICE-SERVICE]   2. Device speech-to-text service not available');
                        console.warn('[VOICE-SERVICE]   3. Voice library not properly linked on Android');
                        console.warn('[VOICE-SERVICE] Solution: Test on a physical Android device with Google Play Services');
                        
                        // Trigger error to notify user (pass error message as string, not Error object)
                        if (this.onSpeechError) {
                            this.onSpeechError('Speech recognition not available on this device. Please use a physical Android device.');
                        }
                    }
                }, 3000); // Wait 3 seconds for onSpeechStart to fire
                
                // isListening will be set to true in handleSpeechStart() when Voice fires the event
            } catch (voiceError) {
                console.error('[VOICE-SERVICE] ✗ Voice.start() threw error:', voiceError);
                console.error('[VOICE-SERVICE] Error message:', voiceError.message);
                console.error('[VOICE-SERVICE] Error code:', voiceError.code);
                throw voiceError; // Re-throw to be caught by outer catch
            }
        } catch (error) {
            console.error('[VOICE-SERVICE] Error starting listening:', error);
            console.error('[VOICE-SERVICE] Error details:', {
                message: error.message,
                code: error.code,
                platform: Platform.OS,
            });
            this.handleSpeechError(error);
        }
    };

    /**
     * Stop listening for speech
     */
    stopListening = async () => {
        try {
            if (!this.isListening) {
                console.warn('[VOICE-SERVICE] Not currently listening');
                return;
            }

            console.log('[VOICE-SERVICE] Stopping listening...');
            await Voice.stop();
            this.isListening = false;
        } catch (error) {
            console.error('[VOICE-SERVICE] Error stopping listening:', error);
        }
    };

    /**
     * Cancel listening (without waiting for final results)
     */
    cancelListening = async () => {
        try {
            console.log('[VOICE-SERVICE] Canceling listening...');
            await Voice.cancel();
            this.isListening = false;
            this.transcript = '';
        } catch (error) {
            console.error('[VOICE-SERVICE] Error canceling:', error);
        }
    };

    /**
     * Destroy Voice service (cleanup)
     */
    destroyVoice = async () => {
        try {
            console.log('[VOICE-SERVICE] Destroying...');
            await Voice.destroy();
            this.isListening = false;
        } catch (error) {
            console.error('[VOICE-SERVICE] Error destroying:', error);
        }
    };

    /**
     * Speak text using TTS
     */
    speak = async (text, options = {}) => {
        try {
            const {
                rate = 0.5,
                pitch = 1.0,
                language = this.language,
                skipQueue = false,
            } = options;

            if (!text) {
                console.warn('[VOICE-SERVICE] No text provided to speak');
                return;
            }

            console.log('[VOICE-SERVICE] Speaking:', text.substring(0, 50) + '...');

            // Set language and voice parameters
            await Tts.setDefaultLanguage(language.split('-')[0]); // Use language code only (en, hi, etc)
            await Tts.setDefaultRate(rate);
            await Tts.setDefaultPitch(pitch);

            if (skipQueue) {
                // Speak immediately (cancel any ongoing speech)
                await Tts.stop();
                this.ttsQueue = [];
                this.isProcessingTTS = false;
                await Tts.speak(text);
            } else {
                // Add to queue
                this.ttsQueue.push({ text, rate, pitch, language });
                this.processQueue();
            }
        } catch (error) {
            console.error('[VOICE-SERVICE] Error speaking:', error);
            if (this.onTTSError) {
                this.onTTSError(error);
            }
        }
    };

    /**
     * Process TTS queue
     */
    processQueue = async () => {
        if (this.isProcessingTTS || this.ttsQueue.length === 0) {
            return;
        }

        this.isProcessingTTS = true;
        const { text, rate, pitch, language } = this.ttsQueue.shift();

        try {
            await Tts.setDefaultLanguage(language.split('-')[0]);
            await Tts.setDefaultRate(rate);
            await Tts.setDefaultPitch(pitch);
            await Tts.speak(text);
        } catch (error) {
            console.error('[VOICE-SERVICE] Error processing queue:', error);
            this.isProcessingTTS = false;
            if (this.onTTSError) {
                this.onTTSError(error);
            }
            this.processQueue();
        }
    };

    /**
     * Stop current TTS
     */
    stopSpeaking = async () => {
        try {
            console.log('[VOICE-SERVICE] Stopping TTS...');
            await Tts.stop();
            this.isSpeaking = false;
            this.ttsQueue = [];
            this.isProcessingTTS = false;
        } catch (error) {
            console.error('[VOICE-SERVICE] Error stopping TTS:', error);
        }
    };

    /**
     * Set language for both STT and TTS
     */
    setLanguage = async (language) => {
        try {
            this.language = language;
            await Tts.setDefaultLanguage(language.split('-')[0]);
            console.log('[VOICE-SERVICE] Language set to:', language);
        } catch (error) {
            console.error('[VOICE-SERVICE] Error setting language:', error);
        }
    };

    // ===== Speech Start Handler =====
    handleSpeechStart = () => {
        console.log('[VOICE-SERVICE] Speech started - Setting isListening = true');
        this.isListening = true;
        console.log('[VOICE-SERVICE] Calling onSpeechStart callback:', this.onSpeechStart ? 'registered' : 'NOT registered');
        if (this.onSpeechStart) {
            try {
                this.onSpeechStart();
                console.log('[VOICE-SERVICE] ✓ onSpeechStart callback executed');
            } catch (err) {
                console.error('[VOICE-SERVICE] Error in onSpeechStart callback:', err);
            }
        }
    };

    // ===== Speech End Handler =====
    handleSpeechEnd = () => {
        console.log('[VOICE-SERVICE] Speech ended');
        this.isListening = false;
        if (this.onSpeechEnd) {
            this.onSpeechEnd();
        }
    };

    // ===== Partial Results Handler =====
    handlePartialResults = (result) => {
        console.log('[VOICE-SERVICE] Partial results event fired:', result);
        if (result.value && result.value.length > 0) {
            this.transcript = result.value[0];
            console.log('[VOICE-SERVICE] Partial transcript:', this.transcript);
        }
    };

    // ===== Final Results Handler =====
    handleSpeechResults = (result) => {
        console.log('[VOICE-SERVICE] Final results event fired:', result);
        if (result.value && result.value.length > 0) {
            this.recognizedText = result.value[0];
            console.log('[VOICE-SERVICE] ✓ Final result:', this.recognizedText);

            if (this.onSpeechResults) {
                try {
                    this.onSpeechResults({
                        text: this.recognizedText,
                        isFinal: true,
                        transcript: this.recognizedText,
                    });
                    console.log('[VOICE-SERVICE] ✓ onSpeechResults callback executed');
                } catch (err) {
                    console.error('[VOICE-SERVICE] Error in onSpeechResults callback:', err);
                }
            } else {
                console.warn('[VOICE-SERVICE] onSpeechResults callback not registered!');
            }
        }
        this.isListening = false;
    };

    // ===== Speech Error Handler =====
    handleSpeechError = (error) => {
        console.error('[VOICE-SERVICE] ✗ Speech error detected:', error);
        console.error('[VOICE-SERVICE] Error type:', error?.message || 'unknown');
        this.isListening = false;

        if (this.onSpeechError) {
            try {
                this.onSpeechError(error);
                console.log('[VOICE-SERVICE] ✓ onSpeechError callback executed');
            } catch (err) {
                console.error('[VOICE-SERVICE] Error in onSpeechError callback:', err);
            }
        } else {
            console.warn('[VOICE-SERVICE] onSpeechError callback not registered!');
        }
    };

    // ===== TTS Handlers =====
    handleTTSStart = () => {
        console.log('[VOICE-SERVICE] TTS started');
        this.isSpeaking = true;
        if (this.onTTSStart) {
            this.onTTSStart();
        }
    };

    handleTTSFinish = () => {
        console.log('[VOICE-SERVICE] TTS finished');
        this.isSpeaking = false;
        this.isProcessingTTS = false;

        if (this.onTTSFinish) {
            this.onTTSFinish();
        }

        // Process next in queue
        if (this.ttsQueue.length > 0) {
            this.processQueue();
        }
    };

    handleTTSCancel = () => {
        console.log('[VOICE-SERVICE] TTS cancelled');
        this.isSpeaking = false;
        this.isProcessingTTS = false;
    };

    handleTTSError = (error) => {
        console.error('[VOICE-SERVICE] TTS error:', error);
        this.isSpeaking = false;
        this.isProcessingTTS = false;

        if (this.onTTSError) {
            this.onTTSError(error);
        }

        // Process next in queue despite error
        if (this.ttsQueue.length > 0) {
            this.processQueue();
        }
    };

    // ===== Setters for Callbacks =====
    setSpeechCallbacks = (callbacks) => {
        const { onStart, onEnd, onResults, onError } = callbacks;
        if (onStart) this.onSpeechStart = onStart;
        if (onEnd) this.onSpeechEnd = onEnd;
        if (onResults) this.onSpeechResults = onResults;
        if (onError) this.onSpeechError = onError;
    };

    setTTSCallbacks = (callbacks) => {
        const { onStart, onFinish, onError } = callbacks;
        if (onStart) this.onTTSStart = onStart;
        if (onFinish) this.onTTSFinish = onFinish;
        if (onError) this.onTTSError = onError;
    };

    // ===== Getters =====
    getTranscript = () => this.transcript;
    getRecognizedText = () => this.recognizedText;
    isCurrentlyListening = () => this.isListening;
    isCurrentlySpeaking = () => this.isSpeaking;
    getCurrentLanguage = () => this.language;

    // ===== Diagnostic Method =====
    diagnose = () => {
        const diagnosis = {
            isInitialized: this.isInitialized,
            voiceInitialized: this.voiceInitialized,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            callbacksRegistered: {
                onSpeechStart: !!this.onSpeechStart,
                onSpeechEnd: !!this.onSpeechEnd,
                onSpeechResults: !!this.onSpeechResults,
                onSpeechError: !!this.onSpeechError,
            },
            language: this.language,
            transcript: this.transcript,
            recognizedText: this.recognizedText,
        };
        console.log('[VOICE-SERVICE] Diagnostic report:', JSON.stringify(diagnosis, null, 2));
        return diagnosis;
    };
}

// Export singleton instance
const voiceService = new VoiceService();
export default voiceService;
