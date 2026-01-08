// src/hooks/useChunkedAudioRecorder.js
import { useState, useRef, useCallback } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const CHUNK_DURATION_MS = 5000; // 15 seconds per chunk

export default function useChunkedAudioRecorder() {
  const recorder = useRef(new AudioRecorderPlayer()).current;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [liveTranscripts, setLiveTranscripts] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);

  const chunkTimer = useRef(null);
  const recordStartTime = useRef(0);
  const currentChunkPath = useRef('');
  const allChunkPaths = useRef([]);
  const accumulatedTranscripts = useRef([]);

  const generateChunkPath = useCallback((index) => {
    const timestamp = Date.now();
    return `${RNFS.DocumentDirectoryPath}/chunk_${index}_${timestamp}.mp4`
  }, []);

  const startNewChunk = useCallback(async () => {
    const chunkPath = generateChunkPath(currentChunkIndex);
    
    const audioSet = {
      AudioEncoderAndroid: 3, // AAC
      AudioSourceAndroid: 1, // MIC
      AVEncoderAudioQualityKeyIOS: 2, // High
      AVNumberOfChannelsKeyIOS: 1,
      AVFormatIDKeyIOS: 2, // AAC
      AudioSampleRateInHz: 16000,
    };

    currentChunkPath.current = chunkPath;
    await recorder.startRecorder(chunkPath, audioSet);
    allChunkPaths.current.push(chunkPath);
  }, [currentChunkIndex, recorder, generateChunkPath]);

  const processCurrentChunk = useCallback(async (onChunkTranscribed) => {
    if (!currentChunkPath.current) return;

    setIsProcessingChunk(true);

    try {
      // Stop current chunk
      await recorder.stopRecorder();

      // Trigger transcription callback
      if (onChunkTranscribed) {
        const transcript = await onChunkTranscribed(
          currentChunkPath.current,
          currentChunkIndex
        );

        if (transcript) {
          const segment = {
            text: transcript,
            timestamp: Date.now() - recordStartTime.current,
            chunkIndex: currentChunkIndex,
          };

          setLiveTranscripts(prev => [...prev, segment]);
          accumulatedTranscripts.current.push(transcript);
        }
      }

      setCurrentChunkIndex(prev => prev + 1);

      // Start next chunk if still recording
      if (isRecording) {
        await startNewChunk();
      }
    } catch (error) {
      console.error('Error processing chunk:', error);
    } finally {
      setIsProcessingChunk(false);
    }
  }, [currentChunkIndex, recorder, isRecording, startNewChunk]);

  const startRecording = useCallback(async (onChunkTranscribed) => {
    try {
      // Reset state
      setCurrentChunkIndex(0);
      allChunkPaths.current = [];
      accumulatedTranscripts.current = [];
      recordStartTime.current = Date.now();
      setLiveTranscripts([]);
      setIsRecording(true);

      // Start first chunk
      await startNewChunk();

      // Set up progress listener
      recorder.addRecordBackListener((e) => {
        setRecordTime(recorder.mmssss(Math.floor(e.currentPosition)));
      });

      // Set up chunk rotation timer
      chunkTimer.current = setInterval(() => {
        processCurrentChunk(onChunkTranscribed);
      }, CHUNK_DURATION_MS);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [recorder, startNewChunk, processCurrentChunk]);

  const stopRecording = useCallback(async (onChunkTranscribed) => {
    try {
      setIsRecording(false);

      if (chunkTimer.current) {
        clearInterval(chunkTimer.current);
        chunkTimer.current = null;
      }

      // Process final chunk
      await processCurrentChunk(onChunkTranscribed);

      recorder.removeRecordBackListener();

      return {
        chunkPaths: allChunkPaths.current,
        transcripts: accumulatedTranscripts.current,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }, [recorder, processCurrentChunk]);

  const cleanupChunks = useCallback(async () => {
    for (const chunkPath of allChunkPaths.current) {
      try {
        const exists = await RNFS.exists(chunkPath);
        if (exists) {
          await RNFS.unlink(chunkPath);
        }
      } catch (error) {
        console.error('Failed to delete chunk:', error);
      }
    }
    allChunkPaths.current = [];
  }, []);

  return {
    isRecording,
    recordTime,
    liveTranscripts,
    currentChunkIndex,
    isProcessingChunk,
    startRecording,
    stopRecording,
    cleanupChunks,
    getAccumulatedTranscripts: () => accumulatedTranscripts.current,
  };
}