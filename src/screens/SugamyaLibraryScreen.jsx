/**
 * Sugamya Pustakalaya Library Screen
 * Browse and download accessible books with agentic filtering
 * Supports DAISY, EPUB, and Braille formats for accessibility
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
};

export default function SugamyaLibraryScreen() {
  const {
    isProcessing,
    searchSugamyaBooks,
    getSugamyaPopularBooks,
    getSugamyaDownloads,
  } = useTranscriptAPI();

  // State management
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'popular', 'downloads'
  const [searchResults, setSearchResults] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [popularBooks, setPopularBooks] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Load user profile and search on mount
  useEffect(() => {
    handleAutoSearch();
  }, []);

  // Load downloads when downloads tab is active
  useEffect(() => {
    if (activeTab === 'downloads') {
      loadDownloads();
    }
  }, [activeTab]);

  const loadDownloads = async () => {
    try {
      const userDownloads = await getSugamyaDownloads();
      setDownloads(userDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  // Agentic search - backend uses user profile automatically
  const handleAutoSearch = async () => {
    try {
      setIsLoadingSearch(true);
      // Backend will automatically use user's stored profile (grade, language, format)
      // Frontend doesn't need to pass any filter parameters
      const results = await searchSugamyaBooks({});
      setSearchResults(results.books || []);
      setUserProfile(results.userProfile);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const loadPopular = async () => {
    try {
      const books = await getSugamyaPopularBooks();
      setPopularBooks(books);
    } catch (error) {
      console.error('Failed to load popular books:', error);
    }
  };

  const handleUpdateFormatPreferences = async (formats) => {
    try {
      await updateSugamyaFormatPreferences(formats);
      alert('Format preferences updated');
    } catch (error) {
      alert('Failed to update preferences: ' + error.message);
    }
  };

  // Render book card
  const renderBookCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => {
        setSelectedBook(item);
        setBookDetailsModalVisible(true);
      }}
    >
      <View style={styles.bookCardContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <View style={styles.bookMeta}>
          <Text style={styles.bookFormat}>{item.format}</Text>
          <Text
            style={[
              styles.bookAvailability,
              item.availability === 'free'
                ? styles.availabilityFree
                : styles.availabilityRestricted,
            ]}
          >
            {item.availability === 'free' ? '✓ Free' : 'Restricted'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render download item
  const renderDownloadItem = ({ item }) => (
    <View style={styles.downloadItem}>
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadTitle}>{item.bookTitle}</Text>
        <Text style={styles.downloadAuthor}>{item.bookAuthor}</Text>
        <View style={styles.downloadStatus}>
          <Text
            style={[
              styles.statusBadge,
              item.status === 'ready' && styles.statusReady,
              item.status === 'processing' && styles.statusProcessing,
              item.status === 'requested' && styles.statusRequested,
            ]}
          >
            {item.status?.toUpperCase()}
          </Text>
          <Text style={styles.downloadFormat}>{item.format}</Text>
        </View>
      </View>
      <Text style={styles.downloadDate}>
        {new Date(item.requestedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  // Search Tab
  const renderSearchTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Agentic Search Status */}
      <View style={styles.agenticStatus}>
        <Text style={styles.agenticTitle}>🤖 Agentic Search</Text>
        <Text style={styles.agenticDescription}>Searching books based on your profile...</Text>

        {userProfile && (
          <View style={styles.profileCard}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>📚 Grade</Text>
              <Text style={styles.profileValue}>{userProfile.grade || 'Not set'}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>🌐 Language</Text>
              <Text style={styles.profileValue}>{userProfile.language || 'English'}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>📄 Format</Text>
              <Text style={styles.profileValue}>{userProfile.formatPreference || 'DAISY'}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.refreshButton, isLoadingSearch && styles.refreshButtonDisabled]}
        onPress={handleAutoSearch}
        disabled={isLoadingSearch}
      >
        {isLoadingSearch ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.refreshButtonText}>🔄 Refresh Search</Text>
        )}
      </TouchableOpacity>

      {searchResults.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>Found {searchResults.length} books</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderBookCard}
        keyExtractor={(item, idx) => `${item.sugamyaId}-${idx}`}
        scrollEnabled={false}
        ListEmptyComponent={
          searchResults.length === 0 && !isLoadingSearch ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>📖 No books found</Text>
              <Text style={styles.emptyText}>
                {userProfile
                  ? `No books available in ${userProfile.language} format for Grade ${userProfile.grade}`
                  : 'Try refreshing to load books'}
              </Text>
            </View>
          ) : null
        }
      />
    </ScrollView>
  );

  // Popular Tab
  const renderPopularTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={[styles.loadButton, isProcessing && styles.loadButtonDisabled]}
        onPress={loadPopular}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loadButtonText}>⭐ Load Popular Books</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={popularBooks}
        renderItem={renderBookCard}
        keyExtractor={(item, idx) => `popular-${item.sugamyaId}-${idx}`}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No popular books available</Text>
        }
      />
    </ScrollView>
  );

  // Downloads Tab
  const renderDownloadsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.downloadsHeader}>
        <Text style={styles.downloadsTitle}>📥 Your Downloads</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadDownloads}
          disabled={isProcessing}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {downloads.length === 0 ? (
        <Text style={styles.emptyText}>No downloads yet. Search for books to get started!</Text>
      ) : (
        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.downloadId}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  // Book Details Modal
  const renderBookDetailsModal = () => (
    <Modal
      visible={bookDetailsModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setBookDetailsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setBookDetailsModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {selectedBook && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedBook.title}</Text>
              <Text style={styles.modalAuthor}>{selectedBook.author}</Text>

              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Format:</Text>
                  <Text style={styles.detailValue}>{selectedBook.format}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>{selectedBook.size}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Availability:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      selectedBook.availability === 'free' && { color: COLORS.success },
                    ]}
                  >
                    {selectedBook.availability}
                  </Text>
                </View>
                {selectedBook.synopsis && (
                  <View style={styles.synopsisSection}>
                    <Text style={styles.synopsisLabel}>Synopsis:</Text>
                    <Text style={styles.synopsisText}>{selectedBook.synopsis}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  // TODO: Implement download request
                  setBookDetailsModalVisible(false);
                  alert('Download feature coming soon');
                }}
              >
                <Text style={styles.downloadButtonText}>📥 Request Download</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Sugamya Pustakalaya</Text>
        <Text style={styles.headerSubtitle}>Accessible Digital Library</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text
            style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}
          >
            🔍 Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => {
            setActiveTab('popular');
            if (popularBooks.length === 0) loadPopular();
          }}
        >
          <Text
            style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}
          >
            ⭐ Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'downloads' && styles.tabActive]}
          onPress={() => setActiveTab('downloads')}
        >
          <Text
            style={[styles.tabText, activeTab === 'downloads' && styles.tabTextActive]}
          >
            📥 Downloads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'search' && renderSearchTab()}
      {activeTab === 'popular' && renderPopularTab()}
      {activeTab === 'downloads' && renderDownloadsTab()}

      {/* Book Details Modal */}
      {renderBookDetailsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  agenticStatus: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  agenticTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  agenticDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: 10,
    gap: 8,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsInfo: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bookCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookCardContent: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookFormat: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bookAvailability: {
    fontSize: 12,
    fontWeight: '500',
  },
  availabilityFree: {
    color: COLORS.success,
  },
  availabilityRestricted: {
    color: COLORS.warning,
  },
  emptyState: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  downloadsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  downloadItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  downloadAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  downloadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusReady: {
    backgroundColor: '#d1fae5',
    color: COLORS.success,
  },
  statusProcessing: {
    backgroundColor: '#fef3c7',
    color: COLORS.warning,
  },
  statusRequested: {
    backgroundColor: '#dbeafe',
    color: COLORS.primary,
  },
  downloadFormat: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  downloadDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginHorizontal: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.text,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    width: 80,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  synopsisSection: {
    marginTop: 12,
  },
  synopsisLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  synopsisText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  downloadButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
