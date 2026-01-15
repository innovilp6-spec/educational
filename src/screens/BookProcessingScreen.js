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

const API_BASE = 'http://10.2.2.1:5000/api';

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

            // Prepare form data for multipart request
            const formData = new FormData();

            // Add images
            images.forEach((img, index) => {
                // If img is {data: base64String, uri}, use the uri, else construct from data
                let imageUri = img.uri || img.data;
                formData.append('images', {
                    uri: img.uri || `data:image/jpeg;base64,${img.data}`,
                    type: 'image/jpeg',
                    name: `page_${index + 1}.jpg`,
                });
                // Simulate progress
                setTimeout(() => {
                    setProcessedPages(Math.min(index + 1, totalPages));
                }, (index + 1) * 500);
            });

            // Add metadata
            formData.append('title', title || 'Captured Book');
            formData.append('category', category || 'Uncategorized');
            if (tags && tags.length > 0) {
                formData.append('tags', JSON.stringify(tags));
            }

            console.log('[BookProcessing] Uploading', images.length, 'images to:', `${API_BASE}/books/captured/scan`);

            const response = await fetch(`${API_BASE}/books/captured/scan`, {
                method: 'POST',
                body: formData,
                headers: {
                    'x-user-email': 'testuser@example.com',
                    'Accept': 'application/json',
                },
            });

            console.log('[BookProcessing] Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('[BookProcessing] Success response:', data);
                if (data.success) {
                    const newBookId = data.data.bookId;
                    console.log('[BookProcessing] Book created with ID:', newBookId);
                    setProcessedPages(totalPages);

                    // Wait 2 seconds then navigate to detail screen
                    setTimeout(() => {
                        navigation.replace('BookDetail', { bookId: newBookId });
                    }, 2000);
                } else {
                    console.error('[BookProcessing] API returned success:false');
                    setErrorMessage(data.message || 'Error processing images');
                    setProcessing(false);
                }
            } else {
                const data = await response.json();
                console.error('[BookProcessing] Error response:', response.status, data);
                setErrorMessage(data.message || 'Error processing images. Please try again.');
                setProcessing(false);
            }
        } catch (error) {
            console.error('[BookProcessing] Fetch error:', error);
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
                                    📂 Category: {category || 'Uncategorized'}
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
