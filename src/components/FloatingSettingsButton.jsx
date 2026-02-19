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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useConfig } from '../hooks/useConfig';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from './PrimaryButton';
import SpecialText from './SpecialText';
import DyslexiaGuideModal from './DyslexiaGuideModal';
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/apiService';


export default function FloatingSettingsButton() {
  const { getUserEmail, logout, getUserName, getUserGrade } = useAuth();
  const navigation = useNavigation();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(getUserGrade());
  const [isUpdatingGrade, setIsUpdatingGrade] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dyslexiaGuideVisible, setDyslexiaGuideVisible] = useState(false);

  
  const {
    servicePreferences,
    updateServicePreference,
    hasRecordingsLecture,
    hasCaptureBooks,
    hasVoiceModality,
    isLoading,
    error,
  } = useConfig();

  console.log('[FloatingSettingsButton] Rendered with name', getUserName());
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const handleGradeChange = (newGrade) => {
    Alert.alert(
      'Confirm Grade Change',
      `Change grade to ${newGrade}?`,
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateGradeOnServer(newGrade);
          },
          style: 'default',
        },
      ]
    );
  };

  const updateGradeOnServer = async (newGrade) => {
    try {
      setIsUpdatingGrade(true);
      const userEmail = getUserEmail();

      if (!userEmail) {
        Alert.alert('Error', 'User email not found');
        return;
      }

      const response = await apiService.updateGrade(userEmail, newGrade);

      if (response.success) {
        setSelectedGrade(newGrade);
        Alert.alert('Success', `Grade updated to ${newGrade}`);
        console.log('[FloatingSettingsButton] Grade updated:', response);
      } else {
        Alert.alert('Error', response.message || 'Failed to update grade');
      }
    } catch (error) {
      console.error('[FloatingSettingsButton] Error updating grade:', error);
      Alert.alert('Error', 'Failed to update grade. Please try again.');
    } finally {
      setIsUpdatingGrade(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await performLogout();
            console.log('[FloatingSettingsButton] User logged out, navigating to Login screen');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      const userEmail = getUserEmail();

      if (!userEmail) {
        await logout();
        setSettingsVisible(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      // Call backend logout endpoint for audit logging
      const response = await apiService.logoutUser(userEmail);

      // Proceed with client-side logout regardless of backend response
      await logout();
      setSettingsVisible(false);
      
      // Reset navigation stack and navigate to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      console.log('[FloatingSettingsButton] User logged out successfully');
    } catch (error) {
      console.error('[FloatingSettingsButton] Logout error:', error);
      // Still perform client-side logout even if server call fails
      await logout();
      setSettingsVisible(false);
      
      // Navigate to Login even if there's an error
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } catch (navError) {
        console.error('[FloatingSettingsButton] Navigation error:', navError);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleApplyDyslexiaRecommendations = (recommendedPreferences) => {
    Object.keys(recommendedPreferences).forEach((preference) => {
      const userEmail = getUserEmail();
      if (userEmail && recommendedPreferences[preference] !== servicePreferences[preference]) {
        updateServicePreference(
          userEmail,
          preference,
          recommendedPreferences[preference],
          servicePreferences
        );
      }
    });
    Alert.alert(
      'Recommendations Applied',
      'Service preferences have been updated based on your dyslexia type. You can still customize them as needed.'
    );
  };

  const toggleServicePreference = async (preference) => {
    try {
      const userEmail = getUserEmail();
      if (!userEmail) {
        Alert.alert('Error', 'Unable to identify user. Please log in again.');
        return;
      }

      await updateServicePreference(
        userEmail,
        preference,
        !servicePreferences[preference],
        servicePreferences
      );
    } catch (err) {
      console.error('[FloatingSettingsButton] Error updating preference:', err);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setSettingsVisible(true)}
        activeOpacity={0.7}
        disabled={isLoading}
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
            <SpecialText style={styles.modalTitle}>Profile Actions</SpecialText>
            <TouchableOpacity
              onPress={() => setSettingsVisible(false)}
              disabled={isLoading}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <SpecialText style={styles.errorText}><Text>⚠️</Text> {error}</SpecialText>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            {/* PROFILE SECTION - SINGLE CARD */}
            <View style={styles.profileCard}>
              <SpecialText style={styles.sectionTitle}><Text>👤</Text> Profile</SpecialText>

              <View style={styles.cardDivider} />

              <View style={styles.cardRow}>
                <SpecialText style={styles.cardLabel}>Name</SpecialText>
                <SpecialText
                  style={styles.cardValue}
                >{getUserName() || 'Name'}</SpecialText>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardRow}>
                <SpecialText style={styles.cardLabel}>Email</SpecialText>
                <SpecialText
                  style={styles.cardValue}
                >{getUserEmail() || 'Email'}</SpecialText>
              </View>
            </View>

            {/* EDUCATION LEVEL SECTION - SINGLE CARD */}
            <View style={styles.educationCard}>
              <SpecialText style={styles.sectionTitle}><Text>📚</Text> Education Level</SpecialText>

              <View style={styles.cardDivider} />

              <View style={styles.gradePickerWrapper}>
                {/* <SpecialText style={styles.cardLabel}>Grade</SpecialText> */}
                <SpecialText
                  style={styles.cardValue}
                >{`In Grade ${selectedGrade}`}</SpecialText>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedGrade}
                  onValueChange={(itemValue) => handleGradeChange(itemValue)}
                  style={styles.picker}
                  enabled={!isUpdatingGrade}
                >
                  {grades.map((grade) => (
                    <Picker.Item key={grade} label={`Grade ${grade}`} value={grade} />
                  ))}
                </Picker>
                {isUpdatingGrade && (
                  <ActivityIndicator size="small" color="#4caf50" style={{ marginVertical: 8 }} />
                )}
              </View>
            </View>

            {/* SERVICE PREFERENCES SECTION */}
            <View style={styles.educationCard}>
              <View style={styles.sectionHeader}>
                <SpecialText style={styles.sectionTitle}><Text>⚙️</Text> Service Preferences</SpecialText>
                <TouchableOpacity
                  style={styles.infoBut}
                  onPress={() => setDyslexiaGuideVisible(true)}
                >
                  <Text style={styles.infoButtonText}>ℹ️</Text>
                </TouchableOpacity>
              </View>

              <SpecialText
                style={styles.description}
              >Customize which services you want to access on this device. Changes are saved immediately.</SpecialText>

              {/* Recording Lectures */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>🎙️</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Record Lectures</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Record and transcribe lectures with automatic transcription</SpecialText>
                  </View>
                </View>
                <View style={styles.switchContainer}>
                  {isLoading && (
                    <ActivityIndicator size="small" color="#4caf50" style={styles.loader} />
                  )}
                  <Switch
                    value={servicePreferences.recordingsLecture}
                    onValueChange={() => toggleServicePreference('recordingsLecture')}
                    trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                    thumbColor={servicePreferences.recordingsLecture ? '#4caf50' : '#f1f1f1'}
                    disabled={isLoading}
                  />
                </View>
              </View>

              {/* Capture Books */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>📷</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Capture & Scan Books</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Capture physical book pages and extract text with OCR</SpecialText>
                  </View>
                </View>
                <View style={styles.switchContainer}>
                  {isLoading && (
                    <ActivityIndicator size="small" color="#4caf50" style={styles.loader} />
                  )}
                  <Switch
                    value={servicePreferences.captureBooks}
                    onValueChange={() => toggleServicePreference('captureBooks')}
                    trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                    thumbColor={servicePreferences.captureBooks ? '#4caf50' : '#f1f1f1'}
                    disabled={isLoading}
                  />
                </View>
              </View>

              {/* Voice Modality */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>🔊</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Voice Modality</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Use voice commands and get audio responses</SpecialText>
                  </View>
                </View>
                <View style={styles.switchContainer}>
                  {isLoading && (
                    <ActivityIndicator size="small" color="#4caf50" style={styles.loader} />
                  )}
                  <Switch
                    value={servicePreferences.voiceModality}
                    onValueChange={() => toggleServicePreference('voiceModality')}
                    trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                    thumbColor={servicePreferences.voiceModality ? '#4caf50' : '#f1f1f1'}
                    disabled={isLoading}
                  />
                </View>
              </View>

              {/* Bionic Text */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>👁️</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Bionic Text</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Enable enhanced readability with bionic text rendering</SpecialText>
                  </View>
                </View>
                <Switch
                  value={servicePreferences.bionicText}
                  onValueChange={() => toggleServicePreference('bionicText')}
                  trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                  thumbColor={servicePreferences.bionicText ? '#4caf50' : '#f1f1f1'}
                  disabled={isLoading}
                />
              </View>

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>📚</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Text Reader</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Text reader for reading scanned books</SpecialText>
                  </View>
                </View>
                <Switch
                  value={servicePreferences.textReader}
                  onValueChange={() => toggleServicePreference('textReader')}
                  trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                  thumbColor={servicePreferences.textReader ? '#4caf50' : '#f1f1f1'}
                  disabled={isLoading}
                />
              </View>


              <View style={styles.preferenceItem}>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceIcon}>🧷</Text>
                  <View style={styles.preferenceText}>
                    <SpecialText style={styles.preferenceName}>Simplification</SpecialText>
                    <SpecialText
                      style={styles.preferenceDescription}
                    >Enable simplification scale for reading comprehension</SpecialText>
                  </View>
                </View>
                <Switch
                  value={servicePreferences.simplification}
                  onValueChange={() => toggleServicePreference('simplification')}
                  trackColor={{ false: '#e0e0e0', true: '#c8e6c9' }}
                  thumbColor={servicePreferences.simplification ? '#4caf50' : '#f1f1f1'}
                  disabled={isLoading}
                />
              </View>

              {/* Info Box */}
              {/* <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡</Text>
                <SpecialText
                  style={styles.infoText}
                >When you disable a service, related features and buttons will be hidden from the app. You can re-enable them anytime from this settings panel.</SpecialText>
              </View> */}
            </View>

            {/* ACCOUNT SECTION - SINGLE CARD */}
            <View style={styles.accountCard}>
              <SpecialText style={styles.sectionTitle}><Text>🚪</Text> Account</SpecialText>

              <View style={styles.cardDivider} />

              <TouchableOpacity
                style={styles.logoutButtonCard}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                <SpecialText style={styles.logoutButtonText}>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </SpecialText>
                <SpecialText
                  style={styles.logoutButtonDescription}
                >Sign out from your account</SpecialText>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.modalFooter}>
            <PrimaryButton
              title={isLoading ? 'Saving...' : 'Done'}
              onPress={() => setSettingsVisible(false)}
              disabled={isLoading}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Dyslexia Guide Modal */}
      <DyslexiaGuideModal
        visible={dyslexiaGuideVisible}
        onClose={() => setDyslexiaGuideVisible(false)}
        onApplyRecommendations={handleApplyDyslexiaRecommendations}
        servicePreferences={servicePreferences}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 28,
    // backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
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
  errorBox: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  errorText: {
    fontSize: 13,
    color: '#c62828',
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    marginRight: 8,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
    paddingLeft: 4,
  },
  infoBut: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 8,
  },
  infoButtonText: {
    fontSize: 16,
  },
  profileValue: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  educationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  cardValue: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  gradePickerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
  },
  picker: {
    height: 50,
  },
  logoutButtonCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff5f5',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 4,
  },
  logoutButtonDescription: {
    fontSize: 13,
    color: '#c62828',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
