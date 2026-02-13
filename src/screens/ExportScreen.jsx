import React from 'react';
import { View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import SpecialText from '../components/SpecialText';
export default function ExportScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <SpecialText style={{ fontSize: 22, marginBottom: 16 }}>
        Export Notes
      </SpecialText>

      <PrimaryButton title="Export as PDF" onPress={() => {}} />
      <PrimaryButton title="Export as DOCX" onPress={() => {}} />

      <SpecialText>
        (Formatted accessible documents will be generated later)
      </SpecialText>
    </View>
  );
}
