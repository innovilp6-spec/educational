import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import { requestMicPermission } from '../utils/permissions';
import PrimaryButton from '../components/PrimaryButton';

const CHUNK_INTERVAL = 5000; // 5 seconds of continuous recording per chunk

export default function LectureCaptureScreen({ navigation }) {
  const {
    isRecording,
    audioPath,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecorder();

  const { transcribeAudioChunk, isTranscribing } = useTranscriptAPI();

  const [masterTranscript, setMasterTranscript] = useState('');
  const [currentChunkTranscript, setCurrentChunkTranscript] = useState('');
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const chunkStartTimeRef = useRef(Date.now());
  const audioPathRef = useRef(null);

  const handleStart = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Microphone access is needed.');
      return;
    }

    setMasterTranscript('');
    setCurrentChunkTranscript('');
    setChunkCount(0);
    isProcessingRef.current = false;

    try {
      console.log('Starting continuous recording...');
      const recordingPath = await startRecording();
      console.log('Recording started, path:', recordingPath);
      // Sync to ref immediately
      audioPathRef.current = recordingPath;

      // Wait longer for the recording to fully stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Recording stabilized, starting chunk processing...');
      startChunkInterval();
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const startChunkInterval = () => {
    intervalRef.current = setInterval(async () => {
      // Skip if already processing
      if (isProcessingRef.current) {
        console.log('Already processing chunk, skipping...');
        return;
      }

      try {
        isProcessingRef.current = true;
        setIsProcessingChunk(true);

        console.log('Chunk interval fired, current audioPath from ref:', audioPathRef.current);
        console.log('Processing chunk, pausing recording...');

        // Pause the continuous recording to finalize the current chunk
        await pauseRecording();

        // Give it a moment to finalize
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use the ref to get the current audio path (avoids closure issues)
        if (audioPathRef.current) {
          console.log('Got audio path for chunk:', audioPathRef.current);

          try {
            // Transcribe the audio chunk
            const transcription = await transcribeAudioChunk(audioPathRef.current);

            // Update current chunk transcript for display
            setCurrentChunkTranscript(transcription);

            // Append to master transcript
            setMasterTranscript(prev =>
              prev ? `${prev} ${transcription}` : transcription
            );

            setChunkCount(prev => prev + 1);
            console.log('Chunk processed successfully');
          } catch (transcribeError) {
            console.error('Transcription error:', transcribeError);
          }
        } else {
          console.warn('No audio path available in ref at interval');
        }

        // Resume recording to continue capturing
        console.log('Resuming recording for next chunk...');
        await resumeRecording();

        setIsProcessingChunk(false);
        isProcessingRef.current = false;
      } catch (error) {
        console.error('Error processing chunk:', error);
        setIsProcessingChunk(false);
        isProcessingRef.current = false;

        // Try to resume recording even if there was an error
        try {
          await resumeRecording();
          console.log('Resumed recording after error');
        } catch (resumeError) {
          console.error('Failed to resume recording:', resumeError);
        }
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

    console.log('Stopping recording...');
    // Stop the continuous recording
    const finalAudioPath = await stopRecording();

    if (finalAudioPath) {
      try {
        // Transcribe the final chunk
        console.log('Transcribing final chunk...');
        const lastTranscription = await transcribeAudioChunk(finalAudioPath);

        // Append to master transcript
        const finalTranscript = masterTranscript
          ? `${masterTranscript} ${lastTranscription}`
          : lastTranscription;

        setMasterTranscript(finalTranscript);
        setCurrentChunkTranscript(lastTranscription);
        setChunkCount(prev => prev + 1);
        console.log('Final chunk processed');

        // Navigate to Transcribing screen with the master transcript
        navigation.replace('Transcribing', { masterTranscript: finalTranscript });
      } catch (transcribeError) {
        console.error('Error transcribing final chunk:', transcribeError);
        navigation.replace('Transcribing', { masterTranscript });
      }
    } else {
      console.warn('No final audio path');
      navigation.replace('Transcribing', { masterTranscript });
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    setIsProcessingChunk(false);
    isProcessingRef.current = false;
  }
};

useEffect(() => {
  // Sync audioPath from hook to ref whenever it changes
  audioPathRef.current = audioPath;
  console.log('audioPath updated in ref:', audioPath);
}, [audioPath]);

useEffect(() => {
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);

return (
  <View style={styles.container}>
    {/* <Text style={styles.title}>Live Lecture Capture</Text>

    <View style={styles.statusContainer}>
      <Text style={styles.statusText}>
        Status: {!isRecording ? 'Ready' : isProcessingChunk ? 'Processing chunk...' : 'Recording...'}
      </Text>
      <Text style={styles.chunkCountText}>Chunks processed: {chunkCount}</Text>
    </View> */}

    <View style={styles.buttonRow}>
      {!isRecording && (
        <PrimaryButton title="Start Recording" onPress={handleStart} />
      )}

      {isRecording && (
        <PrimaryButton title="Stop Recording" onPress={handleStop} />
      )}
    </View>

    <View style={styles.transcriptSection}>
      {/* <Text style={styles.sectionTitle}>Current Chunk:</Text> */}
      <ScrollView style={styles.transcriptBox}>
        <Text style={styles.transcriptText}>
          {currentChunkTranscript || 'Waiting for the transcript...'}
        </Text>
      </ScrollView>
    </View>

    {/* <View style={styles.transcriptSection}>
      <Text style={styles.sectionTitle}>Master Transcript:</Text>
      <ScrollView style={styles.transcriptBox}>
        <Text style={styles.transcriptText}>
          {masterTranscript || 'No transcription yet...'}
        </Text>
      </ScrollView>
    </View> */}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  chunkCountText: {
    fontSize: 12,
    color: '#1976d2',
  },
  buttonRow: {
    marginBottom: 16,
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
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
});


