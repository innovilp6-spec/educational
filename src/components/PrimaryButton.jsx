import React from 'react';
import { Pressable, Text, TouchableOpacity } from 'react-native';

export default function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#000',
        borderRadius: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
