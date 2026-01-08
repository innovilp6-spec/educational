import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function StudyLibraryScreen({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 16 }}>
        My Study Library
      </Text>

      <PrimaryButton
        title="Sample Lecture Notes"
        onPress={() => navigation.navigate('Export')}
      />

      <Text>(Stored lectures and summaries will appear here)</Text>
    </View>
  );
}
