/**
 * useVoiceModality Hook
 * Main hook for screens needing voice commands
 * Integrates voiceService, voiceCommandParser, and VoiceContext
 */

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import voiceService from '../services/voiceService';
import { parseVoiceCommand, formatCommand } from '../services/voiceCommandParser';
import { VoiceContext, VOICE_STATES } from '../context/VoiceContext';

const useVoiceModality = (screenName, commandHandlers = {}, options = {}) => {
  const navigation = useNavigation();
  const voiceContext = useContext(VoiceContext);
  
  // Guard against undefined context
  if (!voiceContext) {
    console.warn('[VOICE-MODALITY] VoiceContext not found - make sure VoiceProvider wraps your app');
    return {
      isListening: false,
      isSpeaking: false,
      voiceState: 'idle',
      currentTranscript: '',
      error: 'Voice context not available',
      lastCommand: null,
      commandHistory: [],
      isVoiceReady: false,
      startListening: async () => console.warn('Voice context not available'),
      stopListening: async () => console.warn('Voice context not available'),
      speakMessage: async () => console.warn('Voice context not available'),
      executeCommand: async () => console.warn('Voice context not available'),
      resetVoice: () => console.warn('Voice context not available'),
      clearError: () => console.warn('Voice context not available'),
    };
  }
  
  const {
    enableAutoTTS = true,
    confirmDestructive = true, // Ask for confirmation on delete/clear actions
    onCommandRecognized = null, // Callback when command recognized
    onCommandExecuted = null, // Callback when command executed
    onError = null, // Error callback
    confidenceThreshold = 0.75,
    autoStartListening = false,
    language = 'en-US',
  } = options;

  // Local state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  
  // Refs
  const listeningTimeoutRef = useRef(null);
  const silenceDetectionRef = useRef(null);
  const lastTranscriptRef = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      if (silenceDetectionRef.current) clearTimeout(silenceDetectionRef.current);
    };
  }, []);

  /**
   * Initialize voice on mount
   */
  useEffect(() => {
    const init = async () => {
      try {
        if (!voiceContext.isInitialized) {
          console.log(`[${screenName}] Voice context not ready yet`);
          return;
        }

        if (!voiceContext.permissions.microphone) {
          console.warn(`[${screenName}] Microphone permission not granted`);
          return;
        }

        // ALWAYS re-register callbacks to ensure fresh handlers from this component
        // This fixes stale closure issues where callbacks reference old state
        console.log(`[${screenName}] Registering fresh voice callbacks`);
        await voiceService.initialize({
          onSpeechStart: handleSpeechStart,
          onSpeechEnd: handleSpeechEnd,
          onSpeechResults: handleSpeechResults,
          onSpeechError: handleSpeechError,
          onTTSStart: handleTTSStart,
          onTTSFinish: handleTTSFinish,
          onTTSError: handleTTSError,
        });

        // Set language
        await voiceService.setLanguage(language || voiceContext.settings.sttLanguage);

        console.log(`[${screenName}] Voice initialized for ${screenName}`);
      } catch (err) {
        console.error(`[${screenName}] Voice initialization error:`, err);
        if (isMountedRef.current) {
          voiceContext.setVoiceError(err.message);
        }
      }
    };

    init();
  }, [voiceContext.isInitialized, screenName, language, voiceContext]);

  /**
   * Handle listening start
   */
  const handleSpeechStart = useCallback(() => {
    if (!isMountedRef.current) {
      console.log(`[${screenName}] handleSpeechStart fired but component unmounted, ignoring`);
      return;
    }
    
    console.log(`[${screenName}] ✓ SPEECH START CALLBACK FIRED - Setting isListening = true`);
    setIsListening(true);
    voiceContext.updateVoiceState(VOICE_STATES.LISTENING);

    // Set listening timeout
    if (voiceContext.settings.listenTimeout) {
      listeningTimeoutRef.current = setTimeout(() => {
        console.log(`[${screenName}] Listening timeout (${voiceContext.settings.listenTimeout}ms)`);
        stopListening();
      }, voiceContext.settings.listenTimeout);
    }
  }, [screenName, voiceContext]);

  /**
   * Handle listening end
   */
  const handleSpeechEnd = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log(`[${screenName}] Listening ended`);
    setIsListening(false);
    
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
  }, [screenName, voiceContext]);

  /**
   * Handle speech results - Parse and execute commands
   */
  const handleSpeechResults = useCallback(
    async (results) => {
      if (!isMountedRef.current) return;

      const transcript = results[0];
      console.log(`[${screenName}] Speech results:`, transcript);
      
      if (!transcript || transcript.trim() === '') {
        console.warn(`[${screenName}] Empty transcript`);
        return;
      }

      // Update context
      voiceContext.updateTranscript(transcript);
      lastTranscriptRef.current = transcript;

      // Parse command
      voiceContext.updateVoiceState(VOICE_STATES.PROCESSING);
      const parsed = parseVoiceCommand(transcript, screenName, {
        confidenceThreshold: voiceContext.settings.confidenceThreshold,
      });

      console.log(`[${screenName}] Parsed command:`, formatCommand(parsed));

      // Callback for recognized command
      if (onCommandRecognized) {
        onCommandRecognized({
          rawText: transcript,
          parsed,
          timestamp: Date.now(),
        });
      }

      // Handle no match
      if (parsed.intent === 'NO_MATCH') {
        console.warn(`[${screenName}] No matching command for: "${transcript}"`);
        
        if (enableAutoTTS) {
          const message = `Sorry, I didn't understand "${transcript}". Could you repeat that?`;
          await speakMessage(message);
        }
        
        voiceContext.updateVoiceState(VOICE_STATES.IDLE);
        return;
      }

      // Handle ambiguous command
      if (parsed.intent === 'ASK_CLARIFICATION') {
        console.log(`[${screenName}] Ambiguous command, asking for clarification`);
        
        if (enableAutoTTS) {
          const options = parsed.options
            .map(opt => `"${opt.commandName}"`)
            .join(', ');
          await speakMessage(`Did you mean ${options}?`);
        }
        
        voiceContext.updateVoiceState(VOICE_STATES.IDLE);
        return;
      }

      // Execute command
      await executeCommand(parsed);
    },
    [screenName, voiceContext, enableAutoTTS, onCommandRecognized]
  );

  /**
   * Handle speech error
   */
  const handleSpeechError = useCallback(
    (error) => {
      if (!isMountedRef.current) return;

      console.error(`[${screenName}] Speech error:`, error);
      setIsListening(false);
      
      // Extract error message if Error object, convert to string
      const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
      voiceContext.setVoiceError(errorMessage);

      if (onError) {
        onError(error);
      }
    },
    [screenName, voiceContext, onError]
  );

  /**
   * Handle TTS start
   */
  const handleTTSStart = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log(`[${screenName}] TTS started`);
    setIsSpeaking(true);
    voiceContext.updateVoiceState(VOICE_STATES.SPEAKING);
  }, [screenName, voiceContext]);

  /**
   * Handle TTS finish
   */
  const handleTTSFinish = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log(`[${screenName}] TTS finished`);
    setIsSpeaking(false);
    voiceContext.updateVoiceState(VOICE_STATES.IDLE);
  }, [screenName, voiceContext]);

  /**
   * Handle TTS error
   */
  const handleTTSError = useCallback(
    (error) => {
      if (!isMountedRef.current) return;

      console.error(`[${screenName}] TTS error:`, error);
      setIsSpeaking(false);

      if (onError) {
        onError(error);
      }
    },
    [screenName, onError]
  );

  /**
   * Start listening
   */
  const startListening = useCallback(async () => {
    try {
      if (!voiceContext.isVoiceReady()) {
        throw new Error('Voice not ready. Check permissions and initialization.');
      }

      if (isListening) {
        console.warn(`[${screenName}] Already listening`);
        return;
      }

      console.log(`[${screenName}] ✓ Voice is ready. Starting listening...`);
      console.log(`[${screenName}] Pre-call state: isListening=${isListening}, voiceService.isListening=${voiceService.isListening}`);
      
      await voiceService.startListening({
        language: language || voiceContext.settings.sttLanguage,
        partialResults: voiceContext.settings.enablePartialResults,
      });

      console.log(`[${screenName}] ✓ startListening() completed (waiting for onSpeechStart event)`);
      voiceContext.clearError();
    } catch (err) {
      console.error(`[${screenName}] ✗ Start listening error:`, err);
      console.error(`[${screenName}] Error details:`, {
        message: err.message,
        voiceServiceInit: voiceService.isInitialized,
        voiceServiceListening: voiceService.isListening,
      });
      voiceContext.setVoiceError(err.message);
      if (onError) onError(err);
    }
  }, [screenName, language, voiceContext, isListening, onError]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(async () => {
    try {
      if (!isListening) {
        console.warn(`[${screenName}] Not currently listening`);
        return;
      }

      console.log(`[${screenName}] Stopping voice listening`);
      await voiceService.stopListening();
      
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
    } catch (err) {
      console.error(`[${screenName}] Stop listening error:`, err);
      voiceContext.setVoiceError(err.message);
      if (onError) onError(err);
    }
  }, [screenName, isListening, voiceContext, onError]);

  /**
   * Speak a message with optional parameters
   */
  const speakMessage = useCallback(
    async (text, options = {}) => {
      try {
        if (!text) return;

        const speakOptions = {
          language: options.language || voiceContext.settings.ttsLanguage,
          rate: options.rate || voiceContext.settings.ttsSpeed,
          pitch: options.pitch || voiceContext.settings.ttsPitch,
          volume: options.volume || voiceContext.settings.ttsVolume,
          ...options,
        };

        console.log(`[${screenName}] Speaking:`, text.substring(0, 50) + '...');
        await voiceService.speak(text, speakOptions);
      } catch (err) {
        console.error(`[${screenName}] Speak error:`, err);
        voiceContext.setVoiceError(err.message);
        if (onError) onError(err);
      }
    },
    [screenName, voiceContext, onError]
  );

  /**
   * Execute recognized command
   */
  const executeCommand = useCallback(
    async (parsed) => {
      try {
        console.log(`[${screenName}] Executing command:`, parsed.intent);

        // Get handler for this command
        const handler = commandHandlers[parsed.intent];
        if (!handler) {
          console.warn(`[${screenName}] No handler for command:`, parsed.intent);
          
          if (enableAutoTTS) {
            await speakMessage(`Command not configured: ${parsed.commandName}`);
          }
          
          voiceContext.updateVoiceState(VOICE_STATES.IDLE);
          return;
        }

        // Check if command requires confirmation
        const isDestructive = 
          parsed.intent.includes('delete') || 
          parsed.intent.includes('clear');

        if (confirmDestructive && isDestructive) {
          // For now, just log - actual confirmation would be handled by caller
          console.log(`[${screenName}] Destructive command - should confirm:`, parsed.intent);
        }

        // Provide feedback
        if (enableAutoTTS) {
          const confirmMsg = `Executing ${parsed.commandName}`;
          await speakMessage(confirmMsg);
        }

        // Execute handler
        const result = await handler({
          transcript: lastTranscriptRef.current,
          parsed,
          voiceContext,
          navigation,
        });

        // Update history
        const commandRecord = {
          intent: parsed.intent,
          commandName: parsed.commandName,
          rawText: parsed.rawText,
          confidence: parsed.confidence,
          timestamp: Date.now(),
          success: true,
          result,
        };

        if (isMountedRef.current) {
          setLastCommand(commandRecord);
          setCommandHistory(prev => [commandRecord, ...prev.slice(0, 49)]);
        }

        // Callback
        if (onCommandExecuted) {
          onCommandExecuted(commandRecord);
        }

        voiceContext.updateVoiceState(VOICE_STATES.IDLE);
        console.log(`[${screenName}] Command executed:`, parsed.intent);

      } catch (err) {
        console.error(`[${screenName}] Command execution error:`, err);
        
        if (enableAutoTTS) {
          await speakMessage(`Error executing command: ${err.message}`);
        }

        voiceContext.setVoiceError(err.message);
        if (onError) onError(err);
      }
    },
    [
      screenName,
      commandHandlers,
      enableAutoTTS,
      confirmDestructive,
      voiceContext,
      navigation,
      onCommandExecuted,
      onError,
      speakMessage,
    ]
  );

  /**
   * Reset voice state for this screen
   */
  const resetVoice = useCallback(() => {
    voiceContext.resetVoiceContext();
    setIsListening(false);
    setIsSpeaking(false);
    setLastCommand(null);
    lastTranscriptRef.current = '';
  }, [voiceContext]);

  // Auto-start listening if enabled
  useEffect(() => {
    if (autoStartListening && voiceContext.isVoiceReady()) {
      startListening();
    }
  }, [autoStartListening, voiceContext.isVoiceReady, startListening]);

  return {
    // State
    isListening,
    isSpeaking,
    voiceState: voiceContext.voiceState,
    currentTranscript: voiceContext.currentTranscript,
    error: voiceContext.error,
    lastCommand,
    commandHistory,
    isVoiceReady: voiceContext.isVoiceReady(),

    // Actions
    startListening,
    stopListening,
    speakMessage,
    executeCommand,
    resetVoice,
    clearError: voiceContext.clearError,
  };
};

export default useVoiceModality;
