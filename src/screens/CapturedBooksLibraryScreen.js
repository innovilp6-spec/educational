import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@react-native-vector-icons/fontawesome';

const API_BASE = 'http://10.0.2.2:5000/api';

const CapturedBooksLibraryScreen = ({ navigation }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchBooks();
        }, [])
    );

    const fetchBooks = async () => {
        try {
            setLoading(true);
            console.log('[CapturedBooksLibrary] Fetching books from:', `${API_BASE}/books/captured`);

            const response = await fetch(`${API_BASE}/books/captured`, {
                headers: {
                    'x-user-email': 'testuser@example.com',
                    'Content-Type': 'application/json',
                },
            });

            console.log('[CapturedBooksLibrary] Response status:', response.status);
            console.log('[CapturedBooksLibrary] Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('[CapturedBooksLibrary] Response data:', data);
                if (data.success) {
                    console.log('[CapturedBooksLibrary] Books loaded:', data.data.books?.length || 0);
                    setBooks(data.data.books || []);
                }
            } else {
                const errorData = await response.text();
                console.error('[CapturedBooksLibrary] Error response:', errorData);
                Alert.alert('Error', `Failed to load books: ${response.status}`);
            }
        } catch (error) {
            console.error('[CapturedBooksLibrary] Fetch error:', error.message);
            Alert.alert('Error', 'Failed to load books');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBook = async (bookId) => {
        Alert.alert('Delete', 'Delete this book?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        console.log('[CapturedBooksLibrary] Deleting book:', bookId);
                        const response = await fetch(`${API_BASE}/books/captured/${bookId}`, {
                            method: 'DELETE',
                            headers: {
                                'x-user-email': 'testuser@example.com',
                                'Content-Type': 'application/json',
                            },
                        });
                        console.log('[CapturedBooksLibrary] Delete response status:', response.status);
                        if (response.ok) {
                            setBooks(books.filter(b => b._id !== bookId));
                            Alert.alert('Success', 'Book deleted');
                        } else {
                            const errorData = await response.text();
                            console.error('[CapturedBooksLibrary] Delete error:', errorData);
                            Alert.alert('Error', 'Failed to delete book');
                        }
                    } catch (error) {
                        console.error('[CapturedBooksLibrary] Delete fetch error:', error);
                        Alert.alert('Error', 'Failed to delete book');
                    }
                },
            },
        ]);
    };

    const handleBookPress = (book) => {
        navigation.navigate('BookDetail', { bookId: book._id });
    };

    const renderBookItem = ({ item }) => (
        <TouchableOpacity
            style={styles.bookCard}
            onPress={() => handleBookPress(item)}
        >
            {item.thumbnail && (
                <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            )}
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.bookMetadata}>
                    <Text style={styles.metaText}>{item.totalPages} pages</Text>
                    <Text style={styles.metaText}>{item.averageConfidence}% OCR</Text>
                </View>
                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${item.readingProgress || 0}%` },
                        ]}
                    />
                </View>
                <Text style={styles.lastReadText}>
                    Last read:{' '}
                    {new Date(item.lastReadAt || item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteBook(item._id)}
            >
                <FontAwesome name="trash" size={18} color="#FF6B6B" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Loading books...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Camera Button */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Captured Books</Text>
                <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => navigation.navigate('BookCamera')}
                >
                    <FontAwesome name="camera" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Books List or Empty State */}
            {books.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FontAwesome name="book" size={80} color="rgba(0,0,0,0.2)" />
                    <Text style={styles.emptyText}>No captured books yet</Text>
                    <Text style={styles.emptySubtext}>
                        Tap the camera button to capture pages
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={books}
                    renderItem={renderBookItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
        color: '#000',
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
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        flex: 1,
    },
    cameraButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    bookCard: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 12,
        marginHorizontal: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    thumbnail: {
        width: 80,
        height: 120,
        backgroundColor: '#ddd',
    },
    bookInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    bookMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#000',
    },
    lastReadText: {
        fontSize: 11,
        color: '#999',
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default CapturedBooksLibraryScreen;
