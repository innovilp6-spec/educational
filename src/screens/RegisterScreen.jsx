/**
 * User Registration Screen
 * Multi-step form collecting user information including NALP student profile
 * Steps: Basic → Education → Student Profile → Services → Formats
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
import { Picker } from '@react-native-picker/picker';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

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

// Hardcoded NALP Profile Options
const NALP_PROFILE_OPTIONS = {
  k12_levels: [
    'Pre Kindergarden',
    'Kindergarden',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
    'High School',
  ],
  higher_education: [
    'College First Year',
    'College Second Year',
    'College Third Year',
    'College Fourth Year',
    'Undergraduate',
    'Post Graduate',
  ],
  professional_and_vocational: [
    'Medical',
    'Professional',
    'Engineering',
    'Pre-Professional',
    'Competitive Examination',
    'B.Ed.',
    'Law',
    'CA',
    'CWA',
    'CS',
    'MCA',
    'MBA',
    'Agriculture and Rural Development',
    'Adult Education',
  ],
  university_specializations: [
    'University Geography',
    'University History',
    'University Maths',
    'University Physics',
    'University Chemistry',
    'University Biology',
    'University Economics',
    'University Political Science',
    'University Philosophy',
    'University English',
    'University Hindi',
    'University Sanskrit',
    'University Urdu',
    'University Psychology',
    'University Sociology',
    'University Commerce',
    'University Accounting',
    'University Statistics',
    'University Botany',
    'University Zoology',
    'University Geology',
    'University Home Science',
    'University Music',
  ],
  school_subjects: [
    'School English',
    'School Hindi',
    'School Mathematics',
    'School Science',
    'School Social Studies',
    'School Marathi',
    'School Sanskrit',
    'School Biology',
    'School Physics',
    'School Chemistry',
    'School History',
    'School Geography',
    'School Civics',
    'School Physical Education',
    'School Computer Science',
  ],
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

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

  // NALP Profile - only one value (determined by education standard)
  const [nalpProfileValue, setNalpProfileValue] = useState(null);

  // Service preferences
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
  const [activeStep, setActiveStep] = useState('basic'); // basic, education, sugamya, services, formats

  // Determine which profile category to show based on education standard
  const getProfileCategoryForStandard = () => {
    if (!educationStandard) return null;
    const std = parseInt(educationStandard);
    if (std >= 6 && std <= 12) return 'k12_levels';
    return null; // Standard grades only have K-12 profiles
  };

  const getCurrentProfileOptions = () => {
    const category = getProfileCategoryForStandard();
    if (!category) return [];
    return NALP_PROFILE_OPTIONS[category] || [];
  };

  // Validation
  const isBasicValid = name.trim() && email.trim() && password && confirmPassword && password === confirmPassword;
  const isEducationValid = educationStandard && educationBoard; // Profile is optional
  const isFormValid = isBasicValid && isEducationValid && sugamyaFormatPreferences.length > 0;

  // Toggle format preference
  const toggleFormat = (format) => {
    setSugamyaFormatPreferences((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  // Toggle service
  const toggleService = (service) => {
    setServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
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
        sugamyaFormatPreferences,
        sugamyaUsername,
        sugamyaPassword,
        nalpProfile: nalpProfileValue ? { [getProfileCategoryForStandard()]: nalpProfileValue } : {}, // Include profile if selected
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

      // Registration successful - save to AuthContext
      console.log('[REGISTER-SCREEN] Registration successful for user:', data.user.userId);

      const result = await register(data.user);
      if (result.success) {
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
            style={[styles.step, activeStep === 'sugamya' && styles.stepActive]}
            onPress={() => isEducationValid && setActiveStep('sugamya')}
            disabled={!isEducationValid}
          >
            <Text style={styles.stepText}>Sugamya</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, activeStep === 'services' && styles.stepActive]}
            onPress={() => setActiveStep('services')}
          >
            <Text style={styles.stepText}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, activeStep === 'formats' && styles.stepActive]}
            onPress={() => setActiveStep('formats')}
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

        {/* Education Information + Student Profile */}
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
                    setNalpProfileValue(null); // Reset profile when standard changes
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

            {/* Conditional Student Profile Selection */}
            {getCurrentProfileOptions().length > 0 && (
              <>
                <Text style={styles.label}>🎓 Student Profile (Optional)</Text>
                <Text style={styles.description}>
                  Select a profile that matches your situation for personalized recommendations
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={nalpProfileValue}
                    onValueChange={(value) => setNalpProfileValue(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a profile (optional)" value={null} />
                    {getCurrentProfileOptions().map((option) => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <PrimaryButton
              title="Continue to Sugamya"
              onPress={() => setActiveStep('sugamya')}
              disabled={!isEducationValid || isLoading}
            />
          </View>
        )}

        {/* Sugamya Credentials */}
        {activeStep === 'sugamya' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugamya Pustakalaya Credentials</Text>
            <Text style={styles.description}>
              Enter your Sugamya library credentials (optional - defaults will be used)
            </Text>

            <Text style={styles.label}>Sugamya Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Sugamya username"
              value={sugamyaUsername}
              onChangeText={setSugamyaUsername}
              editable={!isLoading}
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>Sugamya Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Sugamya password"
              value={sugamyaPassword}
              onChangeText={setSugamyaPassword}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor="#999999"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Leave blank to use default credentials. You can update these later.
              </Text>
            </View>

            <PrimaryButton
              title="Continue to Services"
              onPress={() => setActiveStep('services')}
              disabled={isLoading}
            />
          </View>
        )}

        {/* Services Selection */}
        {activeStep === 'services' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Services</Text>
            <Text style={styles.description}>
              Choose the accessibility features you want to use
            </Text>

            {Object.keys(services).map((service) => (
              <View key={service} style={styles.serviceRow}>
                <View>
                  <Text style={styles.serviceName}>
                    {service === 'liveTranscription'
                      ? '🎙️ Live Transcription'
                      : service === 'textToSpeech'
                        ? '🔊 Text to Speech'
                        : service === 'simplifiedSummaries'
                          ? '📝 Simplified Summaries'
                          : '📚 Sugamya Library'}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {service === 'liveTranscription'
                      ? 'Convert spoken lectures to text'
                      : service === 'textToSpeech'
                        ? 'Listen to content being read aloud'
                        : service === 'simplifiedSummaries'
                          ? 'Get simplified study notes'
                          : 'Access accessible digital books'}
                  </Text>
                </View>
                <Switch
                  value={services[service]}
                  onValueChange={() => toggleService(service)}
                  disabled={service === 'sugamyaLibrary' || isLoading}
                />
              </View>
            ))}

            <PrimaryButton
              title="Continue to Format Preferences"
              onPress={() => setActiveStep('formats')}
              disabled={isLoading}
            />
          </View>
        )}

        {/* Format Preferences */}
        {activeStep === 'formats' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugamya Format Preferences *</Text>
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
});