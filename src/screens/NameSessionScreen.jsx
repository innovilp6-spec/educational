import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import PrimaryButton from '../components/PrimaryButton';

export default function NameSessionScreen({ navigation, route }) {
  const { audioPath, transcript } = route.params;
  const [name, setName] = useState('');

  const handleSave = async () => {
    const sessionName = name || `Lecture_${new Date().toDateString()}`;
    const folderPath = `${RNFS.DocumentDirectoryPath}/${sessionName}`;

    try {
      // Create the folder
      await RNFS.mkdir(folderPath);

      // Define paths for the audio and transcript files
      const audioFilePath = `${folderPath}/audio.m4a`;
      const transcriptFilePath = `${folderPath}/transcript.txt`;

      // Copy the audio file to the folder
      await RNFS.copyFile(audioPath, audioFilePath);

      // Save the transcript to a text file
      await RNFS.writeFile(transcriptFilePath, transcript, 'utf8');

      // Navigate to the Transcript Viewer screen with the saved paths
      navigation.replace('TranscriptViewer', {
        sessionName,
        audioFilePath,
        transcriptFilePath,
      });
    } catch (error) {
      console.error('Error saving files:', error);
      Alert.alert('Error', 'Failed to save the files.');
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
      />

      <PrimaryButton title="Save" onPress={handleSave} />
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
  },
});
