import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Modal,
    FlatList,
} from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import { QuizMessageBubble, QuizResultsBubble } from '../components/QuizMessageBubble';
import { useConfig } from '../hooks/useConfig';
import FloatingActionMenu from '../components/FloatingActionMenu';
import { useFocusEffect } from '@react-navigation/native';

export default function AgenticCoachScreen({ route, navigation }) {
    console.log('[COACH-COMPONENT] ===== COMPONENT RENDERING =====');
    console.log('[COACH-COMPONENT] Timestamp:', new Date().toISOString());

    const { transcriptId, sessionName, transcript, contextType } = route.params || {};
    const { servicePreferences } = useConfig();
    console.log('[COACH-INIT] Route params received:', { transcriptId, sessionName, contextType });
    console.log('[COACH-INIT] sessionName value:', sessionName);
    console.log('[COACH-INIT] sessionName type:', typeof sessionName);
    // Ensure we have valid values
    const validTranscriptId = transcriptId || null;
    const validContextType = contextType || 'general';
    console.log('[COACH-INIT] Using contextType:', validContextType);
    console.log('[COACH-INIT] Using transcriptId:', validTranscriptId);
    console.log('[COACH-COMPONENT] ===== STATE INITIALIZATION STARTING =====');

    // State management
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [simplificationLevel, setSimplificationLevel] = useState(3);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [currentInteractionId, setCurrentInteractionId] = useState(null);
    const [currentContext, setCurrentContext] = useState(validContextType);

    // Context switching state
    const [showContextModal, setShowContextModal] = useState(false);
    const [contextSuggestions, setContextSuggestions] = useState([]);
    const [isDetectingHint, setIsDetectingHint] = useState(false);
    const [pendingContextSwitch, setPendingContextSwitch] = useState(null);
    const [currentContextName, setCurrentContextName] = useState(sessionName);
    const [currentContextId, setCurrentContextId] = useState(validTranscriptId);

    console.log('[COACH-COMPONENT] ===== STATE INITIALIZED =====');
    console.log('[COACH-COMPONENT] currentContext:', currentContext);
    console.log('[COACH-COMPONENT] currentContextId:', currentContextId);
    console.log('[COACH-COMPONENT] ===== SETTING UP EFFECTS =====');

    // API hook
    const { askCoach, getCoachHistory, askCoachFollowup, generateQuiz, submitQuizAnswers, detectContextHint, confirmContextSwitch } = useTranscriptAPI();

    // Scroll reference
    const scrollViewRef = useRef(null);
    const loadAbortController = useRef(null);

    // Load conversation history on mount and when context ID changes
    useFocusEffect(useCallback(() => {
        console.log('[EFFECT] loadCoachHistory effect triggered with:', { currentContextId, currentContext });
        if (currentContextId !== undefined && currentContext !== undefined) {
            console.log('[EFFECT] Calling loadCoachHistory...');
            loadCoachHistory();
        } else {
            console.log('[EFFECT] Skipping loadCoachHistory - missing required state values');
        }
    }, [loadCoachHistory, currentContextId, currentContext]));  // Include state deps to catch updates

    // Update state when route params change (e.g., navigating from one lecture to another)
    useFocusEffect(useCallback(() => {
        console.log('[ROUTE-EFFECT] Route params effect running:', { transcriptId, contextType, currentContextId, currentContext });
        if (transcriptId && transcriptId !== currentContextId) {
            console.log('[ROUTE-PARAMS-CHANGE] Detected route param change:', {
                oldTranscriptId: currentContextId,
                newTranscriptId: transcriptId,
                oldContextType: currentContext,
                newContextType: contextType
            });

            // Update state to match new route params
            setCurrentContext(contextType || 'general');
            setCurrentContextId(transcriptId);
            setCurrentContextName(sessionName);
            setMessages([]); // Clear messages for fresh load
            setCurrentInteractionId(null);

            // Load history immediately after state update to avoid race condition
            console.log('[ROUTE-EFFECT] Preparing to load history for new context:', { newContextId: transcriptId, newContextType: contextType });
            // Note: loadCoachHistory will use the updated state via useCallback dependency tracking
        } else {
            console.log('[ROUTE-EFFECT] No route param change detected, skipping update');
        }
    }, [transcriptId, contextType, currentContextId])); // Include currentContextId to detect changes

    // Auto-scroll to bottom when messages update
    useFocusEffect(useCallback(() => {
        if (scrollViewRef.current && messages.length > 0) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]));

    // Log currentContextName whenever it changes
    useFocusEffect(useCallback(() => {
        console.log('[HEADER-UPDATE] currentContextName changed to:', currentContextName);
    }, [currentContextName]));

    const loadCoachHistory = useCallback(async () => {
        try {
            // Cancel any previous request
            if (loadAbortController.current) {
                console.log('[loadCoachHistory] Cancelling previous request');
                loadAbortController.current.abort();
            }

            // Create new abort controller for this request
            loadAbortController.current = new AbortController();
            const currentAbortSignal = loadAbortController.current.signal;

            setIsLoadingHistory(true);
            console.log('[loadCoachHistory] Starting load...');
            console.log('[loadCoachHistory] currentContextId:', currentContextId);
            console.log('[loadCoachHistory] currentContext:', currentContext);
            console.log('[loadCoachHistory] typeof currentContextId:', typeof currentContextId);
            console.log('[loadCoachHistory] currentContextId === null:', currentContextId === null);
            console.log('[loadCoachHistory] currentContextId === undefined:', currentContextId === undefined);
            console.log('Loading coach conversation history for context:', { currentContextId, currentContext });

            const history = await getCoachHistory(currentContextId, currentContext, currentAbortSignal);

            // Check if this request was aborted before updating state
            if (currentAbortSignal.aborted) {
                console.log('[loadCoachHistory] Request was aborted, ignoring response');
                return;
            }

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
            // Ignore abort errors - they're expected when switching contexts
            if (err.name === 'AbortError') {
                console.log('[loadCoachHistory] Request aborted (expected on context switch)');
            } else {
                console.error('Error loading coach history:', err);
            }
            // Don't alert on initial load failure - start fresh
        } finally {
            setIsLoadingHistory(false);
        }
    }, [currentContextId, currentContext, getCoachHistory]);  // Memoize with dependencies

    /**
     * Check if message is a context-switching hint
     * Returns true if message matches patterns like:
     * - "change context to ...", "switch to ...", "go to ...",
     * - "study ...", "read ...", "about ...", etc.
     */
    const isContextHint = (message) => {
        const hintPatterns = [
            /^(change|switch|go)\s+(to|to the)?\s+/i,
            /^(study|read|learn|teach|explain)\s+(about|on|)?\s+/i,
            /^(what|tell|show).*(lecture|chapter|topic|book|note)\s+/i,
            /^(i want to|let's|let's study)/i,
        ];
        return hintPatterns.some(pattern => pattern.test(message.trim()));
    };

    /**
     * Detect context hints and show suggestions modal
     */
    const handleContextHint = async (userMessage) => {
        try {
            setIsDetectingHint(true);
            console.log('[CONTEXT-HINT] Checking message for context switch hints:', userMessage);

            const hintResponse = await detectContextHint(userMessage);
            console.log('[CONTEXT-HINT] Detection response:', JSON.stringify(hintResponse, null, 2));
            console.log('[CONTEXT-HINT] Has suggestions field:', !!hintResponse.suggestions);
            console.log('[CONTEXT-HINT] Suggestions length:', hintResponse.suggestions?.length);
            console.log('[CONTEXT-HINT] First suggestion:', hintResponse.suggestions?.[0]);

            if (hintResponse.success && hintResponse.suggestions && hintResponse.suggestions.length > 0) {
                // Show modal with suggestions
                console.log('[CONTEXT-HINT] Setting suggestions:', hintResponse.suggestions);
                setContextSuggestions(hintResponse.suggestions);
                setShowContextModal(true);

                // Add a system message about detected context switch
                setMessages(prev => [...prev, {
                    id: `hint-detected-${Date.now()}`,
                    type: 'system',
                    text: '🔍 Searching for matching resources...',
                    timestamp: new Date(),
                }]);

                return { isHint: true, suggestions: hintResponse.suggestions };
            } else {
                console.log('[CONTEXT-HINT] No matching resources found');
                // Not a valid context hint, treat as regular message
                return { isHint: false };
            }
        } catch (error) {
            console.error('[CONTEXT-HINT] Error detecting hint:', error);
            // If hint detection fails, treat as regular message
            return { isHint: false };
        } finally {
            setIsDetectingHint(false);
        }
    };

    /**
     * Handle user selection from context suggestions modal
     */
    const handleContextSelection = async (selectedContext) => {
        try {
            setShowContextModal(false);
            setPendingContextSwitch({ loading: true });

            console.log('[CONTEXT-SWITCH] Full selected context object:', selectedContext);
            console.log('[CONTEXT-SWITCH] Selected context keys:', Object.keys(selectedContext));
            console.log('[CONTEXT-SWITCH] Selected context stringified:', JSON.stringify(selectedContext, null, 2));

            // Try all possible field names
            const contextId = selectedContext.contextId !== undefined ? selectedContext.contextId : (selectedContext.id !== undefined ? selectedContext.id : selectedContext._id);
            const contextType = selectedContext.contextType || selectedContext.type;

            console.log('[CONTEXT-SWITCH] Extracted values:', { contextId, contextType });
            console.log('[CONTEXT-SWITCH] contextId from:',
                selectedContext.contextId !== undefined ? 'contextId' :
                    selectedContext.id !== undefined ? 'id' :
                        selectedContext._id !== undefined ? '_id' : 'NOT FOUND'
            );

            // contextType is required, but contextId can be null (for general coach)
            if (contextType === undefined || contextType === null) {
                console.error('[CONTEXT-SWITCH] Missing required contextType!', {
                    contextId,
                    contextType,
                    selectedContext,
                    availableFields: Object.keys(selectedContext)
                });
                throw new Error(`Missing contextType from selection. Found: ${Object.keys(selectedContext).join(', ')}`);
            }

            console.log('[CONTEXT-SWITCH] Confirming context switch:', { contextId, contextType });

            // Confirm the context switch
            const confirmResponse = await confirmContextSwitch(contextId, contextType);
            console.log('[CONTEXT-SWITCH] Confirmation response:', confirmResponse);

            if (confirmResponse.success) {
                // Update context and header name
                setCurrentContext(contextType);
                setCurrentContextName(selectedContext.name); // Update header with new resource name
                setCurrentContextId(contextId); // Update context ID for history loading
                setCurrentInteractionId(null); // Reset for new context

                // Clear messages and add context switch message (single update to avoid race condition)
                setMessages([
                    {
                        id: `context-switched-${Date.now()}`,
                        type: 'system',
                        text: `✅ Switched to ${selectedContext.name} - loading conversation history...`,
                        timestamp: new Date(),
                    }
                ]);

                // Reload conversation history for new context
                // Note: Use passed contextId instead of state since state updates are batched
                const history = await getCoachHistory(contextId, contextType);
                if (history && history.length > 0) {
                    const formattedMessages = history.flatMap(interaction => {
                        const msgs = [];
                        if (interaction.userQuestion) {
                            msgs.push({
                                id: `${interaction._id}-user`,
                                type: 'user',
                                text: interaction.userQuestion,
                                timestamp: interaction.createdAt,
                            });
                        }
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
                    setMessages(prev => [...prev.filter(m => m.type === 'system'), ...formattedMessages]);
                    if (history.length > 0) {
                        setCurrentInteractionId(history[history.length - 1]._id);
                    }
                } else {
                    // No history for this context, just keep the system message
                    console.log('[CONTEXT-SWITCH] No history found for context:', { contextId, contextType });
                }

                setPendingContextSwitch(null);
            } else {
                Alert.alert('Error', 'Failed to switch context. Please try again.');
                setPendingContextSwitch(null);
            }
        } catch (error) {
            console.error('[CONTEXT-SWITCH] Error switching context:', error);
            Alert.alert('Error', `Failed to switch context: ${error.message}`);
            setPendingContextSwitch(null);
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

            // FIRST: Check if this is a context-switching hint
            if (isContextHint(userMessage)) {
                console.log('[MESSAGE-FLOW] Context hint detected - checking for matching resources');
                const hintResult = await handleContextHint(userMessage);

                if (hintResult.isHint && hintResult.suggestions?.length > 0) {
                    // Modal shown, waiting for user selection - don't ask coach
                    return;
                }
                // If no hints found, continue as regular message
            }

            // SECOND: Check if user is asking for a quiz
            const quizKeywords = ['quiz', 'test', 'exam', 'questions', 'practice questions', 'assessment'];
            const isQuizRequest = quizKeywords.some(keyword =>
                userMessage.toLowerCase().includes(keyword)
            );

            if (isQuizRequest) {
                // Extract topic from message (everything after quiz request keyword)
                let topic = userMessage;
                quizKeywords.forEach(keyword => {
                    const regex = new RegExp(keyword, 'i');
                    topic = userMessage.replace(regex, '').trim();
                });
                topic = topic || userMessage; // Fallback to full message if extraction fails

                console.log('[QUIZ] Quiz request detected, topic:', topic);

                // Generate quiz
                const quizResult = await generateQuiz(
                    topic,
                    simplificationLevel,
                    currentContext,
                    currentContextId
                );

                // Add quiz message bubble
                setMessages(prev => [...prev, {
                    id: quizResult.quizSessionId,
                    type: 'quiz',
                    quiz: quizResult.quiz,
                    quizSessionId: quizResult.quizSessionId,
                    timestamp: new Date(),
                }]);
            } else {
                // Regular coach question
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
                        currentContext, // contextType (valid: lecture, note, book, general)
                        currentContextId // contextId
                    );
                }

                // Add coach response
                console.log('Coach response object:', JSON.stringify(response, null, 2));

                // Check if context changed in the response
                if (response?.context && response.context !== currentContext) {
                    console.log('[CONTEXT-SWITCH] Detected context change:', {
                        from: currentContext,
                        to: response.context,
                    });

                    // Update current context
                    setCurrentContext(response.context);

                    // Show context switch notification
                    const contextName = response.context?.charAt(0)?.toUpperCase() + response.context?.slice(1) || response.context;
                    setMessages(prev => [...prev, {
                        id: `context-switch-${Date.now()}`,
                        type: 'system',
                        text: `🔄 Switched to ${contextName} Coach`,
                        timestamp: new Date(),
                    }]);
                }

                // Only add response if backend saved it (not a context-switch)
                const interactionId = response?.interactionId || response?._id;
                if (response && interactionId && response.coachResponse) {
                    setMessages(prev => [...prev, {
                        id: interactionId,
                        type: 'coach',
                        text: response.coachResponse,
                        timestamp: response.createdAt || new Date(),
                    }]);

                    // Update current interaction ID for follow-ups
                    setCurrentInteractionId(interactionId);
                } else if (response && response.isContextSwitch) {
                    // Context-switch detected in context coach - treat as error
                    // Context switching only supported in general coach
                    console.log('Context-switch detected in context coach - not supported here');
                    throw new Error('Context switching is only available in General Coach');
                } else {
                    console.log('Response validation failed. Response:', response);
                    throw new Error('Invalid response from coach API');
                }
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

    const handleSubmitQuizAnswers = async (quizData) => {
        try {
            setIsLoading(true);
            const { quizSessionId, answers } = quizData;

            console.log('[QUIZ-SUBMIT] Submitting quiz answers for session:', quizSessionId);

            const result = await submitQuizAnswers(quizSessionId, answers);

            // Add results message bubble
            // Find the quiz message to get the quiz data
            const quizMessage = messages.find(m => m.quizSessionId === quizSessionId);
            if (quizMessage) {
                setMessages(prev => [...prev, {
                    id: result.evaluationId,
                    type: 'quiz-results',
                    quiz: quizMessage.quiz,
                    evaluation: result,
                    timestamp: new Date(),
                }]);
            }

            console.log('[QUIZ-SUBMIT] Quiz evaluation complete, marks:', result.marksObtained);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            Alert.alert('Error', 'Failed to submit quiz. Please try again.');
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
        const isQuizMessage = message.type === 'quiz';
        const isQuizResultsMessage = message.type === 'quiz-results';

        // Handle quiz message bubble
        if (isQuizMessage && message.quiz) {
            return (
                <View key={message.id} style={styles.messageWrapper}>
                    <QuizMessageBubble
                        quiz={message.quiz}
                        quizSessionId={message.quizSessionId}
                        onSubmitAnswers={handleSubmitQuizAnswers}
                        isSubmitting={isLoading}
                    />
                </View>
            );
        }

        // Handle quiz results message bubble
        if (isQuizResultsMessage && message.evaluation) {
            return (
                <View key={message.id} style={styles.messageWrapper}>
                    <QuizResultsBubble
                        quiz={message.quiz}
                        evaluation={message.evaluation}
                    />
                </View>
            );
        }

        // Handle regular messages
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
                <View style={styles.headerCenterContent}>
                    <Text style={styles.headerTitle}>Your Coach</Text>
                    <Text style={styles.headerSubtitle}>{currentContextName}</Text>
                </View>
                <TouchableOpacity
                    onPress={clearConversation}
                    style={styles.headerClearButton}
                >
                    <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>

            {/* Messages */}
            {messages.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>Start Learning!</Text>
                    <Text style={styles.emptyStateText}>
                        Ask the coach any questions about the lecture. The coach will provide context-aware responses. You can also switch between contexts.
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
                {/* Floating Action Menu */}
                <FloatingActionMenu
                    key={`fab-${servicePreferences.recordingsLecture}-${servicePreferences.captureBooks}-${servicePreferences.voiceModality}`}
                    actions={[
                        servicePreferences.recordingsLecture && {
                            icon: '🎙️',
                            label: 'Lecture',
                            onPress: () => navigation.navigate('LectureCapture'),
                        },
                        {
                            icon: '📝',
                            label: 'Notes',
                            onPress: () => navigation.navigate('Notes'),
                        },
                        servicePreferences.captureBooks && {
                            icon: '📷',
                            label: 'Capture',
                            onPress: () => navigation.navigate('CapturedBooksLibrary'),
                        },
                        {
                            icon: '📚',
                            label: 'Sugamya',
                            onPress: () => navigation.navigate('Sugamya'),
                        },
                    ].filter(Boolean)}
                />

                {/* Text Input */}
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

                {/* Send Button or Mic Button */}
                {userInput.trim() ? (
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={isLoading}
                        style={[
                            styles.sendButton,
                            isLoading && styles.sendButtonDisabled,
                        ]}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.sendButtonText}>⬆</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.micButton}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.micButtonIcon}>🎤</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Context Suggestions Modal */}
            <Modal
                visible={showContextModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowContextModal(false);
                    // Remove the searching message when modal is closed
                    setMessages(prev => prev.filter(m => !m.id?.startsWith('hint-detected')));
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Switch Context</Text>
                        <Text style={styles.modalSubtitle}>Select which context you'd like to study:</Text>

                        <FlatList
                            data={contextSuggestions}
                            keyExtractor={(item) => `${item.contextType}-${item.contextId}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contextOption}
                                    onPress={() => handleContextSelection(item)}
                                    disabled={isDetectingHint || pendingContextSwitch?.loading}
                                >
                                    <View style={styles.contextOptionContent}>
                                        <Text style={styles.contextOptionIcon}>{item.icon || '📚'}</Text>
                                        <View style={styles.contextOptionText}>
                                            <Text style={styles.contextOptionName}>{item.name}</Text>
                                            <Text style={styles.contextOptionDescription}>
                                                {item.description || `Study with ${item.contextType} coach`}
                                            </Text>
                                        </View>
                                    </View>
                                    {item.isCurrentContext && (
                                        <Text style={styles.currentBadge}>Current</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            scrollEnabled
                        />

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => {
                                setShowContextModal(false);
                                // Remove the searching message when modal is closed
                                setMessages(prev => prev.filter(m => !m.id?.startsWith('hint-detected')));
                            }}
                        >
                            <Text style={styles.modalCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    headerCenterContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
    headerClearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
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
    // Context Suggestions Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    contextOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    contextOptionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    contextOptionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    contextOptionText: {
        flex: 1,
    },
    contextOptionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    contextOptionDescription: {
        fontSize: 12,
        color: '#999',
    },
    currentBadge: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4CAF50',
        backgroundColor: '#f1f8f4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    modalCancelButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalCancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
});
