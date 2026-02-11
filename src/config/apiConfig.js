/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// For React Native development on Android/iOS emulator
// Use 10.0.2.2 for Android emulator (maps to host machine's localhost)
// Use localhost for iOS simulator
// On physical device, use your machine's actual IP address

const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_BASE_URL = 'http://localhost:5000/api'; // iOS simulator
// const API_BASE_URL = 'http://YOUR_MACHINE_IP:5000/api'; // Physical device
export { API_BASE_URL };

export default {
  API_BASE_URL,
};