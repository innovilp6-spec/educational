import React from 'react';
import { Pressable, Text, TouchableOpacity } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        padding: 16,
        marginVertical: 8,
        backgroundColor: disabled ? '#ccc' : '#000',
        borderRadius: 6,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
