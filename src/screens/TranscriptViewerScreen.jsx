import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import RNFS from 'react-native-fs';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import FloatingActionMenu from '../components/FloatingActionMenu';
import { useAuth } from '../context/AuthContext';
import SpecialText from '../components/SpecialText';

const SERVER_BASE_URL = 'http://10.0.2.2:5000';

export default function TranscriptViewerScreen({ route, navigation }) {
    const { sessionName, transcript, transcriptId } = route.params;
    const [displayTranscript] = useState(transcript || '');
    const [summary, setSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [summaryFolderPath, setSummaryFolderPath] = useState(null);
    const { generateSummary } = useTranscriptAPI();
    const { getUserEmail } = useAuth();

    useEffect(() => {
        initializeSummaryFolder();
    }, [sessionName]);

    const initializeSummaryFolder = async () => {
        try {
            const documentsPath = RNFS.DocumentDirectoryPath;
            const sessionFolder = `${documentsPath}/${sessionName.replace(/\s+/g, '_')}`;
            
            // Create session folder if it doesn't exist
            const exists = await RNFS.exists(sessionFolder);
            if (!exists) {
                await RNFS.mkdir(sessionFolder, { NSURLIsExcludedFromBackupKey: true });
            }
            
            setSummaryFolderPath(sessionFolder);
            
            // Try to load existing summary
            await loadSummaryFromFile(sessionFolder);
        } catch (err) {
            console.error('Error initializing summary folder:', err);
        }
    };

    const loadSummaryFromFile = async (folderPath) => {
        try {
            const summaryPath = `${folderPath}/summary.txt`;
            const exists = await RNFS.exists(summaryPath);

            if (exists) {
                const content = await RNFS.readFile(summaryPath, 'utf8');
                setSummary(content);
                console.log('Loaded summary from file');
            }
        } catch (err) {
            console.error('Error loading summary from file:', err);
        }
    };

    const saveSummaryToFile = async (content) => {
        try {
            if (!summaryFolderPath) return;
            const filePath = `${summaryFolderPath}/summary.txt`;
            await RNFS.writeFile(filePath, content, 'utf8');
            console.log('Saved summary');
        } catch (err) {
            console.error('Error saving summary:', err);
        }
    };

    const fixTranscriptOwnership = async () => {
        try {
            console.log('[fixTranscriptOwnership] Attempting to fix transcript ownership');
            const userEmail = getUserEmail();
            
            const response = await fetch(`${SERVER_BASE_URL}/api/lectures/transcript/${transcriptId}/fix-ownership`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fix ownership');
            }

            console.log('[fixTranscriptOwnership] Successfully fixed ownership:', data);
            return true;
        } catch (err) {
            console.error('[fixTranscriptOwnership] Error:', err);
            return false;
        }
    };

    const handleGenerateSummary = async () => {
        // If summary already exists, don't regenerate
        if (summary && summary.trim().length > 0) {
            return;
        }

        if (!displayTranscript || !transcriptId) {
            Alert.alert('Error', 'Unable to generate summary. Transcript ID is missing.');
            return;
        }

        try {
            setIsLoadingSummary(true);
            console.log(`[TranscriptViewerScreen] Generating summary from server for transcript ${transcriptId}...`);
            
            const generatedSummary = await generateSummary(transcriptId);
            
            setSummary(generatedSummary);
            await saveSummaryToFile(generatedSummary);
        } catch (err) {
            console.error('[TranscriptViewerScreen] Error generating summary:', err);
            
            // Handle specific error cases
            if (err.message.includes('403')) {
                console.log('[TranscriptViewerScreen] Got 403 - attempting to fix ownership...');
                
                // Try to fix ownership
                const fixed = await fixTranscriptOwnership();
                
                if (fixed) {
                    // Retry generating summary
                    try {
                        const generatedSummary = await generateSummary(transcriptId);
                        setSummary(generatedSummary);
                        await saveSummaryToFile(generatedSummary);
                        Alert.alert('Success', 'Transcript ownership fixed and summary generated!');
                    } catch (retryErr) {
                        console.error('[TranscriptViewerScreen] Retry failed:', retryErr);
                        Alert.alert('Error', 'Failed to generate summary after fixing ownership. Please try again.');
                    }
                } else {
                    Alert.alert('Authorization Error', 'Could not fix transcript ownership. Please contact support.');
                }
            } else if (err.message.includes('404')) {
                Alert.alert('Not Found', 'The transcript could not be found. Please try recording again.');
            } else {
                Alert.alert('Error', 'Failed to generate summary. Please try again.');
            }
        } finally {
            setIsLoadingSummary(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <SpecialText style={styles.title}>{sessionName}</SpecialText>
            </View>

            <View style={styles.contentContainer}>
                {/* Summary Card - Top Half (Pinned Scrollable) */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryHeader}>
                        <SpecialText style={styles.summaryTitle}>Summary</SpecialText>
                        {!summary && !isLoadingSummary && (
                            <TouchableOpacity
                                style={styles.generateButton}
                                onPress={handleGenerateSummary}
                            >
                                <SpecialText style={styles.generateButtonText}>Generate</SpecialText>
                            </TouchableOpacity>
                        )}
                        {isLoadingSummary && (
                            <ActivityIndicator size="small" color="#007AFF" />
                        )}
                    </View>
                    
                    <ScrollView style={styles.summaryBox} showsVerticalScrollIndicator={false}>
                        {summary ? (
                            <SpecialText style={styles.summaryText}>{summary}</SpecialText>
                        ) : (
                            <SpecialText style={styles.placeholderText}>
                                {isLoadingSummary ? 'Generating summary...' : 'No summary yet. Tap Generate to create one.'}
                            </SpecialText>
                        )}
                    </ScrollView>
                </View>

                {/* Transcript - Bottom Half (Scrollable) */}
                <View style={styles.transcriptSection}>
                    <SpecialText style={styles.transcriptTitle}>Full Transcript</SpecialText>
                    <ScrollView style={styles.transcriptBox} showsVerticalScrollIndicator={false}>
                        <SpecialText style={styles.transcriptText}>
                            {displayTranscript || 'No transcript available.'}
                        </SpecialText>
                    </ScrollView>
                </View>
            </View>

            {/* Floating Action Button */}
            <View style={styles.fabContainer}>
                <FloatingActionMenu
                    actions={[
                        {
                            icon: '🧠',
                            label: 'Coach',
                            onPress: () => navigation.navigate('AgenticCoach', {
                                transcriptId,
                                sessionName,
                                contextType: 'lecture',
                                transcript: displayTranscript,
                            }),
                        },
                    ]}
                />
            </View>
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
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    title: { 
        fontSize: 22, 
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'column',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 12,
    },
    // Summary Section - Top Half
    summarySection: {
        flex: 0.5,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#f8f8f8',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 0.5,
    },
    generateButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    generateButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    summaryBox: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
    },
    placeholderText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 24,
    },
    // Transcript Section - Bottom Half
    transcriptSection: {
        flex: 0.5,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    transcriptTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 0.5,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#f8f8f8',
    },
    transcriptBox: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    transcriptText: { 
        fontSize: 14, 
        lineHeight: 22,
        color: '#333',
    },
    // Floating Action Button
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
});

