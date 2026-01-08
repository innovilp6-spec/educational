import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function SugamyaLibraryScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 16 }}>
        Sugamya Pustakalaya
      </Text>

      <PrimaryButton title="Search Accessible Books" onPress={() => {}} />
      <PrimaryButton title="My Downloads" onPress={() => {}} />

      <Text>
        (This will integrate with Sugamya APIs / feeds)
      </Text>
    </View>
  );
}
