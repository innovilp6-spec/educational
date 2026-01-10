import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function TranscriptViewerScreen({ route, navigation }) {
    const { sessionName, transcript, transcriptId } = route.params;
    const [displayTranscript] = useState(transcript || '');
    const [quickSummary, setQuickSummary] = useState(null);
    const [detailedSummary, setDetailedSummary] = useState(null);
    const [currentView, setCurrentView] = useState('transcript'); // 'transcript', 'quick', 'detailed'
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [summaryFolderPath, setSummaryFolderPath] = useState(null);
    const { generateSummary } = useTranscriptAPI();

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
            
            // Try to load existing summaries
            await loadSummariesFromFiles(sessionFolder);
        } catch (err) {
            console.error('Error initializing summary folder:', err);
        }
    };

    const loadSummariesFromFiles = async (folderPath) => {
        try {
            const quickPath = `${folderPath}/quick_summary.txt`;
            const detailedPath = `${folderPath}/detailed_summary.txt`;

            const quickExists = await RNFS.exists(quickPath);
            const detailedExists = await RNFS.exists(detailedPath);

            if (quickExists) {
                const quickContent = await RNFS.readFile(quickPath, 'utf8');
                setQuickSummary(quickContent);
                console.log('Loaded quick summary from file');
            }

            if (detailedExists) {
                const detailedContent = await RNFS.readFile(detailedPath, 'utf8');
                setDetailedSummary(detailedContent);
                console.log('Loaded detailed summary from file');
            }
        } catch (err) {
            console.error('Error loading summaries from files:', err);
        }
    };

    const saveSummaryToFile = async (fileName, content) => {
        try {
            if (!summaryFolderPath) return;
            const filePath = `${summaryFolderPath}/${fileName}`;
            await RNFS.writeFile(filePath, content, 'utf8');
            console.log(`Saved ${fileName}`);
        } catch (err) {
            console.error(`Error saving ${fileName}:`, err);
        }
    };

    const handleGenerateSummary = async (summaryType) => {
        if (!displayTranscript || !transcriptId) {
            Alert.alert('Error', 'Unable to generate summary. Transcript ID is missing.');
            return;
        }

        // Check if summary already exists
        if (summaryType === 'quick' && quickSummary) {
            setCurrentView('quick');
            return;
        }
        if (summaryType === 'detailed' && detailedSummary) {
            setCurrentView('detailed');
            return;
        }

        // Generate new summary via server API
        try {
            setIsLoadingSummary(true);
            console.log(`Generating ${summaryType} summary from server for transcript ${transcriptId}...`);
            
            const summary = await generateSummary(transcriptId, summaryType);
            
            if (summaryType === 'quick') {
                setQuickSummary(summary);
                await saveSummaryToFile('quick_summary.txt', summary);
                setCurrentView('quick');
            } else if (summaryType === 'detailed') {
                setDetailedSummary(summary);
                await saveSummaryToFile('detailed_summary.txt', summary);
                setCurrentView('detailed');
            }
        } catch (err) {
            console.error(`Error generating ${summaryType} summary:`, err);
            Alert.alert('Error', `Failed to generate ${summaryType} summary. Please try again.`);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const getDisplayContent = () => {
        switch (currentView) {
            case 'quick':
                return quickSummary || 'Quick summary not available.';
            case 'detailed':
                return detailedSummary || 'Detailed summary not available.';
            case 'transcript':
            default:
                return displayTranscript || 'No transcript available.';
        }
    };

    const getViewTitle = () => {
        switch (currentView) {
            case 'quick':
                return 'Quick Summary';
            case 'detailed':
                return 'Detailed Summary';
            case 'transcript':
            default:
                return 'Full Transcript';
        }
    };

    const buttonsDisabled = isLoadingSummary;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{sessionName}</Text>

            {isLoadingSummary && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Summarising...</Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <PrimaryButton 
                    title="Transcript" 
                    onPress={() => setCurrentView('transcript')}
                    disabled={buttonsDisabled}
                />
                <PrimaryButton 
                    title="Quick Summary" 
                    onPress={() => handleGenerateSummary('quick')}
                    disabled={buttonsDisabled}
                />
                <PrimaryButton 
                    title="Detailed Summary" 
                    onPress={() => handleGenerateSummary('detailed')}
                    disabled={buttonsDisabled}
                />
            </View>

            <View style={styles.transcriptSection}>
                <Text style={styles.sectionTitle}>{getViewTitle()}:</Text>
                <ScrollView style={styles.transcriptBox}>
                    <Text style={styles.transcriptText}>
                        {getDisplayContent()}
                    </Text>
                </ScrollView>
            </View>

            <View style={styles.studyButtonContainer}>
                <PrimaryButton 
                    title="Study with Coach" 
                    onPress={() => navigation.navigate('AgenticCoach', {
                        transcriptId,
                        sessionName,
                        contextType: 'recording',
                        transcript: displayTranscript,
                    })}
                    disabled={buttonsDisabled}
                />
            </View>
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
        fontSize: 20, 
        fontWeight: 'bold',
        marginBottom: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginLeft: 12,
    },
    buttonContainer: { 
        marginBottom: 16,
    },
    studyButtonContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    transcriptSection: {
        flex: 1,
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
        fontSize: 14, 
        lineHeight: 22,
        color: '#333',
    },
});

