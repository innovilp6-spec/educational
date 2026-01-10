import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';

export default function RecordingListScreen() {
  const [recordings, setRecordings] = useState([]);
  const navigation = useNavigation();

  // Load recordings when the screen loads
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const path = RNFS.DocumentDirectoryPath;
        const files = await RNFS.readDir(path); // Get all files in the document directory

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
              // Old recordings don't have metadata.json - this is expected
              // New recordings will have it saved by NameSessionScreen
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
      } catch (error) {
        console.error('Error loading recordings:', error);
        Alert.alert('Error', 'Failed to load the recordings.');
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
      `Are you sure you want to delete "${recording.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // Get the folder path
              const folderPath = `${RNFS.DocumentDirectoryPath}/${recording.id}`;

              // Check if folder exists
              const exists = await RNFS.exists(folderPath);
              if (exists) {
                // Delete the entire folder
                await RNFS.unlink(folderPath);
                console.log(`Deleted recording: ${recording.name}`);

                // Remove from list
                setRecordings(prev => prev.filter(r => r.id !== recording.id));

                Alert.alert('Success', `Recording "${recording.name}" deleted successfully.`);
              }
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', `Failed to delete recording: ${error.message}`);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Recordings</Text>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => handleSelectRecording(item)}
            >
              <Text style={styles.title}>{item.name}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteRecording(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemContent: {
    flex: 1,
    padding: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 6,
    marginRight: 12,
    marginVertical: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
