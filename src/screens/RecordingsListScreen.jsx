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
        const recordings = files.filter(file => file.isDirectory()).map(file => {
          const audioFilePath = `${file.path}/audio.m4a`;
          const transcriptFilePath = `${file.path}/transcript.txt`;
          return {
            id: file.name,
            name: file.name,
            audioFilePath,
            transcriptFilePath,
          };
        });

        setRecordings(recordings);
      } catch (error) {
        console.error('Error loading recordings:', error);
        Alert.alert('Error', 'Failed to load the recordings.');
      }
    };

    loadRecordings();
  }, []);

  const handleSelectRecording = (sessionName, audioFilePath, transcriptFilePath) => {
    navigation.navigate('TranscriptViewer', { sessionName, audioFilePath, transcriptFilePath });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Recordings</Text>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectRecording(item.name, item.audioFilePath, item.transcriptFilePath)}
          >
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
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
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
