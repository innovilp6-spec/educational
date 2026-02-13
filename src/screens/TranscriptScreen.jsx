import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import SpecialText from '../components/SpecialText';

export default function TranscriptScreen({ route }) {
  const { transcript } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SpecialText style={styles.heading}>Lecture Transcript</SpecialText>
      <SpecialText style={styles.text}>{transcript}</SpecialText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 24, marginBottom: 16 },
  text: { fontSize: 18, lineHeight: 26 },
});
