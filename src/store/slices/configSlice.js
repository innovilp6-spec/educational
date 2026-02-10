import { createSlice } from '@reduxjs/toolkit';

/**
 * Config Slice
 * Manages application configuration including user service preferences
 * Preferences determine which features are available to the user
 */

const initialState = {
  servicePreferences: {
    recordingsLecture: false,
    captureBooks: false,
    voiceModality: false,
  },
  language: 'English',
  educationStandard: null,
  educationBoard: null,
  isLoading: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    /**
     * Set service preferences from login response
     */
    setServicePreferences: (state, action) => {
      state.servicePreferences = {
        recordingsLecture: action.payload.recordingsLecture || false,
        captureBooks: action.payload.captureBooks || false,
        voiceModality: action.payload.voiceModality || false,
      };
      state.error = null;
    },

    /**
     * Update individual service preference
     */
    updateServicePreference: (state, action) => {
      const { preference, value } = action.payload;
      if (state.servicePreferences.hasOwnProperty(preference)) {
        state.servicePreferences[preference] = value;
        state.error = null;
      } else {
        state.error = `Invalid preference: ${preference}`;
      }
    },

    /**
     * Set multiple user configuration settings
     */
    setUserConfig: (state, action) => {
      const {
        servicePreferences,
        language,
        educationStandard,
        educationBoard,
      } = action.payload;

      if (servicePreferences) {
        state.servicePreferences = {
          recordingsLecture: servicePreferences.recordingsLecture || false,
          captureBooks: servicePreferences.captureBooks || false,
          voiceModality: servicePreferences.voiceModality || false,
        };
      }
      if (language) state.language = language;
      if (educationStandard) state.educationStandard = educationStandard;
      if (educationBoard) state.educationBoard = educationBoard;
      state.error = null;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error
     */
    setError: (state, action) => {
      state.error = action.payload;
    },

    /**
     * Reset configuration to initial state
     */
    resetConfig: (state) => {
      state.servicePreferences = initialState.servicePreferences;
      state.language = initialState.language;
      state.educationStandard = initialState.educationStandard;
      state.educationBoard = initialState.educationBoard;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setServicePreferences,
  updateServicePreference,
  setUserConfig,
  setLoading,
  setError,
  resetConfig,
} = configSlice.actions;

export default configSlice.reducer;
