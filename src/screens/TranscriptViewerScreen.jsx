import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button, StyleSheet } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function TranscriptViewerScreen({ route }) {
    const { sessionName, audioFilePath, transcriptFilePath } = route.params;
    const [transcript, setTranscript] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef(new AudioRecorderPlayer());
    const { summarizeTranscript, isSummarizing } = useTranscriptAPI();

    // Load the transcript when the screen loads
    useEffect(() => {
        const loadTranscript = async () => {
            try {
                const transcriptData = await RNFS.readFile(transcriptFilePath, 'utf8');
                setTranscript(transcriptData);
            } catch (error) {
                console.error('Error loading transcript:', error);
            }
        };
        loadTranscript();

        // Cleanup player on unmount
        return () => {
            playerRef.current.stopPlayer();
        };
    }, [transcriptFilePath]);

    const playAudio = async () => {
        try {
            if (isPlaying) {
                await playerRef.current.stopPlayer();
                setIsPlaying(false);
            } else {
                await playerRef.current.startPlayer(audioFilePath);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            alert('Error playing audio: ' + error.message);
        }
    };

    const handleSummary = async (summaryType) => {
        if (transcript) {
            const summary = await summarizeTranscript(transcript, summaryType);
            alert(`${summaryType} Summary: \n${summary}`);
        } else {
            alert('Transcript is not available.');
        }
    };

    const handleExportNotes = () => {
        alert('Exporting notes... (dummy functionality for now)');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{sessionName}</Text>

            <PrimaryButton title={isPlaying ? "Stop Recording" : "Play Recording"} onPress={playAudio} />

            <View style={styles.buttonContainer}>
                <PrimaryButton title="Read Full Transcript" onPress={() => alert(transcript)} />
                <PrimaryButton title="Get Quick Summary" onPress={() => handleSummary('quick')} />
                <PrimaryButton title="Get Detailed Summary" onPress={() => handleSummary('detailed')} />
                <PrimaryButton title="Export Notes" onPress={handleExportNotes} />
            </View>

            <ScrollView style={styles.transcript}>
                <Text>{transcript || 'No transcript available.'}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, marginBottom: 10 },
    buttonContainer: { marginTop: 20 },
    transcript: { marginTop: 16 },
});
