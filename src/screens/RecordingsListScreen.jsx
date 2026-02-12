import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';

export default function RecordingListScreen() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Load recordings when the screen loads
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const path = RNFS.DocumentDirectoryPath;
        const files = await RNFS.readDir(path);

        // Filter out directories that contain audio files and transcripts
        const recordings = await Promise.all(
          files.filter(file => file.isDirectory()).map(async (file) => {
            const audioFilePath = `${file.path}/audio.m4a`;
            const transcriptFilePath = `${file.path}/transcript.txt`;
            const metadataPath = `${file.path}/metadata.json`;

            // Try to read transcript content
            let transcriptContent = '';
            try {
              transcriptContent = await RNFS.readFile(transcriptFilePath, 'utf8');
            } catch (err) {
              console.log(`Transcript file not found for ${file.name} (old recording)`);
            }

            // Try to read transcriptId from metadata
            let transcriptId = null;
            try {
              const metadataStr = await RNFS.readFile(metadataPath, 'utf8');
              const metadata = JSON.parse(metadataStr);
              transcriptId = metadata.transcriptId;
            } catch (err) {
              console.log(`Metadata not found for ${file.name} (old recording before metadata feature)`);
            }

            return {
              id: file.name,
              name: file.name,
              audioFilePath,
              transcriptFilePath,
              transcript: transcriptContent,
              transcriptId,
            };
          })
        );

        setRecordings(recordings);
        setLoading(false);
      } catch (error) {
        console.error('Error loading recordings:', error);
        Alert.alert('Error', 'Failed to load the recordings.');
        setLoading(false);
      }
    };

    loadRecordings();
  }, []);

  const handleSelectRecording = (recording) => {
    navigation.navigate('TranscriptViewer', {
      sessionName: recording.name,
      transcript: recording.transcript,
      transcriptId: recording.transcriptId,
      audioFilePath: recording.audioFilePath,
      transcriptFilePath: recording.transcriptFilePath
    });
  };

  const handleDeleteRecording = (recording) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.name}"?`,
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const folderPath = `${RNFS.DocumentDirectoryPath}/${recording.id}`;
              const exists = await RNFS.exists(folderPath);
              if (exists) {
                await RNFS.unlink(folderPath);
                console.log(`Deleted recording: ${recording.name}`);
                setRecordings(prev => prev.filter(r => r.id !== recording.id));
                Alert.alert('Deleted', `Recording "${recording.name}" deleted.`);
              }
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', `Failed to delete: ${error.message}`);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const RecordingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectRecording(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.badgeContainer}>
            {item.transcript && (
              <View style={styles.transcriptBadge}>
                <Text style={styles.badgeText}>📝</Text>
              </View>
            )}
          </View>
        </View>

        {item.transcript && (
          <Text style={styles.cardPreview} numberOfLines={2}>
            {item.transcript.substring(0, 100)}...
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {item.transcript.split(' ').length} words
          </Text>
          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={() => handleDeleteRecording(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Recordings</Text>
        <Text style={styles.headerSubtitle}>{recordings.length} saved</Text>
      </View>

      {/* Empty State */}
      {!loading && recordings.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎙️</Text>
          <Text style={styles.emptyText}>No recordings yet</Text>
          <Text style={styles.emptySubtext}>Start recording a lecture to see it here</Text>
        </View>
      )}

      {/* Recordings List */}
      {recordings.length > 0 && (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecordingCard item={item} />}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  transcriptBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  cardPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  deleteIconButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
});
