import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    FlatList,
    Share,
} from 'react-native';
import RNFS from 'react-native-fs';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import useSimpleSTT from '../hooks/useSimpleSTT';
import useVoiceModality from '../hooks/useVoiceModality';
import { VoiceContext } from '../context/VoiceContext';
import FloatingActionMenu from '../components/FloatingActionMenu';
import SpecialText from '../components/SpecialText';

export default function AgenticNotesScreen({ route, navigation }) {
    const { transcriptId, sessionName, transcript } = route.params || {};
    const { settings } = React.useContext(VoiceContext);
    const voiceEnabled = settings?.voiceEnabled ?? true;

    // State management
    const [notes, setNotes] = useState([]);
    const [currentNoteId, setCurrentNoteId] = useState(null);
    const [currentNote, setCurrentNote] = useState(null);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showNotesList, setShowNotesList] = useState(true);

    // API hook
    const {
        agenticCreateNote,
        agenticGetUserNotes,
        agenticEditNote,
        agenticAppendNote,
        agenticGetNote,
    } = useTranscriptAPI();

    // Voice hooks for note input
    const stt = useSimpleSTT({
        onTranscript: (transcript) => setUserInput(transcript),
        autoSubmitOnSilence: false,
    });

    const voiceCommandHandlers = {
        saveNote: async () => {
            console.log('[NOTES-VOICE] Save note');
            if (userInput.trim()) {
                await handleSendMessage();
            } else {
                stt.speakMessage('No text to save. Please say something to save.');
            }
        },
        newNote: async () => {
            console.log('[NOTES-VOICE] New note');
            setCurrentNoteId(null);
            setCurrentNote(null);
            setMessages([]);
            setUserInput('');
            stt.speakMessage('Starting a new note');
        },
        clearText: async () => {
            console.log('[NOTES-VOICE] Clear text');
            setUserInput('');
            stt.speakMessage('Text cleared');
        },
    };

    const voice = useVoiceModality('AgenticNotes', voiceCommandHandlers, {
        enableAutoTTS: true,
    });

    // Scroll reference
    const scrollViewRef = useRef(null);

    // Export note as text file
    const exportNoteAsText = async () => {
        if (!currentNote) return;

        try {
            const fileName = `${currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
            const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

            // Format note content with metadata
            const exportContent = `# ${currentNote.title}

**Standard:** ${currentNote.standard}
**Chapter:** ${currentNote.chapter}
**Topic:** ${currentNote.topic}
**Version:** ${currentNote.version || 1}
**Created:** ${new Date(currentNote.createdAt).toLocaleString()}

---

## Content

${currentNote.content}

---

## Conversation History

${(currentNote.conversationHistory || [])
                    .map((entry, idx) => `
### Change ${idx + 1}
**Type:** ${entry.type}
**Instruction:** ${entry.instruction}
**Date:** ${new Date(entry.timestamp).toLocaleString()}
`)
                    .join('\n')}
`;

            // Write file
            await RNFS.writeFile(filePath, exportContent, 'utf8');

            // Share the file
            await Share.share({
                url: `file://${filePath}`,
                title: currentNote.title,
                message: `Note: ${currentNote.title}`,
            });

            Alert.alert('Success', `Note exported as text file`);
        } catch (error) {
            console.error('Error exporting note:', error);
            Alert.alert('Error', `Failed to export note: ${error.message}`);
        }
    };

    // Load notes list on mount
    useEffect(() => {
        loadNotesList();
    }, []);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (scrollViewRef.current && messages.length > 0) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const loadNotesList = async () => {
        try {
            setIsLoadingHistory(true);
            console.log('Loading user notes...');

            const notesList = await agenticGetUserNotes();
            console.log('Notes list retrieved:', notesList);

            setNotes(notesList);
        } catch (error) {
            console.error('Error loading notes list:', error);
            Alert.alert('Error', 'Failed to load notes list');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSelectNote = async (note) => {
        try {
            setIsLoadingHistory(true);
            console.log('Loading note details:', note._id);

            // Get full note with conversation history
            const fullNote = await agenticGetNote(note._id);
            console.log('Note loaded:', fullNote);

            setCurrentNoteId(note._id);
            setCurrentNote(fullNote);
            setShowNotesList(false);

            // Reconstruct messages from conversation history
            const reconstructedMessages = [];

            // Add system message about note
            reconstructedMessages.push({
                id: `system-${note._id}`,
                type: 'system',
                text: `Opened note: "${fullNote.title}"`,
                timestamp: new Date(),
            });

            // Add conversation history
            if (fullNote.conversationHistory && fullNote.conversationHistory.length > 0) {
                fullNote.conversationHistory.forEach((entry, idx) => {
                    reconstructedMessages.push({
                        id: `history-${idx}`,
                        type: 'user',
                        text: entry.instruction || entry.content || entry.appendInstruction,
                        timestamp: entry.timestamp,
                    });
                });
            }

            setMessages(reconstructedMessages);
        } catch (error) {
            console.error('Error loading note:', error);
            Alert.alert('Error', 'Failed to load note');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        const userMessage = userInput.trim();
        if (!userMessage) return;

        setUserInput('');

        try {
            setIsLoading(true);

            // Add user message to display immediately
            const userMessageId = `user-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: userMessageId,
                type: 'user',
                text: userMessage,
                timestamp: new Date(),
            }]);

            let response;

            if (!currentNoteId) {
                // Create new note from transcript or standalone
                console.log('Creating new note...');
                response = await agenticCreateNote({
                    content: transcript || userMessage,
                    standard: '10',
                    chapter: sessionName || 'Chapter 1',
                    topic: userMessage.substring(0, 50),
                    subject: 'General',
                    sourceType: transcript ? 'lecture' : 'standalone',
                    sourceId: transcriptId || null,
                    initialInstruction: userMessage,
                });

                console.log('Note created with response:', response);

                // Set current note
                setCurrentNoteId(response.noteId);
                setCurrentNote(response);

                // Add agent response message
                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    type: 'agent',
                    text: `✓ Created new note: "${response.title}"\n\n${response.contentPreview}...`,
                    timestamp: new Date(),
                }]);
            } else if (userMessage.toLowerCase().includes('add') || userMessage.toLowerCase().includes('append')) {
                // Append to note
                console.log('Appending to note:', currentNoteId);
                response = await agenticAppendNote(currentNoteId, {
                    appendInstruction: userMessage,
                });

                console.log('Note appended:', response);

                // Update current note
                const updatedNote = await agenticGetNote(currentNoteId);
                setCurrentNote(updatedNote);

                // Add agent response
                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    type: 'agent',
                    text: `✓ Updated note\n\nVersion: ${response.version}`,
                    timestamp: new Date(),
                }]);
            } else {
                // Edit note
                console.log('Editing note:', currentNoteId);
                response = await agenticEditNote(currentNoteId, {
                    editInstruction: userMessage,
                });

                console.log('Note edited:', response);

                // Update current note
                const updatedNote = await agenticGetNote(currentNoteId);
                setCurrentNote(updatedNote);

                // Add agent response
                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    type: 'agent',
                    text: `✓ Updated note\n\nVersion: ${response.version}`,
                    timestamp: new Date(),
                }]);
            }
        } catch (error) {
            console.error('Error processing message:', error);

            // Add error message to chat
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                type: 'error',
                text: `Error: ${error.message || 'Failed to process request'}`,
                timestamp: new Date(),
            }]);

            Alert.alert('Error', 'Failed to process your request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Show notes list view
    if (showNotesList) {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <SpecialText style={styles.header}>Notes</SpecialText>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={loadNotesList}
                        disabled={isLoadingHistory}
                    >
                        <Text style={styles.refreshButtonText}>↻</Text>
                    </TouchableOpacity>
                </View>

                {isLoadingHistory ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#000000" />
                        <SpecialText style={styles.loadingText}>Loading notes...</SpecialText>
                    </View>
                ) : notes.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <SpecialText style={styles.emptyText}>No notes yet</SpecialText>
                        <SpecialText style={styles.emptySubtext}>Start a conversation to create a note</SpecialText>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => setShowNotesList(false)}
                        >
                            <SpecialText style={styles.startButtonText}>Start New Note</SpecialText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={notes}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.noteItem}
                                onPress={() => handleSelectNote(item)}
                            >
                                <View style={styles.noteItemContent}>
                                    <SpecialText style={styles.noteItemTitle}>{item.title}</SpecialText>
                                    <SpecialText style={styles.noteItemMeta}>
                                        {item.standard} • {item.topic}
                                    </SpecialText>
                                    {/* <SpecialText style={styles.noteItemPreview} numberOfLines={2}>
                                        {item.content}
                                    </SpecialText> */}
                                    <SpecialText style={styles.noteItemDate}>
                                        v{item.version || 1} • {new Date(item.createdAt).toLocaleDateString()}
                                    </SpecialText>
                                </View>
                                <SpecialText style={styles.noteArrow}>›</SpecialText>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.notesList}
                    />
                )}
            </View>
        );
    }

    // Show conversation view
    return (
        <View style={styles.container}>
            <View style={styles.conversationHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setShowNotesList(true)}
                >
                    <SpecialText style={styles.backButtonText}>← Back</SpecialText>
                </TouchableOpacity>
                <SpecialText style={styles.conversationTitle}>
                    {currentNote ? currentNote.title : 'New Note'}
                </SpecialText>
                <View style={styles.headerButtonsGroup}>
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={exportNoteAsText}
                        disabled={isLoading}
                    >
                        <SpecialText style={styles.exportButtonText}>Export</SpecialText>
                    </TouchableOpacity>
                </View>
            </View>

            {isLoadingHistory ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000000" />
                    <SpecialText style={styles.loadingText}>Loading conversation...</SpecialText>
                </View>
            ) : (
                <>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        showsVerticalScrollIndicator={true}
                    >
                        {currentNote && (
                            <View style={styles.noteContentSection}>
                                <SpecialText style={styles.sectionTitle}><Text>📖</Text> Note Content</SpecialText>
                                <ScrollView style={styles.noteContentBox} nestedScrollEnabled={true}>
                                    <View style={styles.noteMetadata}>
                                        <View style={styles.metaRow}>
                                            <SpecialText style={styles.metaLabel}>Standard:</SpecialText>
                                            <SpecialText style={styles.metaValue}>{currentNote.standard}</SpecialText>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <SpecialText style={styles.metaLabel}>Chapter:</SpecialText>
                                            <SpecialText style={styles.metaValue}>{currentNote.chapter}</SpecialText>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <SpecialText style={styles.metaLabel}>Topic:</SpecialText>
                                            <SpecialText style={styles.metaValue}>{currentNote.topic}</SpecialText>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <SpecialText style={styles.metaLabel}>Version:</SpecialText>
                                            <SpecialText style={styles.metaValue}>v{currentNote.version || 1}</SpecialText>
                                        </View>
                                    </View>
                                    <View style={styles.divider} />
                                    <SpecialText style={styles.noteContentText}>{currentNote.content}</SpecialText>
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.conversationSection}>
                            <SpecialText style={styles.sectionTitle}><Text>💬</Text> Conversation History</SpecialText>
                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    style={[
                                        styles.messageBubble,
                                        msg.type === 'user' ? styles.userBubble :
                                            msg.type === 'agent' ? styles.agentBubble :
                                                msg.type === 'error' ? styles.errorBubble :
                                                    styles.systemBubble
                                    ]}
                                >
                                    <SpecialText
                                        style={[
                                            styles.messageText,
                                            msg.type === 'user' ? styles.userText :
                                                msg.type === 'agent' ? styles.agentText :
                                                    msg.type === 'error' ? styles.errorText :
                                                        styles.systemText
                                        ]}
                                    >
                                        {msg.text}
                                    </SpecialText>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* {currentNoteId && currentNote && (
                        <View style={styles.buttonContainer}>
                            <PrimaryButton 
                                title="Study with Coach" 
                                onPress={() => {
                                    console.log('[COACH-BUTTON] Launching coach with:', {
                                        transcriptId: currentNoteId,
                                        sessionName: currentNote.title,
                                        contextType: 'note',
                                    });
                                    navigation.navigate('AgenticCoach', {
                                        transcriptId: currentNoteId,
                                        sessionName: currentNote.title,
                                        contextType: 'note',
                                        transcript: currentNote.content,
                                    });
                                }}
                            />
                        </View>
                    )} */}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.inputContainer}
                        keyboardVerticalOffset={80}
                    >
                        {/* Floating Action Menu */}
                        <FloatingActionMenu
                            actions={[
                                {
                                    icon: '🧠',
                                    label: 'Coach',
                                    onPress: () => {
                                        if (currentNoteId && currentNote) {
                                            navigation.navigate('AgenticCoach', {
                                                transcriptId: currentNoteId,
                                                sessionName: currentNote.title,
                                                contextType: 'note',
                                                transcript: currentNote.content,
                                            });
                                        }
                                    },
                                },
                            ]}
                        />

                        {/* SpecialText Input */}
                        <TextInput
                            style={styles.textInput}
                            placeholder={
                                currentNoteId
                                    ? "Edit or add to note..."
                                    : "Describe your note..."
                            }
                            placeholderTextColor="#999"
                            value={userInput}
                            onChangeText={setUserInput}
                            editable={!isLoading}
                            multiline
                            maxLength={500}
                        />

                        {/* Send Button or Mic Button */}
                        {userInput.trim() ? (
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                disabled={isLoading}
                                style={[
                                    styles.sendButton,
                                    isLoading && styles.sendButtonDisabled,
                                ]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <SpecialText style={styles.sendButtonText}>⬆</SpecialText>
                                )}
                            </TouchableOpacity>
                        ) : voiceEnabled ? (
                            <TouchableOpacity
                                style={[
                                    styles.micButton,
                                    stt.isListening && styles.micButtonListening,
                                ]}
                                onPress={() => {
                                    if (stt.isListening) {
                                        stt.stopListening();
                                    } else {
                                        stt.startListening();
                                    }
                                }}
                                disabled={isLoading || stt.isListening}
                                activeOpacity={stt.isListening ? 1 : 0.7}
                            >
                                <Text style={styles.micButtonIcon}>
                                    {stt.isListening ? '🔴' : '🎤'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        {/* Voice Transcript Bubble */}
                        {voiceEnabled && stt.transcript && !stt.error && (
                            <View style={styles.voiceTranscriptBubble}>
                                <Text style={styles.voiceTranscriptLabel}>Heard:</Text>
                                <SpecialText style={styles.voiceTranscriptText}>{stt.transcript}</SpecialText>
                            </View>
                        )}

                        {/* Voice Error Bubble */}
                        {voiceEnabled && stt.error && (
                            <View style={styles.voiceErrorBubble}>
                                <SpecialText style={styles.voiceErrorText}>{stt.error}</SpecialText>
                                <TouchableOpacity onPress={stt.clearTranscript} style={styles.voiceErrorDismiss}>
                                    <Text style={styles.voiceErrorDismissText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    refreshButtonText: {
        fontSize: 20,
        color: '#000000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
    },
    startButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 6,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    notesList: {
        padding: 12,
    },
    noteItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    noteItemContent: {
        flex: 1,
    },
    noteItemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    noteItemMeta: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    noteItemPreview: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        marginBottom: 8,
    },
    noteItemDate: {
        fontSize: 11,
        color: '#999',
    },
    noteArrow: {
        fontSize: 24,
        color: '#000000',
        marginLeft: 12,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    conversationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 12,
    },
    messagesContainer: {
        flex: 1,
        padding: 12,
    },
    noteContentSection: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        maxHeight: 300,
    },
    noteContentTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666',
        marginBottom: 8,
    },
    noteContentBox: {
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
        padding: 12,
        maxHeight: 250,
    },
    noteContentText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
        fontWeight: '400',
    },
    conversationSection: {
        marginBottom: 12,
    },
    messageBubble: {
        marginVertical: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#000000',
        marginRight: 8,
    },
    agentBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F4F8',
        marginLeft: 8,
    },
    systemBubble: {
        alignSelf: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
    },
    errorBubble: {
        alignSelf: 'center',
        backgroundColor: '#FFE8E8',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
        fontWeight: '500',
    },
    agentText: {
        color: '#333',
    },
    systemText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '500',
    },
    errorText: {
        color: '#d32f2f',
    },
    inputContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#000',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 40,
        minWidth: 40,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButtonIcon: {
        fontSize: 20,
    },
    headerButtonsGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    exportButton: {
        backgroundColor: '#000000',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    noteMetadata: {
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    metaLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    metaValue: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 12,
    },
    buttonContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    // Voice Modality Styles
    micButtonListening: {
        backgroundColor: '#ffcdd2',
        borderColor: '#ef5350',
        borderWidth: 2,
    },
    voiceTranscriptBubble: {
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2196f3',
    },
    voiceTranscriptLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 4,
    },
    voiceTranscriptText: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
    voiceErrorBubble: {
        backgroundColor: '#ffebee',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ef5350',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    voiceErrorText: {
        fontSize: 13,
        color: '#c62828',
        flex: 1,
    },
    voiceErrorDismiss: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    voiceErrorDismissText: {
        fontSize: 18,
        color: '#c62828',
    },
});
