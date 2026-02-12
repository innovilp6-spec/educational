/**
 * NALP Student Profile Selection Screen
 * Allows users to select their student profile for personalized book recommendations
 * Shown after successful registration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import PrimaryButton from '../components/PrimaryButton';

const SERVER_BASE_URL = 'http://10.0.2.2:5000';

const ProfileSelectionScreen = ({ route, navigation }) => {
  const { userEmail } = route.params;

  const [profileOptions, setProfileOptions] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState({
    k12_level: null,
    higher_education_level: null,
    professional_vocational_specialization: null,
    university_specialization: null,
    school_subject: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available profile options on component mount
  useEffect(() => {
    fetchProfileOptions();
  }, []);

  const fetchProfileOptions = async () => {
    try {
      console.log('[PROFILE-SELECTION] Fetching profile options...');
      const response = await fetch(`${SERVER_BASE_URL}/api/auth/nalp-profile-options`);
      const data = await response.json();

      if (data.success && data.profileOptions) {
        console.log('[PROFILE-SELECTION] Profile options fetched successfully');
        setProfileOptions(data.profileOptions);
      } else {
        throw new Error(data.message || 'Failed to fetch profile options');
      }
    } catch (error) {
      console.error('[PROFILE-SELECTION] Error fetching profile options:', error);
      Alert.alert('Error', 'Failed to load profile options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    // Validate at least one category selected
    const selectedCount = Object.values(selectedProfile).filter((v) => v !== null).length;
    if (selectedCount === 0) {
      Alert.alert('Validation', 'Please select at least one profile category');
      return;
    }

    setSubmitting(true);

    try {
      // Filter out null values
      const profileToSend = Object.fromEntries(
        Object.entries(selectedProfile).filter(([, value]) => value !== null)
      );

      console.log('[PROFILE-SELECTION] Submitting profile:', profileToSend);

      const response = await fetch(`${SERVER_BASE_URL}/api/auth/complete-nalp-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        body: JSON.stringify(profileToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete profile');
      }

      console.log('[PROFILE-SELECTION] Profile completed successfully');

      Alert.alert('Success', 'Your student profile has been set up!', [
        {
          text: 'Continue',
          onPress: () => {
            navigation.replace('Home');
          },
        },
      ]);
    } catch (error) {
      console.error('[PROFILE-SELECTION] Error submitting profile:', error);
      Alert.alert('Error', error.message || 'Failed to complete profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup',
      'You can complete your profile later in settings. Do you want to continue?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'Continue Without Profile',
          onPress: () => {
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading profile options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profileOptions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load profile options</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfileOptions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Personalize Your Profile</Text>
        <Text style={styles.headerSubtitle}>Help us recommend books that match your needs</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Select any student profile that matches your situation. This helps us recommend books tailored to your educational level and interests.
          </Text>
        </View>

        {/* K-12 Level */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>K-12 Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProfile.k12_level}
              onValueChange={(value) =>
                setSelectedProfile({ ...selectedProfile, k12_level: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select K-12 Level (optional)" value={null} />
              {profileOptions.k12_levels && profileOptions.k12_levels.map((level) => (
                <Picker.Item key={level} label={level} value={level} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Higher Education */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Higher Education</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProfile.higher_education_level}
              onValueChange={(value) =>
                setSelectedProfile({
                  ...selectedProfile,
                  higher_education_level: value,
                })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select Higher Education Level (optional)" value={null} />
              {profileOptions.higher_education && profileOptions.higher_education.map((level) => (
                <Picker.Item key={level} label={level} value={level} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Professional & Vocational */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Professional & Vocational</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProfile.professional_vocational_specialization}
              onValueChange={(value) =>
                setSelectedProfile({
                  ...selectedProfile,
                  professional_vocational_specialization: value,
                })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select Professional/Vocational (optional)" value={null} />
              {profileOptions.professional_and_vocational &&
                profileOptions.professional_and_vocational.map((spec) => (
                  <Picker.Item key={spec} label={spec} value={spec} />
                ))}
            </Picker>
          </View>
        </View>

        {/* University Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>University Specialization</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProfile.university_specialization}
              onValueChange={(value) =>
                setSelectedProfile({
                  ...selectedProfile,
                  university_specialization: value,
                })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select University Specialization (optional)" value={null} />
              {profileOptions.university_specializations &&
                profileOptions.university_specializations.map((spec) => (
                  <Picker.Item key={spec} label={spec} value={spec} />
                ))}
            </Picker>
          </View>
        </View>

        {/* School Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>School Subject</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProfile.school_subject}
              onValueChange={(value) =>
                setSelectedProfile({
                  ...selectedProfile,
                  school_subject: value,
                })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select School Subject (optional)" value={null} />
              {profileOptions.school_subjects &&
                profileOptions.school_subjects.map((subject) => (
                  <Picker.Item key={subject} label={subject} value={subject} />
                ))}
            </Picker>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleProfileSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={submitting}
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
    color: '#000000',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 30,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6666',
  },
});

export default ProfileSelectionScreen;
