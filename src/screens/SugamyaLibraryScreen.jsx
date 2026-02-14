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
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import SpecialText from '../components/SpecialText';

const COLORS = {
  primary: '#0d0d14',
  secondary: '#09080e',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#040608',
  textSecondary: '#0a0b0e',
  border: '#e2e8f0',
};

export default function SugamyaLibraryScreen() {
  const {
    isProcessing,
    searchSugamyaBooks,
    getSugamyaPopularBooks,
    getSugamyaDownloads,
    getSugamyaDownloadRequests,
    getSugamyaUserHistory,
    requestSugamyaDownload,
  } = useTranscriptAPI();

  // State management
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'popular', 'downloads', 'downloadRequests', 'history'
  const [searchResults, setSearchResults] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [popularBooks, setPopularBooks] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [downloadRequests, setDownloadRequests] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookDetailsModalVisible, setBookDetailsModalVisible] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isRequestingDownload, setIsRequestingDownload] = useState(false);

  // Load user profile and search on mount
  useEffect(() => {
    handleAutoSearch();
  }, []);

  // Load downloads when downloads tab is active
  useEffect(() => {
    if (activeTab === 'downloads') {
      loadDownloads();
    } else if (activeTab === 'downloadRequests') {
      loadDownloadRequests();
    }

    // else if (activeTab === 'history') {
    //   loadUserHistory();
    // }
  }, [activeTab]);

  const loadDownloads = async () => {
    try {
      const userDownloads = await getSugamyaDownloads();
      setDownloads(userDownloads);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const loadDownloadRequests = async () => {
    try {
      const requests = await getSugamyaDownloadRequests(1, 250);
      console.log('Raw download requests response:', requests);
      setDownloadRequests(requests.requests || []);
    } catch (error) {
      console.error('Failed to load download requests:', error);
    }
  };

  const loadUserHistory = async () => {
    try {
      const historyData = await getSugamyaUserHistory(1, 10);
      setUserHistory(historyData.history || []);
    } catch (error) {
      console.error('Failed to load user history:', error);
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

  // Handle book download request using book's format
  const handleRequestDownload = async () => {
    try {
      if (!selectedBook) {
        alert('No book selected');
        return;
      }

      // Get book ID from multiple possible property names
      const bookId = selectedBook.sugamyaId || selectedBook.id || selectedBook.bookId;

      if (!bookId) {
        alert('Book ID not found. Unable to request download.');
        return;
      }

      setIsRequestingDownload(true);
      console.log('[SugamyaLibraryScreen] Requesting download:', {
        bookId,
        format: selectedBook.format,
      });

      const result = await requestSugamyaDownload(bookId, selectedBook.format);

      console.log('[SugamyaLibraryScreen] Download request successful:', result);

      alert(
        `✅ Download request submitted!\n\nBook: ${selectedBook.title}\nFormat: ${selectedBook.format}\nStatus: Processing\n\nCheck your Downloads tab for updates.`
      );

      // Close modal and refresh downloads list
      setBookDetailsModalVisible(false);
      await loadDownloads();
    } catch (error) {
      console.error('[SugamyaLibraryScreen] Download request failed:', error);
      alert(`❌ Failed to request download: ${error.message}`);
    } finally {
      setIsRequestingDownload(false);
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
        <SpecialText style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </SpecialText>
        <SpecialText style={styles.bookAuthor}>{item.author}</SpecialText>
        <View style={styles.bookMeta}>
          <SpecialText style={styles.bookFormat}>{item.format}</SpecialText>
          <SpecialText
            style={[
              styles.bookAvailability,
              item.availability === 'free'
                ? styles.availabilityFree
                : styles.availabilityRestricted,
            ]}
          >
            {item.availability === 'free' ? '✓ Free' : 'Restricted'}
          </SpecialText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render download item
  const renderDownloadItem = ({ item }) => (
    <View style={styles.downloadItem}>
      <View style={styles.downloadInfo}>
        <SpecialText style={styles.downloadTitle}>{item.bookTitle}</SpecialText>
        <SpecialText style={styles.downloadAuthor}>{item.bookAuthor}</SpecialText>
        <View style={styles.downloadStatus}>
          <SpecialText
            style={[
              styles.statusBadge,
              item.status === 'ready' && styles.statusReady,
              item.status === 'processing' && styles.statusProcessing,
              item.status === 'requested' && styles.statusRequested,
            ]}
          >
            {item.status?.toUpperCase()}
          </SpecialText>
          <SpecialText style={styles.downloadFormat}>{item.format}</SpecialText>
        </View>
      </View>
      <SpecialText style={styles.downloadDate}>
        {new Date(item.requestedAt).toLocaleDateString()}
      </SpecialText>
    </View>
  );

  // Search Tab
  const renderSearchTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Agentic Search Status */}
      {/* <View style={styles.agenticStatus}>
        <SpecialText style={styles.agenticTitle}>🤖 Agentic Search</SpecialText>
        <SpecialText style={styles.agenticDescription}>Searching books based on your profile...</SpecialText>

        {userProfile && (
          <View style={styles.profileCard}>
            <View style={styles.profileItem}>
              <SpecialText style={styles.profileLabel}>📚 Grade</SpecialText>
              <SpecialText style={styles.profileValue}>{userProfile.grade || 'Not set'}</SpecialText>
            </View>
            <View style={styles.profileItem}>
              <SpecialText style={styles.profileLabel}>🌐 Language</SpecialText>
              <SpecialText style={styles.profileValue}>{userProfile.language || 'English'}</SpecialText>
            </View>
            <View style={styles.profileItem}>
              <SpecialText style={styles.profileLabel}>📄 Format</SpecialText>
              <SpecialText style={styles.profileValue}>{userProfile.formatPreference || 'DAISY'}</SpecialText>
            </View>
          </View>
        )}
      </View> */}

      <PrimaryButton title={"🔄 Refresh Search"} onPress={handleAutoSearch} disabled={isLoadingSearch}></PrimaryButton>

      {/* <TouchableOpacity
        style={[styles.refreshButton, isLoadingSearch && styles.refreshButtonDisabled]}
        onPress={handleAutoSearch}
        disabled={isLoadingSearch}
      >
        {isLoadingSearch ? (
          <ActivityIndicator color="white" />
        ) : (
          <SpecialText style={styles.refreshButtonText}>🔄 Refresh Search</SpecialText>
        )}
      </TouchableOpacity> */}

      {searchResults.length > 0 && (
        <View style={styles.resultsInfo}>
          <SpecialText style={styles.resultsCount}>Found {searchResults.length} books</SpecialText>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderBookCard}
        keyExtractor={(item, idx) => `search-book-${item.sugamyaId || item.bookId || item.id || idx}`}
        scrollEnabled={false}
        ListEmptyComponent={
          searchResults.length === 0 && !isLoadingSearch ? (
            <View style={styles.emptyState}>
              <SpecialText style={styles.emptyTitle}><Text>📖</Text> No books found</SpecialText>
              <SpecialText style={styles.emptyText}>
                {userProfile
                  ? `No books available in ${userProfile.language} format for Grade ${userProfile.grade}`
                  : 'Try refreshing to load books'}
              </SpecialText>
            </View>
          ) : null
        }
      />
    </ScrollView>
  );

  // Popular Tab
  const renderPopularTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>

      <PrimaryButton title={"⭐ Load Popular Books"} onPress={loadPopular} disabled={isProcessing}></PrimaryButton>
      {/* <TouchableOpacity
        style={[styles.loadButton, isProcessing && styles.loadButtonDisabled]}
        onPress={loadPopular}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <SpecialText style={styles.loadButtonText}>⭐ Load Popular Books</SpecialText>
        )}
      </TouchableOpacity> */}

      <FlatList
        data={popularBooks}
        renderItem={renderBookCard}
        keyExtractor={(item, idx) => `popular-book-${item.sugamyaId || item.bookId || item.id || idx}`}
        scrollEnabled={false}
        ListEmptyComponent={
          <SpecialText style={styles.emptyText}>No popular books available</SpecialText>
        }
      />
    </ScrollView>
  );

  // Downloads Tab
  const renderDownloadsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.downloadsHeader}>
        <SpecialText style={styles.downloadsTitle}><Text>📥</Text> Your Downloads</SpecialText>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadDownloads}
          disabled={isProcessing}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {downloads.length === 0 ? (
        <SpecialText style={styles.emptyText}>No downloads yet. Search for books to get started!</SpecialText>
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

  const openDownloadLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Unable to open download link.');
    }
  };


  // Render download requests tab
  const renderDownloadRequestsTab = () => {
    const renderRequestItem = (item) => (
      <View style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <SpecialText style={styles.requestTitle}>{item.bookTitle}</SpecialText>
          <SpecialText style={[
            styles.requestStatus,
            { color: item.status === 'ready' ? COLORS.success : COLORS.warning }
          ]}>
            {item.status === 'ready' ? '✓' : '⏳'} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </SpecialText>
        </View>
        <SpecialText style={styles.requestFormat}>Format: {item.format}</SpecialText>
        {item.expiryDate && (
          <SpecialText style={styles.requestExpiry}>Expires: {item.expiryDate}</SpecialText>
        )}
        {item.status === 'ready' && item.downloadLink && (
          <TouchableOpacity
            style={styles.downloadLinkButton}
            onPress={() => openDownloadLink(item.downloadLink)}
          >
            <SpecialText style={styles.downloadLinkText}><Text>📥</Text> Download Now</SpecialText>
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.downloadsHeader}>
          <SpecialText style={styles.downloadsTitle}><Text>⏳</Text> Download Requests</SpecialText>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadDownloadRequests}
            disabled={isProcessing}
          >
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        </View>

        {downloadRequests.length === 0 ? (
          <SpecialText style={styles.emptyText}>No pending download requests. Request books to get started!</SpecialText>
        ) : (
          <FlatList
            data={downloadRequests}
            renderItem={({ item }) => renderRequestItem(item)}
            keyExtractor={(item) => item.requestId}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    );
  };

  // Render user history tab
  // const renderHistoryTab = () => {
  //   const renderHistoryItem = (item) => (
  //     <View style={styles.historyItem}>
  //       <View style={styles.historyHeader}>
  //         <SpecialText style={styles.historyTitle}>{item.bookTitle}</SpecialText>
  //       </View>
  //       <SpecialText style={styles.historyAuthor}>Author: {item.bookAuthor}</SpecialText>
  //       <SpecialText style={styles.historyFormat}>Format: {item.format}</SpecialText>
  //       <TouchableOpacity
  //         style={styles.historyDownloadButton}
  //         onPress={() => {
  //           if (item.downloadLink) {
  //             alert('Opening download link: ' + item.downloadLink);
  //           } else {
  //             alert('Download link not available');
  //           }
  //         }}
  //       >
  //         <SpecialText style={styles.historyDownloadButtonText}><Text>📥</Text> Access Book</SpecialText>
  //       </TouchableOpacity>
  //     </View>
  //   );

  //   return (
  //     <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
  //       <View style={styles.downloadsHeader}>
  //         <SpecialText style={styles.downloadsTitle}>📖 Reading History</SpecialText>
  //         <TouchableOpacity
  //           style={styles.refreshButton}
  //           onPress={loadUserHistory}
  //           disabled={isProcessing}
  //         >
  //           <SpecialText style={styles.refreshButtonText}>↻</SpecialText>
  //         </TouchableOpacity>
  //       </View>

  //       {userHistory.length === 0 ? (
  //         <SpecialText style={styles.emptyText}>No reading history yet. Browse and read books to see them here!</SpecialText>
  //       ) : (
  //         <FlatList
  //           data={userHistory}
  //           renderItem={({ item }) => renderHistoryItem(item)}
  //           keyExtractor={(item) => item.bookId}
  //           scrollEnabled={false}
  //         />
  //       )}
  //     </ScrollView>
  //   );
  // };

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
            <SpecialText style={styles.closeButtonText}>✕</SpecialText>
          </TouchableOpacity>

          {selectedBook && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <SpecialText style={styles.modalTitle}>{selectedBook.title}</SpecialText>
              <SpecialText style={styles.modalAuthor}>{selectedBook.author}</SpecialText>

              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <SpecialText style={styles.detailLabel}>Format:</SpecialText>
                  <SpecialText style={styles.detailValue}>{selectedBook.format}</SpecialText>
                </View>
                <View style={styles.detailRow}>
                  <SpecialText style={styles.detailLabel}>Size:</SpecialText>
                  <SpecialText style={styles.detailValue}>{selectedBook.size}</SpecialText>
                </View>
                <View style={styles.detailRow}>
                  <SpecialText style={styles.detailLabel}>Availability:</SpecialText>
                  <SpecialText
                    style={[
                      styles.detailValue,
                      selectedBook.availability === 'free' && { color: COLORS.success },
                    ]}
                  >
                    {selectedBook.availability}
                  </SpecialText>
                </View>
                {selectedBook.synopsis && (
                  <View style={styles.synopsisSection}>
                    <SpecialText style={styles.synopsisLabel}>Synopsis:</SpecialText>
                    <SpecialText style={styles.synopsisText}>{selectedBook.synopsis}</SpecialText>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.downloadButton, isRequestingDownload && styles.downloadButtonDisabled]}
                onPress={handleRequestDownload}
                disabled={isRequestingDownload}
              >
                {isRequestingDownload ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <SpecialText style={styles.downloadButtonText}><Text>📥</Text> Request Download</SpecialText>
                )}
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
        <SpecialText style={styles.headerTitle}><Text>📚</Text> Sugamya Pustakalaya</SpecialText>
        <SpecialText style={styles.headerSubtitle}>Accessible Digital Library</SpecialText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <SpecialText
            style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}
          >
            <Text>🔍</Text> Search
          </SpecialText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.tabActive]}
          onPress={() => {
            setActiveTab('popular');
            if (popularBooks.length === 0) loadPopular();
          }}
        >
          <SpecialText
            style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}
          >
            <Text>⭐</Text> Popular
          </SpecialText>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.tab, activeTab === 'downloads' && styles.tabActive]}
          onPress={() => setActiveTab('downloads')}
        >
          <SpecialText
            style={[styles.tabText, activeTab === 'downloads' && styles.tabTextActive]}
          >
            📥 Downloads
          </SpecialText>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'downloadRequests' && styles.tabActive]}
          onPress={() => setActiveTab('downloadRequests')}
        >
          <SpecialText
            style={[styles.tabText, activeTab === 'downloadRequests' && styles.tabTextActive]}
          >
            <Text>⏳</Text> Requests
          </SpecialText>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <SpecialText
            style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}
          >
            <Text>📖</Text> History
          </SpecialText>
        </TouchableOpacity> */}
      </View>

      {/* Tab Content */}
      {activeTab === 'search' && renderSearchTab()}
      {activeTab === 'popular' && renderPopularTab()}
      {activeTab === 'downloads' && renderDownloadsTab()}
      {activeTab === 'downloadRequests' && renderDownloadRequestsTab()}
      {/* {activeTab === 'history' && renderHistoryTab()} */}

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
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Download Requests Styles
  requestItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fef3c7',
  },
  requestFormat: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  requestExpiry: {
    fontSize: 11,
    color: COLORS.danger,
    marginBottom: 8,
  },
  downloadLinkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  downloadLinkText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // History Tab Styles
  historyItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  historyHeader: {
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  historyFormat: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  historyDownloadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  historyDownloadButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});