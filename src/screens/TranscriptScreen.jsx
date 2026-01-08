import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TranscriptScreen({ route }) {
  const { transcript } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Lecture Transcript</Text>
      <Text style={styles.text}>{transcript}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 24, marginBottom: 16 },
  text: { fontSize: 18, lineHeight: 26 },
});
