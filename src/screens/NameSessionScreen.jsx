import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function NameSessionScreen({ navigation, route }) {
  const { transcript } = route.params;
  const [name, setName] = useState('');

  const handleSave = async () => {
    const sessionName = name || `Lecture_${new Date().toDateString()}`;

    try {
      // Navigate to the Transcript Viewer screen with the session name and transcript
      // Note: In the new flow, we don't save files to storage yet
      // You can add file saving logic here later if needed
      navigation.replace('TranscriptViewer', {
        sessionName,
        transcript,
      });
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save the session.');
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
    borderRadius: 8,
  },
});

