/**
 * Floating Settings Button Component
 * Hovers in the top-right corner of screens
 * Provides quick access to service preferences settings
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useConfig } from '../hooks/useConfig';
import PrimaryButton from './PrimaryButton';

export default function FloatingSettingsButton() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const {
    servicePreferences,
    updateServicePreference,
    hasRecordingsLecture,
    hasCaptureBooks,
    hasVoiceModality,
  } = useConfig();

  const toggleServicePreference = (preference) => {
    updateServicePreference(
      preference,
      !servicePreferences[preference]
    );
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setSettingsVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Preferences</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.description}>
              Customize which services you want to access on this device. Changes are saved immediately.
            </Text>

            {/* Recording Lectures */}
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceIcon}>🎙️</Text>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Record Lectures</Text>
                  <Text style={styles.preferenceDescription}>
                    Record and transcribe lectures with automatic transcription
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.recordingsLecture}
                onValueChange={() => toggleServicePreference('recordingsLecture')}
                trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                thumbColor={servicePreferences.recordingsLecture ? '#4caf50' : '#f1f1f1'}
              />
            </View>

            {/* Capture Books */}
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceIcon}>📚</Text>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Capture & Scan Books</Text>
                  <Text style={styles.preferenceDescription}>
                    Capture physical book pages and extract text with OCR
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.captureBooks}
                onValueChange={() => toggleServicePreference('captureBooks')}
                trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                thumbColor={servicePreferences.captureBooks ? '#4caf50' : '#f1f1f1'}
              />
            </View>

            {/* Voice Modality */}
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceIcon}>🎤</Text>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceName}>Voice Modality</Text>
                  <Text style={styles.preferenceDescription}>
                    Use voice commands and get audio responses
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.voiceModality}
                onValueChange={() => toggleServicePreference('voiceModality')}
                trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                thumbColor={servicePreferences.voiceModality ? '#4caf50' : '#f1f1f1'}
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Note</Text>
              <Text style={styles.infoText}>
                When you disable a service, related features and buttons will be hidden from the app. You can re-enable them anytime from this settings panel.
              </Text>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.modalFooter}>
            <PrimaryButton
              title="Done"
              onPress={() => setSettingsVisible(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  buttonIcon: {
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  preferenceIcon: {
    fontSize: 32,
    marginRight: 12,
    marginTop: 2,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
    marginVertical: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
