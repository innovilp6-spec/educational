import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import useTranscriptAPI from '../hooks/useTranscriptAPI';
import SpecialText from '../components/SpecialText';

export default function TranscribingScreen({ route, navigation }) {
  const { masterTranscript } = route.params;
  const { processTranscript } = useTranscriptAPI();

  useEffect(() => {
    const processAndNavigate = async () => {
      try {
        // Process the master transcript (resolve word overlaps, etc.)
        const processedTranscript = await processTranscript(masterTranscript);
        
        // Navigate to NameSession with the processed transcript
        navigation.replace('NameSession', {
          audioPath: null, // Not used in new flow
          transcript: processedTranscript,
        });
      } catch (error) {
        console.error('Error processing transcript:', error);
        // On error, still navigate with the unprocessed transcript
        navigation.replace('NameSession', {
          audioPath: null,
          transcript: masterTranscript,
        });
      }
    };

    const timer = setTimeout(() => {
      processAndNavigate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [masterTranscript, navigation, processTranscript]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976d2" />
      <SpecialText style={styles.text}>Processing transcript…</SpecialText>
      <SpecialText style={styles.subText}>Resolving word overlaps and optimizing text...</SpecialText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: { 
    marginTop: 16, 
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

