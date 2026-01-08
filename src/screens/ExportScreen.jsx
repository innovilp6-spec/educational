import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function ExportScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 16 }}>
        Export Notes
      </Text>

      <PrimaryButton title="Export as PDF" onPress={() => {}} />
      <PrimaryButton title="Export as DOCX" onPress={() => {}} />

      <Text>
        (Formatted accessible documents will be generated later)
      </Text>
    </View>
  );
}
