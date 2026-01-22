import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';

const API_BASE = 'http://10.0.2.2:5000/api';

const BookProcessingScreen = ({ route, navigation }) => {
    const { images, title, category, tags } = route.params;

    const [processing, setProcessing] = useState(true);
    const [processedPages, setProcessedPages] = useState(0);
    const [totalPages, setTotalPages] = useState(images.length);
    const [errorMessage, setErrorMessage] = useState('');
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

    useEffect(() => {
        uploadAndProcessImages();
    }, []);

    // Update estimated time remaining
    useEffect(() => {
        const timePerPage = 3; // seconds per page
        const remaining = (totalPages - processedPages) * timePerPage;
        setEstimatedTimeRemaining(Math.max(0, remaining));
    }, [processedPages, totalPages]);

    const uploadAndProcessImages = async () => {
        try {
            setProcessing(true);
            setErrorMessage('');

            console.log('[BookProcessing] Starting upload and processing...');
            console.log('[BookProcessing] Total images:', images.length);
            console.log('[BookProcessing] Metadata:', { title, category, tags });

            // Prepare JSON request body with base64 image data
            console.log('[BookProcessing] Preparing request body...');
            const imageDataArray = images.map((img, index) => {
                // Use base64 data (not URI) - BookCameraScreen already converts to base64
                const imageData = img.data || img.uri;
                console.log(`[BookProcessing] Image ${index + 1}:`, {
                    hasUri: !!img.uri,
                    hasData: !!img.data,
                    dataType: typeof imageData,
                    dataLength: imageData?.length || 0,
                    isBase64: imageData?.length > 1000, // Real images are much larger
                });
                return {
                    data: imageData,
                    fileName: `page_${index + 1}.jpg`,
                };
            });

            // Simulate progress
            images.forEach((img, index) => {
                setTimeout(() => {
                    setProcessedPages(Math.min(index + 1, totalPages));
                }, (index + 1) * 500);
            });

            // Build JSON request
            const requestBody = {
                images: imageDataArray,
                title: title || 'Captured Book',
                category: category || 'other',
                language: 'English',
                tags: tags && tags.length > 0 ? tags : [],
            };

            console.log('[BookProcessing] Request body prepared:', {
                imageCount: requestBody.images.length,
                title: requestBody.title,
                category: requestBody.category,
                tags: requestBody.tags.length,
            });

            const endpoint = `${API_BASE}/books/captured/scan`;
            console.log('[BookProcessing] Uploading to:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'x-user-email': 'testuser@example.com',
                    'Content-Type': 'application/json',
                },
            });

            console.log('[BookProcessing] Response received');
            console.log('[BookProcessing] Response status:', response.status);
            console.log('[BookProcessing] Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('[BookProcessing] Success response:', data);
                if (data.success) {
                    const newBookId = data.data.bookId;
                    console.log('[BookProcessing] Book created with ID:', newBookId);
                    setProcessedPages(totalPages);

                    // Wait 2 seconds then navigate to detail screen with full book data
                    setTimeout(() => {
                        console.log('[BookProcessing] Navigating to BookDetail with ID:', newBookId);
                        console.log('[BookProcessing] Passing book data:', {
                            bookId: newBookId,
                            title: data.data.title,
                            totalPages: data.data.totalPages,
                            textArray3DPages: data.data.textArray3D.length,
                        });
                        navigation.replace('BookDetail', { 
                            bookId: newBookId,
                            bookData: data.data // Pass all the data we got from upload response
                        });
                    }, 2000);
                } else {
                    console.error('[BookProcessing] API returned success:false');
                    setErrorMessage(data.message || 'Error processing images');
                    setProcessing(false);
                }
            } else {
                const responseText = await response.text();
                console.error('[BookProcessing] Error response status:', response.status);
                console.error('[BookProcessing] Error response text:', responseText);

                try {
                    const data = JSON.parse(responseText);
                    setErrorMessage(data.message || 'Error processing images. Please try again.');
                } catch (e) {
                    setErrorMessage(`Error processing images. Status: ${response.status}`);
                }
                setProcessing(false);
            }
        } catch (error) {
            console.error('[BookProcessing] Fetch error:', error);
            console.error('[BookProcessing] Error message:', error.message);
            console.error('[BookProcessing] Error stack:', error.stack);
            setErrorMessage('Network error. Please check your connection.');
            setProcessing(false);
        }
    };

    const retryProcessing = () => {
        setProcessedPages(0);
        setErrorMessage('');
        uploadAndProcessImages();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Processing Book</Text>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {errorMessage ? (
                    <>
                        {/* Error State */}
                        <View style={styles.centerContent}>
                            <FontAwesome name="exclamation-triangle" size={80} color="#FF6B6B" />
                            <Text style={styles.errorTitle}>Processing Failed</Text>
                            <Text style={styles.errorMessage}>{errorMessage}</Text>

                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={retryProcessing}
                            >
                                <FontAwesome name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Processing State */}
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#4CAF50" />

                            <Text style={styles.processingTitle}>Processing Images</Text>

                            {/* Progress Counter */}
                            <View style={styles.progressCounter}>
                                <Text style={styles.progressText}>
                                    {processedPages} of {totalPages} pages
                                </Text>
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(processedPages / totalPages) * 100}%` },
                                    ]}
                                />
                            </View>

                            {/* Estimated Time */}
                            <Text style={styles.estimatedTime}>
                                Estimated time: {estimatedTimeRemaining}s remaining
                            </Text>

                            {/* Details */}
                            <View style={styles.detailsBox}>
                                <Text style={styles.detailText}>
                                    📷 Title: {title || 'Captured Book'}
                                </Text>
                                <Text style={styles.detailText}>
                                    📂 Category: {category || 'other'}
                                </Text>
                                <Text style={styles.detailText}>
                                    📄 Total Pages: {totalPages}
                                </Text>
                            </View>

                            {/* Processing Note */}
                            <Text style={styles.processingNote}>
                                Using Azure Vision API for text recognition. Please wait...
                            </Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f5f5f5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginTop: 20,
        marginBottom: 30,
    },
    progressCounter: {
        marginBottom: 15,
    },
    progressText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
        marginBottom: 15,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#333',
        borderRadius: 4,
    },
    estimatedTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
    },
    detailsBox: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        width: '100%',
        marginBottom: 20,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
    },
    processingNote: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#d32f2f',
        marginTop: 20,
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    retryButton: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    cancelButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookProcessingScreen;
