import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';
import useTranscriptAPI from '../hooks/useTranscriptAPI';

export default function NameSessionScreen({ navigation, route }) {
  const { transcript } = route.params;
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createTranscript } = useTranscriptAPI();

  const handleSave = async () => {
    const sessionName = name || `Lecture_${new Date().toDateString()}`;

    try {
      setIsLoading(true);

      console.log('Creating transcript on server...');

      // Create transcript on server to get transcriptId
      const response = await createTranscript(
        transcript,
        '10',              // standard (valid enum: 6, 7, 8, 9, 10, 11, 12)
        'Chapter 1',       // chapter
        sessionName,       // topic
        'General',         // subject
        sessionName        // sessionName (required field)
      );

      const transcriptId = response._id || response.transcriptId || response.transcript?.transcriptId;

      if (!transcriptId) {
        throw new Error('No transcript ID received from server');
      }

      console.log('Transcript created with ID:', transcriptId);

      // Save transcriptId and transcript to local files for later retrieval
      try {
        const sessionFolder = `${RNFS.DocumentDirectoryPath}/${sessionName.replace(/\s+/g, '_')}`;
        
        // Create session folder if it doesn't exist
        const exists = await RNFS.exists(sessionFolder);
        if (!exists) {
          await RNFS.mkdir(sessionFolder, { NSURLIsExcludedFromBackupKey: true });
        }

        // Save transcript content
        await RNFS.writeFile(`${sessionFolder}/transcript.txt`, transcript, 'utf8');

        // Save metadata (including transcriptId for later use)
        const metadata = {
          transcriptId,
          sessionName,
          createdAt: new Date().toISOString(),
          standard: '10',
          chapter: 'Chapter 1',
          subject: 'General',
        };
        await RNFS.writeFile(`${sessionFolder}/metadata.json`, JSON.stringify(metadata, null, 2), 'utf8');

        console.log('Saved transcript and metadata locally');
      } catch (fileErr) {
        console.error('Warning: Could not save local files:', fileErr);
        // Continue anyway - server data is what matters
      }

      // Navigate to the Transcript Viewer screen with the session name, transcript, and transcriptId
      navigation.replace('TranscriptViewer', {
        sessionName,
        transcript,
        transcriptId,
      });
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', `Failed to save the session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Name this lecture</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter lecture name"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Creating transcript...</Text>
        </View>
      )}

      <PrimaryButton
        title="Save"
        onPress={handleSave}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
});

