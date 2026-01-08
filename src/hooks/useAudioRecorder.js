import { useState, useRef } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

export default function useAudioRecorder() {
  // Use a SINGLE recorder instance throughout the app lifecycle
  const recorderRef = useRef(new AudioRecorderPlayer());
  // Use Refs for state that needs to be reliable in async contexts
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const audioPathRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioPath, setAudioPath] = useState(null);

  const startRecording = async () => {
    try {
      // If already recording, return current path
      if (isRecordingRef.current) {
        console.log('Already recording');
        return audioPathRef.current;
      }

      const path = await recorderRef.current.startRecorder();
      setAudioPath(path);
      audioPathRef.current = path;
      setIsRecording(true);
      isRecordingRef.current = true;
      isPausedRef.current = false;
      setIsPaused(false);
      console.log('Started recording:', path);
      return path;
    } catch (error) {
      console.error('Error starting recorder:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
      throw error;
    }
  };

  const pauseRecording = async () => {
    try {
      if (!isRecordingRef.current) {
        console.warn('Not recording, cannot pause');
        return;
      }
      if (isPausedRef.current) {
        console.warn('Already paused');
        return;
      }

      await recorderRef.current.pauseRecorder();
      setIsPaused(true);
      isPausedRef.current = true;
      console.log('Paused recording');
    } catch (error) {
      console.error('Error pausing recorder:', error);
      throw error;
    }
  };

  const resumeRecording = async () => {
    try {
      if (!isRecordingRef.current) {
        console.warn('Not recording, cannot resume');
        return;
      }
      if (!isPausedRef.current) {
        console.warn('Not paused, cannot resume');
        return;
      }

      await recorderRef.current.resumeRecorder();
      setIsPaused(false);
      isPausedRef.current = false;
      console.log('Resumed recording');
    } catch (error) {
      console.error('Error resuming recorder:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    try {
      // Only stop if actually recording
      if (!isRecordingRef.current) {
        console.warn('Not recording, cannot stop');
        return null;
      }

      const result = await recorderRef.current.stopRecorder();
      setIsRecording(false);
      isRecordingRef.current = false;
      isPausedRef.current = false;
      setIsPaused(false);

      console.log('Stopped recording, got path:', result);
      return result;
    } catch (error) {
      console.error('Error stopping recorder:', error);
      setIsRecording(false);
      isRecordingRef.current = false;
      isPausedRef.current = false;
      setIsPaused(false);
      return null;
    }
  };

  const playRecording = async () => {
    if (!audioPathRef.current) {
      console.warn('No audio path to play');
      return;
    }
    try {
      await recorderRef.current.startPlayer(audioPathRef.current);
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  };

  const stopPlayback = async () => {
    try {
      await recorderRef.current.stopPlayer();
    } catch (error) {
      console.error('Error stopping playback:', error);
      throw error;
    }
  };

  return {
    isRecording,
    isPaused,
    audioPath,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    stopPlayback,
  };
}


