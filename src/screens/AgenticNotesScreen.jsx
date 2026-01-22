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
import PrimaryButton from '../components/PrimaryButton';

export default function AgenticNotesScreen({ route, navigation }) {
    const { transcriptId, sessionName, transcript } = route.params || {};

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
            console.log('Loading user agentic notes...');

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
                console.log('Creating new agentic note...');
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
                    <Text style={styles.header}>Agentic Notes</Text>
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
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading notes...</Text>
                    </View>
                ) : notes.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No notes yet</Text>
                        <Text style={styles.emptySubtext}>Start a conversation to create a note</Text>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => setShowNotesList(false)}
                        >
                            <Text style={styles.startButtonText}>Start New Note</Text>
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
                                    <Text style={styles.noteItemTitle}>{item.title}</Text>
                                    <Text style={styles.noteItemMeta}>
                                        {item.standard} • {item.topic}
                                    </Text>
                                    <Text style={styles.noteItemPreview} numberOfLines={2}>
                                        {item.content}
                                    </Text>
                                    <Text style={styles.noteItemDate}>
                                        v{item.version || 1} • {new Date(item.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={styles.noteArrow}>›</Text>
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
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.conversationTitle}>
                    {currentNote ? currentNote.title : 'New Note'}
                </Text>
                <View style={styles.headerButtonsGroup}>
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={exportNoteAsText}
                        disabled={isLoading}
                    >
                        <Text style={styles.exportButtonText}>Export</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {isLoadingHistory ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading conversation...</Text>
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
                                <Text style={styles.sectionTitle}>📖 Note Content</Text>
                                <ScrollView style={styles.noteContentBox} nestedScrollEnabled={true}>
                                    <View style={styles.noteMetadata}>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Standard:</Text>
                                            <Text style={styles.metaValue}>{currentNote.standard}</Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Chapter:</Text>
                                            <Text style={styles.metaValue}>{currentNote.chapter}</Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Topic:</Text>
                                            <Text style={styles.metaValue}>{currentNote.topic}</Text>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Version:</Text>
                                            <Text style={styles.metaValue}>v{currentNote.version || 1}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.divider} />
                                    <Text style={styles.noteContentText}>{currentNote.content}</Text>
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.conversationSection}>
                            <Text style={styles.sectionTitle}>💬 Conversation History</Text>
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
                                    <Text
                                        style={[
                                            styles.messageText,
                                            msg.type === 'user' ? styles.userText :
                                                msg.type === 'agent' ? styles.agentText :
                                                    msg.type === 'error' ? styles.errorText :
                                                        styles.systemText
                                        ]}
                                    >
                                        {msg.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {currentNoteId && currentNote && (
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
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.inputContainer}
                    >
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder={
                                    currentNoteId
                                        ? "Edit or add to note... (e.g., 'Add a section on...', 'Change the title to...')"
                                        : "Describe your note... (e.g., 'Create notes on photosynthesis')"
                                }
                                value={userInput}
                                onChangeText={setUserInput}
                                editable={!isLoading}
                                multiline={true}
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                                onPress={handleSendMessage}
                                disabled={isLoading || !userInput.trim()}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.sendButtonText}>Send</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        color: '#007AFF',
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
        backgroundColor: '#007AFF',
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
        color: '#007AFF',
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
        color: '#007AFF',
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
        backgroundColor: '#007AFF',
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
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    headerButtonsGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    exportButton: {
        backgroundColor: '#34C759',
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
});
