/**
 * Voice Context
 * Global voice state and settings management
 * Handles permissions, language, and voice configuration
 */

import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfig } from '../hooks/useConfig';

export const VoiceContext = createContext();

// Voice states
export const VOICE_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

// Default settings
const DEFAULT_VOICE_SETTINGS = {
  voiceEnabled: true, // Master toggle for all voice features
  ttsLanguage: 'en-US',
  sttLanguage: 'en-US',
  ttsSpeed: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 1.0,
  enableAutoTTS: true, // Auto-speak action confirmations
  enableVoiceInput: true,
  enableVoiceCommands: true,
  confidenceThreshold: 0.75,
  listenTimeout: 10000, // 10 seconds
  autoStopAfterSilence: 3000, // 3 seconds
  enableVoiceFeedback: true, // Beeps for listening start/stop
  enablePartialResults: true,
};

/**
 * Voice Provider Component
 */
export const VoiceProvider = ({ children }) => {
  // Get user service preferences
  const { servicePreferences } = useConfig();

  // State management
  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);
  const [settings, setSettings] = useState(DEFAULT_VOICE_SETTINGS);
  const [permissions, setPermissions] = useState({
    microphone: false,
    storage: false,
  });
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [supportedLanguages] = useState([
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'it-IT', label: 'Italian' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'zh-CN', label: 'Mandarin Chinese' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  ]);

  // Ref to track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Sync voiceEnabled setting with user preference from useConfig
   * This effect watches servicePreferences.voiceModality and updates the global setting
   */
  useEffect(() => {
    if (servicePreferences?.voiceModality !== undefined && isMountedRef.current) {
      console.log('[VOICE-CONTEXT] Syncing voiceEnabled with user preference:', servicePreferences.voiceModality);
      setSettings(prev => ({
        ...prev,
        voiceEnabled: servicePreferences.voiceModality === true,
      }));
    }
  }, [servicePreferences?.voiceModality]);

  /**
   * Initialize voice context on mount
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load saved settings
        const savedSettings = await AsyncStorage.getItem('voiceSettings');
        if (savedSettings && isMountedRef.current) {
          setSettings(JSON.parse(savedSettings));
        }

        // Request permissions
        await requestMicrophonePermission();
        
        if (isMountedRef.current) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('[VOICE-CONTEXT] Initialization error:', err);
        if (isMountedRef.current) {
          setError(err.message);
        }
      }
    };

    initialize();
  }, []);

  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        console.log('[VOICE-CONTEXT] Requesting RECORD_AUDIO permission on Android...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice input',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[VOICE-CONTEXT] Android microphone permission result:', hasPermission ? '✓ GRANTED' : '✗ DENIED');
        if (isMountedRef.current) {
          setPermissions(prev => ({
            ...prev,
            microphone: hasPermission,
          }));
        }
        return hasPermission;
      } else if (Platform.OS === 'ios') {
        console.log('[VOICE-CONTEXT] iOS detected - assuming microphone permission granted (check Info.plist)');
        // iOS permissions are typically handled automatically
        // but you can add explicit checks here if needed
        if (isMountedRef.current) {
          setPermissions(prev => ({
            ...prev,
            microphone: true,
          }));
        }
        return true;
      }
    } catch (err) {
      console.error('[VOICE-CONTEXT] Permission request error:', err);
      return false;
    }
  }, []);

  /**
   * Update voice settings and persist
   */
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      if (isMountedRef.current) {
        setSettings(updated);
      }
      await AsyncStorage.setItem('voiceSettings', JSON.stringify(updated));
      console.log('[VOICE-CONTEXT] Settings updated:', updated);
    } catch (err) {
      console.error('[VOICE-CONTEXT] Settings update error:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [settings]);

  /**
   * Update voice state
   */
  const updateVoiceState = useCallback((newState) => {
    if (isMountedRef.current) {
      setVoiceState(newState);
      // Clear error when transitioning away from error state
      if (newState !== VOICE_STATES.ERROR) {
        setError(null);
      }
    }
  }, []);

  /**
   * Update transcript
   */
  const updateTranscript = useCallback((text) => {
    if (isMountedRef.current) {
      setCurrentTranscript(text);
    }
  }, []);

  /**
   * Set error state
   */
  const setVoiceError = useCallback((errorMsg) => {
    if (isMountedRef.current) {
      // Convert Error objects to strings, handle both Error and string types
      const errorString = errorMsg instanceof Error ? errorMsg.message : String(errorMsg || 'Unknown error');
      setError(errorString);
      setVoiceState(VOICE_STATES.ERROR);
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  /**
   * Reset voice context
   */
  const resetVoiceContext = useCallback(() => {
    if (isMountedRef.current) {
      setVoiceState(VOICE_STATES.IDLE);
      setCurrentTranscript('');
      setError(null);
    }
  }, []);

  /**
   * Check if voice is ready
   */
  const isVoiceReady = useCallback(() => {
    return isInitialized && 
           permissions.microphone && 
           voiceState !== VOICE_STATES.ERROR;
  }, [isInitialized, permissions.microphone, voiceState]);

  const contextValue = {
    // State
    voiceState,
    settings,
    permissions,
    currentTranscript,
    error,
    isInitialized,
    supportedLanguages,

    // Actions
    updateSettings,
    updateVoiceState,
    updateTranscript,
    setVoiceError,
    clearError,
    resetVoiceContext,
    requestMicrophonePermission,
    isVoiceReady,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
};

// export default VoiceContext;
