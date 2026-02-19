/**
 * Dyslexia Guide Modal Component
 * Provides information about different dyslexia types and recommends
 * service combinations for each type to optimize user experience
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import SpecialText from './SpecialText';
import PrimaryButton from './PrimaryButton';

const DYSLEXIA_TYPES = [
  {
    id: 'surface',
    name: 'Surface Dyslexia',
    icon: '👁️',
    recommended: {
      bionicText: true,
      simplification: true,
      voiceModality: false,
      textReader: false,
      recordingsLecture: false,
      captureBooks: false,
    },
  },
  {
    id: 'phonological',
    name: 'Phonological Dyslexia',
    icon: '🔊',
    recommended: {
      bionicText: true,
      simplification: true,
      voiceModality: true,
      textReader: false,
      recordingsLecture: false,
      captureBooks: false,
    },
  },
  {
    id: 'ran',
    name: 'RAN Dyslexia',
    icon: '⏱️',
    recommended: {
      bionicText: true,
      simplification: true,
      voiceModality: true,
      textReader: true,
      recordingsLecture: false,
      captureBooks: false,
    },
  },
  {
    id: 'auditory',
    name: 'Auditory Dyslexia',
    icon: '🎧',
    recommended: {
      bionicText: true,
      simplification: false,
      voiceModality: true,
      textReader: true,
      recordingsLecture: true,
      captureBooks: false,
    },
  },
  {
    id: 'deep',
    name: 'Deep Dyslexia',
    icon: '🧠',
    recommended: {
      bionicText: false,
      simplification: true,
      voiceModality: true,
      textReader: false,
      recordingsLecture: true,
      captureBooks: false,
    },
  },
  {
    id: 'double',
    name: 'Double-Deficit Dyslexia',
    icon: '🔄',
    recommended: {
      bionicText: true,
      simplification: true,
      voiceModality: true,
      textReader: true,
      recordingsLecture: true,
      captureBooks: true,
    },
  },
  {
    id: 'general',
    name: 'Developmental Dyslexia',
    icon: '📖',
    recommended: {
      bionicText: true,
      simplification: true,
      voiceModality: true,
      textReader: true,
      recordingsLecture: true,
      captureBooks: true,
    },
  },
];

export default function DyslexiaGuideModal({
  visible,
  onClose,
  onApplyRecommendations,
  servicePreferences = {},
}) {
  const [selectedType, setSelectedType] = useState('surface');

  const selectedDyslexia = DYSLEXIA_TYPES.find((type) => type.id === selectedType);

  const handleApply = () => {
    if (selectedDyslexia && onApplyRecommendations) {
      onApplyRecommendations(selectedDyslexia.recommended);
      onClose();
    }
  };

  const getRecommendedServices = (recommended) => {
    return Object.entries(recommended)
      .filter(([_, value]) => value)
      .map(([key]) => formatServiceName(key))
      .join(', ');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <SpecialText style={styles.headerTitle}>Guide for Dyslexic Users</SpecialText>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection List */}
          <View style={styles.typeList}>
            {DYSLEXIA_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <View style={styles.typeInfo}>
                  <SpecialText
                    style={[
                      styles.typeName,
                      selectedType === type.id && styles.typeNameActive,
                    ]}
                  >
                    {type.name}
                  </SpecialText>
                  <SpecialText
                    style={[
                      styles.recommendedServices,
                      selectedType === type.id && styles.recommendedServicesActive,
                    ]}
                  >
                    {getRecommendedServices(type.recommended)}
                  </SpecialText>
                </View>
                {selectedType === type.id && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Apply Recommendations"
            onPress={handleApply}
          />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <SpecialText style={styles.cancelButtonText}>Cancel</SpecialText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Format service name for display
 */
function formatServiceName(key) {
  const names = {
    bionicText: 'Bionic',
    simplification: 'Simplify',
    voiceModality: 'Voice',
    textReader: 'Reader',
    recordingsLecture: 'Recordings',
    captureBooks: 'Capture',
  };
  return names[key] || key;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  typeList: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeCardActive: {
    backgroundColor: '#f0f0f0',
    borderColor: '#000000',
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  typeNameActive: {
    color: '#000000',
  },
  recommendedServices: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  recommendedServicesActive: {
    color: '#333333',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 20,
    color: '#4caf50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
});
