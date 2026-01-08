import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function BookReadingScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 16 }}>
        Read Physical Book
      </Text>

      <PrimaryButton title="Capture Page (Camera)" onPress={() => {}} />
      <PrimaryButton title="Upload Image" onPress={() => {}} />

      <Text style={{ marginTop: 16 }}>
        OCR and reading assistance will be added later.
      </Text>
    </View>
  );
}
