import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';
import useBookReader from '../hooks/useBookReader';

const API_BASE = 'http://10.2.2.1:5000/api';

const BookDetailScreen = ({ route, navigation }) => {
    const { bookId } = route.params;
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [textArray3D, setTextArray3D] = useState([]); // 3D array [page][paragraph][sentence]

    // Use the custom hook for book reading functionality
    const {
        currentPage,
        currentParagraph,
        currentSentence,
        isSpeaking,
        isPaused,
        readingMode,
        moveToNextSentence,
        moveToNextParagraph,
        moveToNextPage,
        moveToPrevSentence,
        moveToPrevParagraph,
        moveToPrevPage,
        startReading,
        pauseReading,
        resumeReading,
        stopReading,
        changeReadingMode,
        getCurrentParagraphText,
        getTotalPages,
        getTotalParagraphs,
    } = useBookReader(textArray3D);

    const totalPages = getTotalPages();
    const totalParagraphs = getTotalParagraphs();
    const currentParagraphText = getCurrentParagraphText();

    useFocusEffect(
        useCallback(() => {
            // Check if mock data was passed directly (debug mode)
            if (route.params?.mockData) {
                console.log('[BookDetail] Initializing with mock data');
                const bookData = route.params.mockData;
                setBook(bookData);
                setTextArray3D(bookData.textArray3D);
                console.log('[BookDetail] Mock data loaded, pages:', bookData.textArray3D.length);
                setLoading(false);
            } else {
                // Fetch from API normally
                fetchBookDetail();
            }

            return () => {
                // Cleanup handled by hook
            };
        }, [route.params?.mockData])
    );

    const fetchBookDetail = async () => {
        try {
            setLoading(true);
            console.log('[BookDetail] Fetching book:', bookId);
            console.log('[BookDetail] API endpoint:', `${API_BASE}/books/captured/${bookId}`);

            const response = await fetch(`${API_BASE}/books/captured/${bookId}`, {
                headers: {
                    'x-user-email': 'testuser@example.com',
                    'Content-Type': 'application/json',
                },
            });

            console.log('[BookDetail] Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('[BookDetail] Book data received:', data);
                if (data.success) {
                    const bookData = data.data;
                    setBook(bookData);
                    setTextArray3D(bookData.textArray3D);
                    console.log('[BookDetail] Data loaded, pages:', bookData.textArray3D.length);
                } else {
                    console.error('[BookDetail] API returned success:false');
                    Alert.alert('Error', 'Failed to load book');
                }
            } else {
                const errorData = await response.text();
                console.error('[BookDetail] Error response:', response.status, errorData);
                Alert.alert('Error', `Failed to load book: ${response.status}`);
            }
        } catch (error) {
            console.error('[BookDetail] Fetch error:', error.message);
            Alert.alert('Error', 'Network error loading book');
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        if (readingMode === 'page') {
            moveToPrevPage();
        }
        else if (readingMode === 'paragraph') {
            moveToPrevParagraph();
        }
        else {
            moveToPrevSentence();
        }
    }

    const handleNext = () => {
        if (readingMode === 'page') {
            moveToNextPage();
        }
        else if (readingMode === 'paragraph') {
            moveToNextParagraph();
        }
        else {
            moveToNextSentence();
        }
    }

    const isPrevDisabled = () => {
        if (readingMode === 'page') {
            return currentPage === 0;
        }
        else if (readingMode === 'paragraph') {
            return currentParagraph === 0 && currentPage === 0;
        }
        else {
            return currentSentence === 0 && currentParagraph === 0 && currentPage === 0;
        }
    }

    const isNextDisabled = () => {
        const totalSentences = textArray3D[currentPage][currentParagraph].length;
        if (readingMode === 'page') {
            return currentPage === totalPages - 1;
        }
        else if (readingMode === 'paragraph') {
            return currentParagraph === totalParagraphs - 1 && currentPage === totalPages - 1;
        }
        else {
            return currentSentence === totalSentences - 1 && currentParagraph === totalParagraphs - 1 && currentPage === totalPages - 1;
        }
    }


    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Loading book...</Text>
                </View>
            </View>
        );
    }

    if (!book || textArray3D.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <FontAwesome name="exclamation-circle" size={60} color="#999" />
                    <Text style={styles.errorText}>No content to display</Text>
                </View>
            </View>
        );
    }



    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <FontAwesome name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {book.title}
                </Text>
                <TouchableOpacity onPress={() => Alert.alert('Info', 'Book: ' + book.title)}>
                    <FontAwesome name="info-circle" size={20} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Page Navigation */}
            <View style={styles.pageNav}>
                <Text style={styles.pageNavText}>
                    Page {currentPage + 1} / {totalPages} | Para {currentParagraph + 1} / {totalParagraphs}
                </Text>
                <View style={styles.pageIndicator}>
                    <View
                        style={[
                            styles.pageIndicatorFill,
                            { width: `${((currentPage + 1) / totalPages) * 100}%` },
                        ]}
                    />
                </View>
            </View>

            {/* Content Area */}
            <ScrollView
                style={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.contentBox}>
                    <Text style={styles.contentText}>
                        {currentParagraphText}
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Controls */}
            <View style={styles.controlsArea}>
                {/* Previous Paragraph Button */}
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        isPrevDisabled() && styles.disabledButton,
                    ]}
                    onPress={handlePrev}
                    disabled={isPrevDisabled()}
                >
                    <FontAwesome
                        name="chevron-left"
                        size={24}
                        color={isPrevDisabled() ? '#ccc' : '#000'}
                    />
                </TouchableOpacity>

                {/* Reading Mode Button */}
                <TouchableOpacity
                    style={styles.modeButton}
                    onPress={() => {
                        const modes = ['sentence', 'paragraph', 'page'];
                        const currentIndex = modes.indexOf(readingMode);
                        const nextMode = modes[(currentIndex + 1) % modes.length];
                        changeReadingMode(nextMode);
                    }}
                >
                    <Text style={styles.modeButtonText}>
                        {readingMode === 'sentence' ? 'Sentence' : readingMode === 'paragraph' ? 'Paragraph' : 'Page'}
                    </Text>
                </TouchableOpacity>

                {/* Play/Pause Button */}
                <TouchableOpacity
                    style={[styles.playButton, isSpeaking && styles.playButtonActive]}
                    onPress={() => {
                        if (isSpeaking) {
                            if (isPaused) {
                                resumeReading();
                            } else {
                                pauseReading();
                            }
                        } else {
                            startReading();
                        }
                    }}
                >
                    <FontAwesome
                        name={isSpeaking ? (isPaused ? 'play' : 'pause') : 'play'}
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>

                {/* Next Paragraph Button */}
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        isNextDisabled() && styles.disabledButton,
                    ]}
                    onPress={handleNext}
                    disabled={isNextDisabled()}
                >
                    <FontAwesome
                        name="chevron-right"
                        size={24}
                        color={isNextDisabled() ? '#ccc' : '#000'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: '#666',
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    headerTitle: {
        flex: 1,
        marginHorizontal: 15,
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    pageNav: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f5f5f5',
    },
    pageNavText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    pageIndicator: {
        height: 4,
        backgroundColor: '#eee',
        borderRadius: 2,
        overflow: 'hidden',
    },
    pageIndicatorFill: {
        height: '100%',
        backgroundColor: '#333',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    contentBox: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    contentText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#333',
        textAlign: 'justify',
    },
    sentence: {
        color: '#333',
    },
    sentenceActive: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    controlsArea: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    navButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeButtonText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '600',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonActive: {
        backgroundColor: '#333',
    },
    disabledButton: {
        borderColor: '#ddd',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    settingsModal: {
        backgroundColor: '#f9f9f9',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 20,
        paddingBottom: 40,
    },
    settingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
        color: '#000',
        marginLeft: 15,
    },
    metadataModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: 'auto',
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    metadataContent: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginTop: 15,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: '#000',
        fontSize: 14,
    },
    notesInput: {
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    infoText: {
        fontSize: 12,
        color: '#999',
        marginTop: 15,
    },
    updateButton: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#333',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookDetailScreen;
