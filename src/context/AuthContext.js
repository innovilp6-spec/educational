/**
 * Authentication Context
 * Manages user authentication state across the entire application
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  // Initialize auth state from storage on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('[AUTH-CONTEXT] Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    user,
    isLoading,
    isSignout,
    
    /**
     * Login user and save to context & storage
     */
    login: async (userData) => {
      try {
        setUser(userData);
        console.log('[AUTH-CONTEXT] Logging in user:', userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('[AUTH-CONTEXT] User logged in:', userData.userId);
        return { success: true };
      } catch (error) {
        console.error('[AUTH-CONTEXT] Login error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Register user and save to context & storage
     */
    register: async (userData) => {
      try {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        console.log('[AUTH-CONTEXT] User registered:', userData.userId);
        return { success: true };
      } catch (error) {
        console.error('[AUTH-CONTEXT] Register error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Logout user and clear storage
     */
    logout: async () => {
      try {
        setIsSignout(true);
        setUser(null);
        await AsyncStorage.removeItem('user');
        console.log('[AUTH-CONTEXT] User logged out');
        return { success: true };
      } catch (error) {
        console.error('[AUTH-CONTEXT] Logout error:', error);
        return { success: false, error: error.message };
      } finally {
        setIsSignout(false);
      }
    },

    /**
     * Update user profile
     */
    updateUser: async (updates) => {
      try {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('[AUTH-CONTEXT] User profile updated');
        return { success: true };
      } catch (error) {
        console.error('[AUTH-CONTEXT] Update error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => user !== null && user !== undefined,

    /**
     * Get user's email (for API headers)
     */
    getUserEmail: () => user?.email || null,

    getUserName: () => user?.name || null,

    getUserGrade: () => user?.educationStandard || null,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use Auth Context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
