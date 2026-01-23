import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

const DebugTranscribeScreen = ({ navigation }) => {
    const { transcribeAudioChunk } = useTranscriptAPI();
    const [loading, setLoading] = useState(false);
    const [testFile, setTestFile] = useState(null);
    const [result, setResult] = useState(null);
    const [logs, setLogs] = useState('');

    const addLog = (message) => {
        console.log('[DebugTranscribeScreen]', message);
        setLogs(prev => prev + '\n' + message);
    };

    const loadFirstFile = async () => {
        try {
            setLogs('');
            addLog('===== LOADING FIRST AUDIO FILE =====');
            addLog(`Path: ${RNFS.DownloadDirectoryPath}`);

            const files = await RNFS.readDir(RNFS.DownloadDirectoryPath);
            addLog(`Found ${files.length} items in Downloads`);

            const audioFiles = files
                .filter(f => {
                    const ext = f.name.toLowerCase().split('.').pop();
                    return ['wav', 'mp3', 'm4a', 'aac', 'ogg'].includes(ext);
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            addLog(`Found ${audioFiles.length} audio files`);

            if (audioFiles.length === 0) {
                Alert.alert('No Audio Files', 'No audio files found in Downloads');
                return;
            }

            const firstFile = audioFiles[0];
            addLog(`First file: ${firstFile.name}`);
            addLog(`Full path: ${firstFile.path}`);

            setTestFile(firstFile);
            addLog('✓ File loaded successfully');
        } catch (error) {
            addLog(`❌ Error loading file: ${error.message}`);
            Alert.alert('Error', error.message);
        }
    };

    const testTranscribe = async () => {
        if (!testFile) {
            Alert.alert('No File', 'Load a file first');
            return;
        }

        try {
            setLoading(true);
            setResult(null);
            addLog('\n===== STARTING TRANSCRIPTION TEST =====');
            addLog(`File: ${testFile.name}`);
            addLog(`Path: ${testFile.path}`);

            addLog('Calling transcribeAudioChunk()...');
            const transcribedText = await transcribeAudioChunk(testFile.path);

            addLog('\n===== TRANSCRIPTION RESULT =====');
            addLog(`✓ Success!`);
            addLog(`Text length: ${transcribedText.length}`);
            addLog(`Text: ${transcribedText}`);

            setResult({
                success: true,
                text: transcribedText,
                length: transcribedText.length,
            });
        } catch (error) {
            addLog('\n===== TRANSCRIPTION FAILED =====');
            addLog(`❌ Error: ${error.message}`);

            setResult({
                success: false,
                error: error.message,
            });

            Alert.alert('Transcription Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Debug: Single File Transcription</Text>
                <Button title="Back" onPress={() => navigation.goBack()} />
            </View>

            <ScrollView style={styles.content}>
                {/* File Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Load Audio File</Text>
                    <Button title="Load First File from Downloads" onPress={loadFirstFile} color="#007AFF" />
                    {testFile && (
                        <View style={styles.fileInfo}>
                            <Text style={styles.infoLabel}>Loaded File:</Text>
                            <Text style={styles.infoValue}>{testFile.name}</Text>
                            <Text style={styles.infoValue} numberOfLines={2}>{testFile.path}</Text>
                        </View>
                    )}
                </View>

                {/* Transcription */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Transcribe</Text>
                    <Button
                        title={loading ? "Transcribing..." : "Test Transcription"}
                        onPress={testTranscribe}
                        disabled={!testFile || loading}
                        color={testFile && !loading ? "#34C759" : "#CCCCCC"}
                    />
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Transcribing...</Text>
                        </View>
                    )}
                </View>

                {/* Result */}
                {result && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Result</Text>
                        {result.success ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>✓ Transcription Successful</Text>
                                <Text style={styles.resultLabel}>Length:</Text>
                                <Text style={styles.resultValue}>{result.length} characters</Text>
                                <Text style={styles.resultLabel}>Text:</Text>
                                <Text style={styles.resultValue}>{result.text}</Text>
                            </View>
                        ) : (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>✗ Transcription Failed</Text>
                                <Text style={styles.resultLabel}>Error:</Text>
                                <Text style={styles.resultValue}>{result.error}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Logs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Detailed Logs</Text>
                    <View style={styles.logsBox}>
                        <Text style={styles.logsText}>{logs || '(logs will appear here)'}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    fileInfo: {
        marginTop: 12,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginTop: 8,
    },
    infoValue: {
        fontSize: 12,
        color: '#333',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    loadingContainer: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#007AFF',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: '#f0f9f4',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#34C759',
    },
    successText: {
        color: '#34C759',
        fontWeight: '600',
        marginBottom: 12,
    },
    errorBox: {
        backgroundColor: '#f9f0f0',
        padding: 12,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontWeight: '600',
        marginBottom: 12,
    },
    resultLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginTop: 8,
    },
    resultValue: {
        fontSize: 12,
        color: '#333',
        marginTop: 4,
        fontFamily: 'monospace',
        lineHeight: 18,
    },
    logsBox: {
        backgroundColor: '#1e1e1e',
        padding: 10,
        borderRadius: 6,
        height: 250,
    },
    logsText: {
        color: '#00ff00',
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 14,
    },
});

export default DebugTranscribeScreen;
