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
} from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function AgenticCoachScreen({ route, navigation }) {
    const { transcriptId, sessionName, transcript, contextType } = route.params || {};
    
    // Ensure we have valid values
    const validTranscriptId = transcriptId || null;
    const validContextType = contextType || 'general';

    // State management
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [simplificationLevel, setSimplificationLevel] = useState(3);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentInteractionId, setCurrentInteractionId] = useState(null);

    // API hook
    const { askCoach, getCoachHistory, askCoachFollowup } = useTranscriptAPI();

    // Scroll reference
    const scrollViewRef = useRef(null);

    // Load conversation history on mount
    useEffect(() => {
        loadCoachHistory();
    }, []);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (scrollViewRef.current && messages.length > 0) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const loadCoachHistory = async () => {
        try {
            setIsLoadingHistory(true);
            console.log('Loading coach conversation history for context:', { validTranscriptId, validContextType });

            const history = await getCoachHistory(validTranscriptId, validContextType);

            // Convert history to message format
            if (history && history.length > 0) {
                const formattedMessages = history.flatMap(interaction => {
                    const msgs = [];

                    // Add user question
                    if (interaction.userQuestion) {
                        msgs.push({
                            id: `${interaction._id}-user`,
                            type: 'user',
                            text: interaction.userQuestion,
                            timestamp: interaction.createdAt,
                        });
                    }

                    // Add coach response
                    if (interaction.coachResponse) {
                        msgs.push({
                            id: `${interaction._id}-coach`,
                            type: 'coach',
                            text: interaction.coachResponse,
                            timestamp: interaction.createdAt,
                        });
                    }

                    return msgs;
                });

                setMessages(formattedMessages);

                // Set current interaction ID if available
                if (history.length > 0) {
                    setCurrentInteractionId(history[history.length - 1]._id);
                }
            }
        } catch (err) {
            console.error('Error loading coach history:', err);
            // Don't alert on initial load failure - start fresh
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const sendMessage = async () => {
        if (!userInput.trim()) {
            return;
        }

        const userMessage = userInput.trim();
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

            // Decide whether to ask a new question or follow-up
            if (currentInteractionId) {
                // Ask follow-up to existing conversation
                console.log('Asking coach follow-up question...');
                response = await askCoachFollowup(currentInteractionId, userMessage);
            } else {
                // Ask new question with context
                console.log('Asking coach new question with context...');
                response = await askCoach(
                    userMessage,
                    simplificationLevel,
                    validContextType, // contextType (valid: lecture, note, book, general)
                    validTranscriptId // contextId
                );
            }

            // Add coach response
            console.log('Coach response object:', JSON.stringify(response, null, 2));

            // Only add response if backend saved it (not a context-switch)
            if (response && response.interactionId) {
                if (response.coachResponse) {
                    setMessages(prev => [...prev, {
                        id: response.interactionId,
                        type: 'coach',
                        text: response.coachResponse,
                        timestamp: response.createdAt || new Date(),
                    }]);

                    // Update current interaction ID for follow-ups
                    setCurrentInteractionId(response.interactionId);
                } else {
                    console.log('No coach response - unexpected in context-aware coach');
                }
            } else if (response && response.isContextSwitch) {
                // Context-switch detected in context coach - treat as error
                // Context switching only supported in general coach
                console.log('Context-switch detected in context coach - not supported here');
                throw new Error('Context switching is only available in General Coach');
            } else {
                console.log('Response validation failed. Response:', response);
                throw new Error('Invalid response from coach API');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Add error message to chat
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                type: 'error',
                text: `Error: ${error.message || 'Failed to get response from coach. Please try again.'}`,
            }]);

            Alert.alert('Error', 'Failed to get response from coach. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const clearConversation = () => {
        Alert.alert(
            'Clear Conversation',
            'Are you sure you want to clear this conversation?',
            [
                { text: 'Cancel', onPress: () => { } },
                {
                    text: 'Clear',
                    onPress: () => {
                        setMessages([]);
                        setCurrentInteractionId(null);
                        setUserInput('');
                    },
                },
            ]
        );
    };

    const renderMessage = (message) => {
        const isUserMessage = message.type === 'user';
        const isErrorMessage = message.type === 'error';

        return (
            <View
                key={message.id}
                style={[
                    styles.messageWrapper,
                    isUserMessage && styles.userMessageWrapper,
                    isErrorMessage && styles.errorMessageWrapper,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isUserMessage && styles.userMessageBubble,
                        isErrorMessage && styles.errorMessageBubble,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isUserMessage && styles.userMessageText,
                            isErrorMessage && styles.errorMessageText,
                        ]}
                    >
                        {message.text}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoadingHistory) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading coach conversation...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={80}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Agentic Coach</Text>
                    <Text style={styles.headerSubtitle}>{sessionName}</Text>
                </View>
                <TouchableOpacity
                    onPress={clearConversation}
                    style={styles.clearButton}
                >
                    <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>

            {/* Messages */}
            {messages.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>Start Learning!</Text>
                    <Text style={styles.emptyStateText}>
                        Ask the coach any questions about the lecture. The coach will provide context-aware responses.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                >
                    {messages.map(renderMessage)}
                </ScrollView>
            )}

            {/* Simplification Level Control */}
            <View style={styles.controlsContainer}>
                <Text style={styles.controlLabel}>Simplification Level</Text>
                <View style={styles.levelSelector}>
                    {[1, 2, 3, 4, 5].map(level => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setSimplificationLevel(level)}
                            style={[
                                styles.levelButton,
                                simplificationLevel === level && styles.levelButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.levelButtonText,
                                    simplificationLevel === level && styles.levelButtonTextActive,
                                ]}
                            >
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Ask a question..."
                    placeholderTextColor="#999"
                    value={userInput}
                    onChangeText={setUserInput}
                    editable={!isLoading}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    disabled={isLoading || !userInput.trim()}
                    style={[
                        styles.sendButton,
                        (isLoading || !userInput.trim()) && styles.sendButtonDisabled,
                    ]}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    messageWrapper: {
        marginVertical: 6,
    },
    userMessageWrapper: {
        alignItems: 'flex-end',
    },
    errorMessageWrapper: {
        alignItems: 'center',
    },
    messageBubble: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    userMessageBubble: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    errorMessageBubble: {
        backgroundColor: '#ffebee',
        borderColor: '#ef5350',
        maxWidth: '90%',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
    },
    userMessageText: {
        color: '#fff',
    },
    errorMessageText: {
        color: '#c62828',
        fontWeight: '500',
    },
    controlsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    controlLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    levelSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    levelButton: {
        flex: 1,
        height: 36,
        marginHorizontal: 4,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    levelButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    levelButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    levelButtonTextActive: {
        color: '#fff',
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 40,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
