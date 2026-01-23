import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import PrimaryButton from '../components/PrimaryButton';
import RNFS from 'react-native-fs';
import { requestReadExternalStoragePermission } from '../utils/permissions';

const CHUNK_INTERVAL = 2000; // 2 seconds between chunk processing (simulation)
// Use Downloads directory to access the audio chunks
const FFMPEG_CHUNKS_DIR = RNFS.DownloadDirectoryPath;

export default function LectureCaptureScreen({ navigation }) {
  const { transcribeAudioChunk } = useTranscriptAPI();

  const [masterTranscript, setMasterTranscript] = useState('');
  const [currentChunkTranscript, setCurrentChunkTranscript] = useState('');
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const currentChunkIndexRef = useRef(0);

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

      // Navigate to Transcribing screen with the master transcript
      navigation.replace('Transcribing', { masterTranscript });
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

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Lecture Recording Simulation</Text>
        <Text style={styles.subtitle}>Processing audio chunks from ffmpeg_chunks</Text>
      </View>

      {isLoadingFiles && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading audio files...</Text>
        </View>
      )}

      {!isLoadingFiles && audioFiles.length === 0 && !isRecording && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ No audio files found</Text>
          <Text style={styles.errorSubtext}>Please add audio files to ffmpeg_chunks directory</Text>
        </View>
      )}

      {audioFiles.length > 0 && (
        <>
          <View style={styles.statusSection}>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Files Loaded:</Text>
              <Text style={styles.statusValue}>{audioFiles.length} audio files</Text>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: isRecording ? '#ff9800' : '#4caf50' }]}>
                {!isRecording ? 'Ready' : isProcessingChunk ? 'Processing...' : 'Recording...'}
              </Text>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Chunks:</Text>
              <Text style={styles.statusValue}>{chunkCount} processed</Text>
            </View>
          </View>

          <View style={styles.transcriptSection}>
            <Text style={styles.sectionTitle}>Current Chunk Transcription:</Text>
            <ScrollView style={styles.transcriptBox}>
              {isProcessingChunk && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.processingText}>Transcribing...</Text>
                </View>
              )}
              <Text style={styles.transcriptText}>
                {currentChunkTranscript || 'Waiting for transcription...'}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.buttonRow}>
            {!isRecording && (
              <PrimaryButton title="Start Simulation" onPress={handleStart} />
            )}

            {isRecording && (
              <PrimaryButton
                title="Stop & Proceed"
                onPress={handleStop}
                style={styles.stopButton}
              />
            )}
          </View>

          {isRecording && masterTranscript.length > 0 && (
            <View style={styles.masterTranscriptPreview}>
              <Text style={styles.previewLabel}>Master Transcript Preview (First 200 chars):</Text>
              <Text style={styles.previewText}>{masterTranscript.substring(0, 200)}...</Text>
              <Text style={styles.transcriptLength}>Total length: {masterTranscript.length} characters</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
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
  statusSection: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statusBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  transcriptSection: {
    flex: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  transcriptBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  transcriptText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    fontFamily: 'Courier New',
  },
  buttonRow: {
    marginBottom: 12,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#d32f2f',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  processingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  masterTranscriptPreview: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  transcriptLength: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
  },
});


