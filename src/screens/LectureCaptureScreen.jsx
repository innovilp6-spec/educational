import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Animated } from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import useVoiceModality from '../hooks/useVoiceModality';
import { VoiceContext } from '../context/VoiceContext';
import PrimaryButton from '../components/PrimaryButton';
import RNFS from 'react-native-fs';
import { requestReadExternalStoragePermission } from '../utils/permissions';
import SpecialText from '../components/SpecialText';

const CHUNK_INTERVAL = 2000; // 2 seconds between chunk processing (simulation)
// Use Downloads directory to access the audio chunks
const FFMPEG_CHUNKS_DIR = RNFS.DownloadDirectoryPath;

export default function LectureCaptureScreen({ navigation }) {
  const { transcribeAudioChunk } = useTranscriptAPI();
  const { settings } = React.useContext(VoiceContext);
  const voiceEnabled = settings?.voiceEnabled ?? true;

  const [masterTranscript, setMasterTranscript] = useState('');
  const [currentChunkTranscript, setCurrentChunkTranscript] = useState('');
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Voice command handlers
  const commandHandlers = {
    startRecording: async () => {
      if (!isRecording) {
        await handleStart();
        voice.speakMessage('Recording started');
      }
    },
    stopRecording: async () => {
      if (isRecording) {
        await handleStop();
        voice.speakMessage('Recording stopped');
      }
    },
    goHome: () => {
      navigation.navigate('Home');
    },
  };

  const voice = useVoiceModality('LectureCaptureScreen', commandHandlers, {
    enableAutoTTS: true,
  });

  // Animation refs for pulsing waveform
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const currentChunkIndexRef = useRef(0);
  const scrollViewRef = useRef(null);

  // Start pulsing animation when recording starts
  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
      pulseAnim3.setValue(1);
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
    const animationSequence = (anim) => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => animationSequence(anim));
    };

    animationSequence(pulseAnim1);
    setTimeout(() => animationSequence(pulseAnim2), 200);
    setTimeout(() => animationSequence(pulseAnim3), 400);
  };

  // Load audio files from Downloads directory
  const loadAudioFiles = async () => {
    try {
      setIsLoadingFiles(true);

      // Request storage permission first
      console.log('[LectureCaptureScreen] Requesting READ_EXTERNAL_STORAGE permission...');
      const hasPermission = await requestReadExternalStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot access audio files without storage permission.');
        setIsLoadingFiles(false);
        return;
      }

      console.log('[LectureCaptureScreen] Loading audio files from:', FFMPEG_CHUNKS_DIR);

      // First, list ALL contents of Downloads to see what's there
      console.log('[LectureCaptureScreen] Listing Downloads directory contents:');
      const downloadsFolderContents = await RNFS.readDir(FFMPEG_CHUNKS_DIR);
      console.log('[LectureCaptureScreen] Downloads has', downloadsFolderContents.length, 'items');
      downloadsFolderContents.forEach(file => {
        console.log('[LectureCaptureScreen] Downloads item:', {
          name: file.name,
          isDirectory: file.isDirectory(),
          path: file.path
        });
      });

      // Filter audio files (wav, mp3, m4a, etc.) from Downloads
      const audioFileList = downloadsFolderContents
        .filter(file => {
          if (file.isDirectory()) {
            console.log('[LectureCaptureScreen] Skipping directory:', file.name);
            return false;
          }
          const ext = file.name.toLowerCase().split('.').pop();
          const isAudio = ['wav', 'mp3', 'm4a', 'aac', 'ogg'].includes(ext);
          console.log('[LectureCaptureScreen] File:', file.name, '| Extension:', ext, '| IsAudio:', isAudio);
          return isAudio;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('[LectureCaptureScreen] Found', audioFileList.length, 'audio files');
      if (audioFileList.length === 0) {
        Alert.alert('No Audio Files', `No audio files found in Downloads folder.\nPlace your chunk_*.wav files in Downloads.`);
        setIsLoadingFiles(false);
        return;
      }

      setAudioFiles(audioFileList);
      setIsLoadingFiles(false);
      return audioFileList;
    } catch (error) {
      console.error('[LectureCaptureScreen] Error loading audio files:', error);
      Alert.alert('Error', 'Failed to load audio files: ' + error.message);
      setIsLoadingFiles(false);
    }
  };

  const handleStart = async () => {
    try {
      // Load audio files first
      const files = await loadAudioFiles();
      if (!files || files.length === 0) return;

      console.log('[LectureCaptureScreen] Starting simulation with', files.length, 'audio files');

      setMasterTranscript('');
      setCurrentChunkTranscript('');
      setChunkCount(0);
      setIsRecording(true);
      isProcessingRef.current = false;
      currentChunkIndexRef.current = 0;

      // Start the chunk interval
      startChunkInterval();
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const startChunkInterval = () => {
    intervalRef.current = setInterval(async () => {
      // Skip if already processing
      if (isProcessingRef.current) {
        console.log('[LectureCaptureScreen] Already processing chunk, skipping...');
        return;
      }

      try {
        isProcessingRef.current = true;
        setIsProcessingChunk(true);

        // Get current audio file (cycle through if needed)
        const currentIndex = currentChunkIndexRef.current % audioFiles.length;
        const audioFile = audioFiles[currentIndex];

        console.log('[LectureCaptureScreen] Processing chunk:', {
          fileIndex: currentIndex,
          fileName: audioFile.name,
          filePath: audioFile.path,
        });

        console.log('[LectureCaptureScreen] Sending to transcription API...');

        // Transcribe the audio chunk
        const transcription = await transcribeAudioChunk(audioFile.path);

        // Update current chunk transcript for display
        setCurrentChunkTranscript(transcription);

        // Append to master transcript
        setMasterTranscript(prev =>
          prev ? `${prev} ${transcription}` : transcription
        );

        setChunkCount(prev => prev + 1);

        // Move to next file
        currentChunkIndexRef.current += 1;

        console.log('[LectureCaptureScreen] Chunk processed successfully');
      } catch (error) {
        console.error('[LectureCaptureScreen] Error processing chunk:', error);
        setCurrentChunkTranscript(`Error: ${error.message}`);
      } finally {
        setIsProcessingChunk(false);
        isProcessingRef.current = false;
      }
    }, CHUNK_INTERVAL);
  };

  const handleStop = async () => {
    try {
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Prevent processing while stopping
      isProcessingRef.current = true;
      setIsProcessingChunk(true);
      setIsRecording(false);

      console.log('[LectureCaptureScreen] Stopping recording simulation...');

      if (!masterTranscript || masterTranscript.trim().length === 0) {
        Alert.alert('Empty Recording', 'No transcripts were captured. Please try again.');
        setIsProcessingChunk(false);
        isProcessingRef.current = false;
        return;
      }

      console.log('[LectureCaptureScreen] Recording stopped. Master transcript ready.');
      console.log('[LectureCaptureScreen] Total chunks processed:', chunkCount);

      // Navigate to NameSessionScreen first
      navigation.navigate('NameSession', { transcript: masterTranscript });
    } catch (error) {
      console.error('[LectureCaptureScreen] Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
      setIsProcessingChunk(false);
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    // Load audio files on component mount
    loadAudioFiles();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Render pulsing waveform bars
  const WaveformBar = ({ animValue }) => (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          transform: [{ scaleY: animValue }],
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SpecialText style={styles.headerTitle}>Recording Lecture</SpecialText>
        <View style={styles.headerActions}>
          {!isRecording && (
            <TouchableOpacity
              style={styles.viewRecordingsButton}
              onPress={() => navigation.navigate('RecordingsList')}
            >
              <SpecialText style={styles.viewRecordingsButtonText}><Text>📋</Text> View Recordings</SpecialText>
            </TouchableOpacity>
          )}
          {voiceEnabled && (
            <TouchableOpacity
              style={[styles.micButton, voice.isListening && styles.micButtonListening]}
              onPress={() => voice.isListening ? voice.stopListening() : voice.startListening()}
              disabled={isProcessingChunk}
            >
              <Text style={styles.micButtonText}>{voice.isListening ? '🔴' : '🎤'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Voice Transcript Bubble */}
      {voiceEnabled && voice.currentTranscript && !voice.error && (
        <View style={styles.voiceTranscriptBubble}>
          <SpecialText style={styles.voiceTranscriptText}>Heard: {voice.currentTranscript}</SpecialText>
        </View>
      )}

      {/* Voice Error Bubble */}
      {voiceEnabled && voice.error && (
        <View style={styles.voiceErrorBubble}>
          <SpecialText style={styles.voiceErrorText}>{voice.error}</SpecialText>
          <TouchableOpacity onPress={() => { /* error will auto-dismiss */ }}>
            <SpecialText style={styles.voiceErrorClose}>✕</SpecialText>
          </TouchableOpacity>
        </View>
      )}

      {isLoadingFiles && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <SpecialText style={styles.loadingText}>Preparing...</SpecialText>
        </View>
      )}

      {!isLoadingFiles && audioFiles.length === 0 && !isRecording && (
        <View style={styles.centerContainer}>
          <SpecialText style={styles.errorText}><Text>⚠️</Text> No audio files found</SpecialText>
          <SpecialText style={styles.errorSubtext}>Please add audio files to Downloads folder</SpecialText>
        </View>
      )}

      {audioFiles.length > 0 && (
        <View style={styles.content}>
          {/* Recording Status Section */}
          {isRecording && (
            <View style={styles.recordingSection}>
              {/* Pulsing Waveform */}
              <View style={styles.waveformContainer}>
                <WaveformBar animValue={pulseAnim1} />
                <WaveformBar animValue={pulseAnim2} />
                <WaveformBar animValue={pulseAnim3} />
              </View>

              {/* Status Indicator */}
              <View style={styles.statusIndicator}>
                <View style={styles.recordingDot} />
                <SpecialText style={styles.recordingText}>Recording</SpecialText>
              </View>

              {/* Chunk Counter */}
              <SpecialText style={styles.chunkCounter}>{chunkCount} chunks</SpecialText>
            </View>
          )}

          {/* Live Transcript Box */}
          <View style={styles.liveTranscriptContainer}>
            <View style={styles.liveTranscriptHeader}>
              <SpecialText style={styles.liveTranscriptTitle}>Live Transcript</SpecialText>
              {isProcessingChunk && (
                <View style={styles.processingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              )}
            </View>

            <ScrollView
              style={styles.liveTranscriptBox}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef?.current?.scrollToEnd({ animated: true })}
            >
              {currentChunkTranscript ? (
                <View style={styles.transcriptContent}>
                  {masterTranscript && (
                    <SpecialText style={styles.pastTranscript}>{masterTranscript}</SpecialText>
                  )}
                  <View style={styles.currentTranscriptHighlight}>
                    <SpecialText style={styles.currentTranscript}>{currentChunkTranscript}</SpecialText>
                  </View>
                </View>
              ) : (
                <SpecialText style={styles.placeholderText}>
                  {isRecording ? 'Listening...' : 'Click record to start'}
                </SpecialText>
              )}
            </ScrollView>
          </View>

          {/* Control Buttons */}
          <View style={styles.buttonContainer}>
            {!isRecording && (
              <PrimaryButton
                title="Start Recording"
                onPress={handleStart}
                style={styles.primaryButton}
              />
            )}

            {isRecording && (
              <PrimaryButton
                title="Stop & Continue"
                onPress={handleStop}
                style={styles.stopButton}
              />
            )}
          </View>

          {/* Transcript Stats */}
          {masterTranscript.length > 0 && (
            <View style={styles.statsContainer}>
              <SpecialText style={styles.statsText}>
                {masterTranscript.length} characters • {masterTranscript.split(' ').length} words
              </SpecialText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  headerActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  viewRecordingsButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewRecordingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  micButtonListening: {
    backgroundColor: '#ffebee',
    borderColor: '#ff4444',
  },
  micButtonText: {
    fontSize: 20,
  },
  voiceTranscriptBubble: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  voiceTranscriptText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  voiceErrorBubble: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceErrorText: {
    fontSize: 13,
    color: '#ff4444',
    fontWeight: '500',
    flex: 1,
  },
  voiceErrorClose: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 13,
    color: '#999',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 80,
    marginBottom: 16,
  },
  waveformBar: {
    width: 3,
    height: 60,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    marginRight: 8,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chunkCounter: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  liveTranscriptContainer: {
    flex: 1,
    marginBottom: 16,
  },
  liveTranscriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveTranscriptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.5,
  },
  processingIndicator: {
    width: 20,
    height: 20,
  },
  liveTranscriptBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transcriptContent: {
    flex: 1,
  },
  pastTranscript: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
  currentTranscriptHighlight: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 4,
  },
  currentTranscript: {
    fontSize: 14,
    lineHeight: 22,
    color: '#007AFF',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#ff4444',
  },
  statsContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});


