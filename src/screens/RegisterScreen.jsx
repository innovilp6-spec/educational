/**
 * User Registration Screen
 * Multi-step form collecting user information including service preferences
 * Steps: Basic → Education → Services → Formats
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { setServicePreferences as dispatchSetServicePreferences } from '../store/slices/configSlice';

const SERVER_BASE_URL = 'http://10.0.2.2:5000';

const EDUCATION_STANDARDS = ['6', '7', '8', '9', '10', '11', '12'];
const EDUCATION_BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi'];
const SUGAMYA_FORMATS = [
  'DAISY Audio Only',
  'DAISY Text Only',
  'Formatted Braille',
  'DAISY Multimedia',
  'EPUB Audio',
  'EPUB Text Only',
  'EPUB with Media Overlay',
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const dispatch = useDispatch();

  // Form fields - Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('English');
  const [educationStandard, setEducationStandard] = useState('');
  const [educationBoard, setEducationBoard] = useState('');
  const [sugamyaUsername, setSugamyaUsername] = useState('');
  const [sugamyaPassword, setSugamyaPassword] = useState('');

  // Service preferences (the three main services)
  const [servicePreferences, setServicePreferences] = useState({
    recordingsLecture: false,
    captureBooks: false,
    voiceModality: false,
    bionicText: false,
    simplification: false,
  });

  // Legacy services (kept for backward compatibility)
  const [services, setServices] = useState({
    liveTranscription: false,
    textToSpeech: false,
    simplifiedSummaries: false,
    sugamyaLibrary: true,
  });

  // Sugamya format preferences
  const [sugamyaFormatPreferences, setSugamyaFormatPreferences] = useState([
    'DAISY Text Only',
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('basic'); // basic, education, services, formats

  // Validation
  const isBasicValid = name.trim() && email.trim() && password && confirmPassword && password === confirmPassword;
  const isEducationValid = educationStandard && educationBoard;
  const isFormValid = isBasicValid && isEducationValid && sugamyaFormatPreferences.length > 0;

  // Toggle service preference
  const toggleServicePreference = (preference) => {
    setServicePreferences((prev) => ({
      ...prev,
      [preference]: !prev[preference],
    }));
  };

  // Toggle format preference
  const toggleFormat = (format) => {
    setSugamyaFormatPreferences((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  // Register user
  const handleRegister = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please complete all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        language,
        educationStandard,
        educationBoard,
        services,
        servicePreferences,
        sugamyaFormatPreferences,
        sugamyaUsername,
        sugamyaPassword,
      };

      console.log('[REGISTER-SCREEN] Registering with payload:', payload);

      const response = await fetch(`${SERVER_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Registration Failed', data.message || 'Unknown error occurred');
        return;
      }

      // Registration successful
      console.log('[REGISTER-SCREEN] Registration successful for user:', data.user.userId);
      console.log('[REGISTER-SCREEN] Service Preferences:', data.user.servicePreferences);

      // Save to AuthContext (stores full user object)
      const result = await register(data.user);
      if (result.success) {
        // Dispatch service preferences to Redux (for global config access)
        dispatch(
          dispatchSetServicePreferences(
            data.user.servicePreferences || servicePreferences
          )
        );

        console.log('[REGISTER-SCREEN] User registered and Redux store updated');

        Alert.alert(
          'Registration Successful',
          `Welcome ${data.user.name}!`,
          [
            {
              text: 'Go to Home',
              onPress: () => navigation.replace('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save registration. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle service (legacy)
  const toggleService = (service) => {
    setServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Create Account</Text>
        <Text style={styles.headerSubtitle}>Join Accessibility Learning</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <TouchableOpacity
            style={[styles.step, activeStep === 'basic' && styles.stepActive]}
            onPress={() => setActiveStep('basic')}
          >
            <Text style={styles.stepText}>Basic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, activeStep === 'education' && styles.stepActive]}
            onPress={() => isBasicValid && setActiveStep('education')}
            disabled={!isBasicValid}
          >
            <Text style={styles.stepText}>Education</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, activeStep === 'services' && styles.stepActive]}
            onPress={() => isEducationValid && setActiveStep('services')}
            disabled={!isEducationValid}
          >
            <Text style={styles.stepText}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, activeStep === 'formats' && styles.stepActive]}
            onPress={() => isEducationValid && setActiveStep('formats')}
            disabled={!isEducationValid}
          >
            <Text style={styles.stepText}>Formats</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        {activeStep === 'basic' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={[
                styles.input,
                password !== confirmPassword &&
                confirmPassword && styles.inputError,
              ]}
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
            {password !== confirmPassword && confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <Text style={styles.label}>Preferred Language</Text>
            <View style={styles.pickContainer}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.pickOption,
                    language === lang && styles.pickOptionActive,
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.pickOptionText,
                      language === lang && styles.pickOptionTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title={isBasicValid ? 'Continue to Education' : 'Complete Basic Info'}
              onPress={() => isBasicValid && setActiveStep('education')}
              disabled={!isBasicValid || isLoading}
            />
          </View>
        )}

        {/* Education Information */}
        {activeStep === 'education' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Education Details</Text>

            <Text style={styles.label}>Education Standard *</Text>
            <View style={styles.pickContainer}>
              {EDUCATION_STANDARDS.map((std) => (
                <TouchableOpacity
                  key={std}
                  style={[
                    styles.pickOption,
                    educationStandard === std && styles.pickOptionActive,
                  ]}
                  onPress={() => {
                    setEducationStandard(std);
                  }}
                >
                  <Text
                    style={[
                      styles.pickOptionText,
                      educationStandard === std &&
                      styles.pickOptionTextActive,
                    ]}
                  >
                    {std}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Education Board *</Text>
            <View style={styles.pickContainer}>
              {EDUCATION_BOARDS.map((board) => (
                <TouchableOpacity
                  key={board}
                  style={[
                    styles.pickOption,
                    educationBoard === board && styles.pickOptionActive,
                  ]}
                  onPress={() => setEducationBoard(board)}
                >
                  <Text
                    style={[
                      styles.pickOptionText,
                      educationBoard === board &&
                      styles.pickOptionTextActive,
                    ]}
                  >
                    {board}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title="Continue to Services"
              onPress={() => setActiveStep('services')}
              disabled={!isEducationValid || isLoading}
            />
          </View>
        )}

        {/* Service Preferences Selection */}
        {activeStep === 'services' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Your Services</Text>
            <Text style={styles.description}>
              Choose which services you'd like to use. These can be updated anytime.
            </Text>

            {/* Recordings Lecture */}
            <View style={styles.serviceItem}>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>🎙️</Text>
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>Record Lectures</Text>
                  <Text style={styles.serviceDescription}>
                    Record and transcribe lectures with automatic transcription
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.recordingsLecture}
                onValueChange={() => toggleServicePreference('recordingsLecture')}
                disabled={isLoading}
              />
            </View>

            {/* Capture Books */}
            <View style={styles.serviceItem}>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>📚</Text>
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>Capture & Scan Books</Text>
                  <Text style={styles.serviceDescription}>
                    Capture physical book pages and extract text with OCR
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.captureBooks}
                onValueChange={() => toggleServicePreference('captureBooks')}
                disabled={isLoading}
              />
            </View>

            {/* Voice Modality */}
            <View style={styles.serviceItem}>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>🎤</Text>
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>Voice Modality</Text>
                  <Text style={styles.serviceDescription}>
                    Use voice commands and get audio responses
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.voiceModality}
                onValueChange={() => toggleServicePreference('voiceModality')}
                disabled={isLoading}
              />
            </View>

            {/* Bionic Text */}
            <View style={styles.serviceItem}>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>👁️</Text>
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>Bionic Text</Text>
                  <Text style={styles.serviceDescription}>
                    Enable enhanced readability with bionic text rendering
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.bionicText}
                onValueChange={() => toggleServicePreference('bionicText')}
                disabled={isLoading}
              />
            </View>

            <View style={styles.serviceItem}>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceIcon}>🧷</Text>
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName}>Simplification</Text>
                  <Text style={styles.serviceDescription}>
                    Enable enhanced readability with simplified text rendering
                  </Text>
                </View>
              </View>
              <Switch
                value={servicePreferences.simplification}
                onValueChange={() => toggleServicePreference('simplification')}
                disabled={isLoading}
              />
            </View>

            <PrimaryButton
              title="Continue to Formats"
              onPress={() => setActiveStep('formats')}
              disabled={isLoading}
            />
          </View>
        )}

        {/* Sugamya Credentials */}
        {activeStep === 'formats' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugamya Library Access (Optional)</Text>
            <Text style={styles.description}>
              If you have Sugamya library credentials, enter them here to access the collection
            </Text>

            <Text style={styles.label}>Sugamya Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Sugamya username"
              value={sugamyaUsername}
              onChangeText={setSugamyaUsername}
              editable={!isLoading}
            />

            <Text style={styles.label}>Sugamya Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Sugamya password"
              value={sugamyaPassword}
              onChangeText={setSugamyaPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Sugamya Format Preferences *</Text>
            <Text style={styles.description}>
              Select the book formats you prefer (at least one required)
            </Text>

            <View style={styles.formatGrid}>
              {SUGAMYA_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatCard,
                    sugamyaFormatPreferences.includes(format) &&
                    styles.formatCardActive,
                  ]}
                  onPress={() => toggleFormat(format)}
                >
                  <Text
                    style={[
                      styles.formatText,
                      sugamyaFormatPreferences.includes(format) &&
                      styles.formatTextActive,
                    ]}
                  >
                    {sugamyaFormatPreferences.includes(format) ? '✓' : '○'} {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.requiredText}>
              {sugamyaFormatPreferences.length} format(s) selected
            </Text>

            <PrimaryButton
              title={isLoading ? 'Creating Account...' : '✓ Complete Registration'}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  step: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#000000',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  stepActiveText: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
  },
  pickContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pickOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  pickOptionActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  pickOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  pickOptionTextActive: {
    color: '#ffffff',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666666',
  },
  formatGrid: {
    gap: 8,
    marginBottom: 16,
  },
  formatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formatCardActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  formatText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  formatTextActive: {
    color: '#ffffff',
  },
  requiredText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  loginLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  profileSection: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  picker: {
    height: 50,
    color: '#000000',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6666',
    marginBottom: 8,
  },
  // Service preference item styles
  serviceItem: {
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
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  serviceIcon: {
    fontSize: 32,
    marginRight: 12,
    marginTop: 4,
  },
  serviceText: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});