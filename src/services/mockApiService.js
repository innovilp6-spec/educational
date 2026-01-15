/**
 * Mock API Service
 * Provides dummy data and simulated API responses for UI testing
 * These methods replicate the backend API structure without making actual network calls
 */

// ============================================================================
// DUMMY DATA
// ============================================================================

const DUMMY_BOOKS = [
    {
        _id: '64a1b2c3d4e5f6g7h8i9j0k1',
        title: 'Introduction to React Native',
        category: 'Technology',
        tags: ['programming', 'mobile', 'react'],
        totalPages: 45,
        readingProgress: 65,
        averageConfidence: 92,
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        createdAt: new Date(2024, 11, 15),
        lastReadAt: new Date(2025, 0, 10),
        summary: 'A comprehensive guide to mobile app development with React Native.',
    },
    {
        _id: '64a1b2c3d4e5f6g7h8i9j0k2',
        title: 'Python Advanced Concepts',
        category: 'Programming',
        tags: ['python', 'advanced', 'programming'],
        totalPages: 62,
        readingProgress: 35,
        averageConfidence: 88,
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        createdAt: new Date(2024, 10, 20),
        lastReadAt: new Date(2025, 0, 8),
        summary: 'Deep dive into advanced Python programming concepts and techniques.',
    },
    {
        _id: '64a1b2c3d4e5f6g7h8i9j0k3',
        title: 'Machine Learning Fundamentals',
        category: 'AI/ML',
        tags: ['machine-learning', 'ai', 'data-science'],
        totalPages: 78,
        readingProgress: 20,
        averageConfidence: 90,
        thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        createdAt: new Date(2024, 9, 5),
        lastReadAt: new Date(2025, 0, 12),
        summary: 'Complete guide to machine learning algorithms and their applications.',
    },
];

const DUMMY_BOOK_DETAIL = {
    _id: '64a1b2c3d4e5f6g7h8i9j0k1',
    title: 'Introduction to React Native',
    category: 'Technology',
    tags: ['programming', 'mobile', 'react'],
    totalPages: 45,
    readingProgress: 65,
    averageConfidence: 92,
    thumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    createdAt: new Date(2024, 11, 15),
    lastReadAt: new Date(2025, 0, 10),
    summary: 'A comprehensive guide to mobile app development with React Native.',
    notes: 'Great resource for learning React Native fundamentals.',
    textArray3D: [
        // Page 1
        [
            // Paragraph 1
            [
                'React Native is an open-source framework for building native apps using React.',
                'It allows you to write code once and deploy it to both iOS and Android platforms.',
                'The framework handles the complexity of native development while keeping the developer experience smooth.',
            ],
            // Paragraph 2
            [
                'Getting started with React Native is straightforward.',
                'You can use Expo CLI for rapid development, or set up native modules with react-native-cli.',
                'Both approaches have their advantages and use cases.',
            ],
        ],
        // Page 2
        [
            // Paragraph 3
            [
                'Understanding component architecture is crucial for building scalable applications.',
                'React Native provides core components like View, Text, ScrollView, and FlatList.',
                'These components map directly to native components on iOS and Android.',
            ],
            // Paragraph 4
            [
                'State management is a key aspect of any React application.',
                'You can use hooks like useState and useContext for simple state management.',
                'For complex applications, Redux or MobX provide more robust solutions.',
            ],
        ],
        // Page 3
        [
            // Paragraph 5
            [
                'Navigation is essential for multi-screen applications.',
                'React Navigation is the most popular library in the React Native ecosystem.',
                'It provides stack, tab, and drawer navigation patterns out of the box.',
            ],
            // Paragraph 6
            [
                'Performance optimization is critical for mobile apps.',
                'Using FlatList instead of ScrollView with large lists can significantly improve performance.',
                'Always profile your app to identify bottlenecks and optimize accordingly.',
            ],
        ],
    ],
};

// ============================================================================
// MOCK API METHODS
// ============================================================================

/**
 * Mock method: Fetch list of captured books
 * Simulates: GET /api/books/captured
 * @returns {Promise<Object>} Mock API response with books list
 */
export const mockFetchBooks = async () => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Books fetched successfully',
                data: {
                    books: DUMMY_BOOKS,
                    total: DUMMY_BOOKS.length,
                },
            });
        }, 1000);
    });
};

/**
 * Mock method: Fetch details of a specific book
 * Simulates: GET /api/books/captured/:bookId
 * @param {string} bookId - The ID of the book to fetch
 * @returns {Promise<Object>} Mock API response with book details
 */
export const mockFetchBookDetail = async (bookId) => {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // Find book by ID or return dummy data
            const book = DUMMY_BOOKS.find((b) => b._id === bookId) || DUMMY_BOOK_DETAIL;

            if (book) {
                resolve({
                    success: true,
                    message: 'Book details fetched successfully',
                    data: {
                        ...book,
                        textArray3D: DUMMY_BOOK_DETAIL.textArray3D,
                    },
                });
            } else {
                reject({
                    success: false,
                    message: 'Book not found',
                });
            }
        }, 1500);
    });
};

/**
 * Mock method: Upload and process book images
 * Simulates: POST /api/books/captured/scan
 * Progressively updates page processing count
 * @param {Array} images - Array of image objects {uri, data}
 * @param {string} title - Book title
 * @param {string} category - Book category
 * @param {Array} tags - Book tags
 * @param {Function} onProgress - Callback to update processing progress
 * @returns {Promise<Object>} Mock API response with created book ID
 */
export const mockUploadAndProcessImages = async (
    images,
    title,
    category,
    tags,
    onProgress = null
) => {
    return new Promise((resolve) => {
        const totalPages = images.length;
        let processedPages = 0;

        // Simulate processing each page
        const processPages = () => {
            if (processedPages < totalPages) {
                processedPages++;

                // Call progress callback if provided
                if (onProgress) {
                    onProgress(processedPages);
                }

                // Simulate time per page (3-5 seconds per page)
                const delay = Math.random() * 2000 + 3000;
                setTimeout(processPages, delay);
            } else {
                // All pages processed, return success
                const newBookId = `64a1b2c3d4e5f6g7h8i9j0k${Date.now() % 1000}`;
                resolve({
                    success: true,
                    message: 'Book processed successfully',
                    data: {
                        bookId: newBookId,
                        title: title || 'Captured Book',
                        category: category || 'Uncategorized',
                        totalPages: totalPages,
                        averageConfidence: Math.floor(Math.random() * 15 + 85), // 85-100%
                    },
                });
            }
        };

        // Start processing
        processPages();
    });
};

/**
 * Mock method: Delete a book
 * Simulates: DELETE /api/books/captured/:bookId
 * @param {string} bookId - The ID of the book to delete
 * @returns {Promise<Object>} Mock API response
 */
export const mockDeleteBook = async (bookId) => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Book deleted successfully',
                data: {
                    deletedId: bookId,
                },
            });
        }, 800);
    });
};

/**
 * Mock method: Update book metadata
 * Simulates: PUT /api/books/captured/:bookId
 * @param {string} bookId - The ID of the book to update
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<Object>} Mock API response
 */
export const mockUpdateBook = async (bookId, updates) => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Book updated successfully',
                data: {
                    bookId: bookId,
                    ...updates,
                },
            });
        }, 600);
    });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random dummy book
 * @returns {Object} Random book from DUMMY_BOOKS
 */
export const getRandomBook = () => {
    return DUMMY_BOOKS[Math.floor(Math.random() * DUMMY_BOOKS.length)];
};

/**
 * Get book detail by ID
 * @param {string} bookId - Book ID
 * @returns {Object|null} Book detail or null if not found
 */
export const getBookDetailById = (bookId) => {
    if (bookId === DUMMY_BOOK_DETAIL._id) {
        return DUMMY_BOOK_DETAIL;
    }
    const book = DUMMY_BOOKS.find((b) => b._id === bookId);
    return book ? { ...book, textArray3D: DUMMY_BOOK_DETAIL.textArray3D } : null;
};

/**
 * Add a new book to dummy data (for testing)
 * @param {Object} bookData - Book object to add
 * @returns {Array} Updated DUMMY_BOOKS array
 */
export const addDummyBook = (bookData) => {
    const newBook = {
        _id: `64a1b2c3d4e5f6g7h8i9j0k${DUMMY_BOOKS.length + 1}`,
        readingProgress: 0,
        createdAt: new Date(),
        lastReadAt: new Date(),
        ...bookData,
    };
    DUMMY_BOOKS.push(newBook);
    return DUMMY_BOOKS;
};

/**
 * Clear all dummy data
 */
export const clearDummyData = () => {
    DUMMY_BOOKS.length = 0;
};

export default {
    mockFetchBooks,
    mockFetchBookDetail,
    mockUploadAndProcessImages,
    mockDeleteBook,
    mockUpdateBook,
    getRandomBook,
    getBookDetailById,
    addDummyBook,
    clearDummyData,
};
