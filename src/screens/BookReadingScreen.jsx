import React from 'react';
import { View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import SpecialText from '../components/SpecialText';

export default function BookReadingScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <SpecialText style={{ fontSize: 22, marginBottom: 16 }}>
        Read Physical Book
      </SpecialText>

      <PrimaryButton title="Capture Page (Camera)" onPress={() => { }} />
      <PrimaryButton title="Upload Image" onPress={() => { }} />

      <SpecialText Text style={{ marginTop: 16 }}>
        OCR and reading assistance will be added later.
      </SpecialText>
    </View>
  );
}
