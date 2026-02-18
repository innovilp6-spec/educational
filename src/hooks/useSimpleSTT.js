/**
 * useSimpleSTT Hook
 * Simplified hook for screens that only need voice input (no commands)
 * Perfect for chat, note input, and simple text input screens
 * 
 * Usage:
 * const { isListening, transcript, startListening, stopListening } = useSimpleSTT();
 * 
 * // Show mic button to start/stop
 * // Or auto-submit on silence
 */

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import voiceService from '../services/voiceService';
import { VoiceContext, VOICE_STATES } from '../context/VoiceContext';

export const useSimpleSTT = (options = {}) => {
  const voiceContext = useContext(VoiceContext);

  // Guard against undefined context
  if (!voiceContext) {
    console.warn('[SIMPLE-STT] VoiceContext not found - make sure VoiceProvider wraps your app');
    return {
      isListening: false,
      isSpeaking: false,
      transcript: '',
      error: 'Voice context not available',
      voiceState: 'idle',
      isVoiceReady: false,
      startListening: async () => console.warn('Voice context not available'),
      stopListening: async () => console.warn('Voice context not available'),
      appendTranscript: () => console.warn('Voice context not available'),
      clearTranscript: () => console.warn('Voice context not available'),
      resetSTT: () => console.warn('Voice context not available'),
      setTranscript: () => console.warn('Voice context not available'),
    };
  }

  const {
    language = 'en-US',
    autoSubmitOnSilence = false,
    silenceDuration = 2000, // 2 seconds
    onTranscript = null, // Called with each result
    onError = null,
    clearOnSubmit = true,
  } = options;

  // Local state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const silenceDetectionRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastResultTimeRef = useRef(Date.now());

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (silenceDetectionRef.current) clearTimeout(silenceDetectionRef.current);
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
    };
  }, []);

  /**
   * Initialize voice service
   */
  useEffect(() => {
    const init = async () => {
      try {
        if (!voiceContext.isInitialized) return;
        if (!voiceContext.permissions.microphone) return;

        if (!voiceService.isInitialized) {
          await voiceService.initialize({
            onSpeechStart: handleSpeechStart,
            onSpeechEnd: handleSpeechEnd,
            onSpeechResults: handleSpeechResults,
            onSpeechError: handleSpeechError,
          });

          console.log('[STT] Voice service initialized');
        }

        // Set language
        await voiceService.setLanguage(language);
      } catch (err) {
        console.error('[STT] Initialization error:', err);
        if (isMountedRef.current) {
          setError(err.message);
        }
      }
    };

    init();
  }, [voiceContext.isInitialized, language]);

  /**
   * Handle listening start
   */
  const handleSpeechStart = useCallback(() => {
    if (!isMountedRef.current) return;

    console.log('[STT] Listening started');
    setIsListening(true);
    setError(null);
    voiceContext.updateVoiceState(VOICE_STATES.LISTENING);

    // Set auto-stop timeout
    if (voiceContext.settings.listenTimeout) {
      listeningTimeoutRef.current = setTimeout(() => {
        console.log('[STT] Listening timeout');
        stopListening();
      }, voiceContext.settings.listenTimeout);
    }
  }, [voiceContext]);

  /**
   * Handle listening end
   */
  const handleSpeechEnd = useCallback(() => {
    if (!isMountedRef.current) return;

    console.log('[STT] Listening ended');
    setIsListening(false);

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }

    // Auto-submit on silence if enabled
    if (autoSubmitOnSilence && transcript) {
      console.log('[STT] Auto-submitting due to silence');
      if (onTranscript) {
        onTranscript({
          text: transcript,
          isFinal: true,
          isAutoSubmit: true,
        });
      }

      if (clearOnSubmit) {
        clearTranscript();
      }
    }
  }, [transcript, autoSubmitOnSilence, onTranscript, clearOnSubmit]);

  /**
   * Handle speech results - accumulate transcript
   */
  const handleSpeechResults = useCallback(
    (results) => {
      if (!isMountedRef.current) return;

      const text = results[0];
      console.log('[STT] Result:', text);

      lastResultTimeRef.current = Date.now();

      if (isMountedRef.current) {
        setTranscript(text);

        // Update context
        voiceContext.updateTranscript(text);

        // Callback with transcript
        if (onTranscript) {
          onTranscript({
            text,
            isFinal: true,
            isAutoSubmit: false,
            timestamp: Date.now(),
          });
        }
      }

      // Reset silence detection timer
      if (silenceDetectionRef.current) {
        clearTimeout(silenceDetectionRef.current);
      }

      if (autoSubmitOnSilence) {
        silenceDetectionRef.current = setTimeout(() => {
          console.log('[STT] Silence detected, auto-stopping');
          stopListening();
        }, silenceDuration);
      }
    },
    [autoSubmitOnSilence, silenceDuration, voiceContext, onTranscript]
  );

  /**
   * Handle speech error
   */
  const handleSpeechError = useCallback(
    (error) => {
      if (!isMountedRef.current) return;

      console.error('[STT] Speech error:', error);
      setIsListening(false);
      setError(error);
      voiceContext.setVoiceError(error);

      if (onError) {
        onError(error);
      }
    },
    [voiceContext, onError]
  );

  /**
   * Start listening
   */
  const startListening = useCallback(async () => {
    try {
      if (!voiceContext.isVoiceReady()) {
        throw new Error('Voice not ready');
      }

      if (isListening) {
        console.warn('[STT] Already listening');
        return;
      }

      console.log('[STT] Starting to listen');
      setError(null);

      await voiceService.startListening({
        language,
        partialResults: voiceContext.settings.enablePartialResults,
      });
    } catch (err) {
      console.error('[STT] Start listening error:', err);
      setError(err.message);
      if (onError) onError(err);
    }
  }, [language, isListening, voiceContext, onError]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(async () => {
    try {
      if (!isListening) {
        console.warn('[STT] Not listening');
        return;
      }

      console.log('[STT] Stopping listening');
      await voiceService.stopListening();

      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      if (silenceDetectionRef.current) {
        clearTimeout(silenceDetectionRef.current);
      }
    } catch (err) {
      console.error('[STT] Stop listening error:', err);
      setError(err.message);
      if (onError) onError(err);
    }
  }, [isListening, onError]);

  /**
   * Append text to transcript
   */
  const appendTranscript = useCallback((text) => {
    setTranscript(prev => (prev + ' ' + text).trim());
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    voiceContext.updateTranscript('');
    setError(null);
  }, [voiceContext]);

  /**
   * Reset STT
   */
  const resetSTT = useCallback(() => {
    clearTranscript();
    setIsListening(false);
    setIsSpeaking(false);
    voiceContext.resetVoiceContext();

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
    if (silenceDetectionRef.current) {
      clearTimeout(silenceDetectionRef.current);
    }
  }, [voiceContext, clearTranscript]);

  return {
    // State
    isListening,
    isSpeaking,
    transcript,
    error,
    voiceState: voiceContext.voiceState,
    isVoiceReady: voiceContext.isVoiceReady(),

    // Actions
    startListening,
    stopListening,
    appendTranscript,
    clearTranscript,
    resetSTT,
    setTranscript,
  };
};

export default useSimpleSTT;
