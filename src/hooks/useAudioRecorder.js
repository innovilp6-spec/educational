import { useState, useRef } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

export default function useAudioRecorder() {
  const recorder = useRef(new AudioRecorderPlayer()).current;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioPath, setAudioPath] = useState(null);

  const startRecording = async () => {
    const path = await recorder.startRecorder();
    setAudioPath(path);
    setIsRecording(true);
    setIsPaused(false);
  };

  const pauseRecording = async () => {
    await recorder.pauseRecorder();
    setIsPaused(true);
  };

  const resumeRecording = async () => {
    await recorder.resumeRecorder();
    setIsPaused(false);
  };

  const stopRecording = async () => {
    const result = await recorder.stopRecorder();
    setAudioPath(result);
    setIsRecording(false);
    setIsPaused(false);
    return result;
  };

  const playRecording = async () => {
    if (!audioPath) return;
    await recorder.startPlayer(audioPath);
  };

  const stopPlayback = async () => {
    await recorder.stopPlayer();
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
