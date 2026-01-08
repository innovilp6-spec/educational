// src/screens/CaptureLectureScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { requestMicPermission } from '../utils/permissions';
import PrimaryButton from '../components/PrimaryButton';
export default function LectureCaptureScreen({ navigation }) {
  const {
    isRecording,
    isPaused,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useAudioRecorder();

  const handleStart = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Microphone access is needed.');
      return;
    }
    await startRecording();
  };

  const handleStop = async () => {
    const audioPath = await stopRecording();
    navigation.replace('Transcribing', { audioPath });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lecture Capture</Text>

      {!isRecording && (
        <PrimaryButton title="Start Recording" onPress={handleStart} />
      )}

      {isRecording && !isPaused && (
        <PrimaryButton title="Pause" onPress={pauseRecording} />
      )}

      {isPaused && (
        <PrimaryButton title="Resume" onPress={resumeRecording} />
      )}

      {isRecording && (
        <PrimaryButton title="Stop Recording" onPress={handleStop} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 20 },
});
