/**
 * User Login Screen
 * Email and password authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { setUserConfig } from '../store/slices/configSlice';

const SERVER_BASE_URL = 'http://10.0.2.2:5000';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const isFormValid = email.trim() && password;

  // Login user
  const handleLogin = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
        return;
      }

      // Login successful - save to AuthContext and Redux
      console.log('[LOGIN-SCREEN] Login successful for user:', data.user.userId);
      console.log('[LOGIN-SCREEN] Service Preferences:', data.user.servicePreferences);
      
      const result = await login(data.user);
      if (result.success) {
        // Store user config in Redux, including service preferences
        dispatch(
          setUserConfig({
            servicePreferences: data.user.servicePreferences,
            language: data.user.language,
            educationStandard: data.user.educationStandard,
            educationBoard: data.user.educationBoard,
          })
        );
        
        console.log('[LOGIN-SCREEN] User config stored in Redux');
        
        // Navigate to home
        navigation.replace('AgenticCoach');
      } else {
        Alert.alert('Error', 'Failed to save session. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
           <Text style={styles.headerTitle}>📚 Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Accessibility Learning Platform</Text>
        </View>

        <View style={styles.content}>
          {/* Illustration/Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor="#999999"
          />

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              placeholderTextColor="#999999"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <PrimaryButton
            title={isLoading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>New to the platform?</Text>
            <View style={styles.divider} />
          </View>

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
            style={styles.registerButton}
          >
            <Text style={styles.registerText}>Create Account</Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Demo Credentials</Text>
            <Text style={styles.infoText}>
              Email: testuser@example.com{'\n'}
              Password: password123
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  toggleButton: {
    padding: 8,
  },
  toggleText: {
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  registerText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
});
