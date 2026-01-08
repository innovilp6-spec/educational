import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function TranscribingScreen({ route, navigation }) {
  const { audioPath } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      const success = true;
      if (success) {
        navigation.replace('NameSession', {
          audioPath,
          transcript: 'This is a dummy transcript of the lecture.',
        });
      } else {
        navigation.replace('Error', { audioPath });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Generating transcript…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 16, fontSize: 16 },
});
