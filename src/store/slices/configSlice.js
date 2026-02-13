import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

/**
 * Config Slice
 * Manages application configuration including user service preferences
 * Preferences determine which features are available to the user
 */

/**
 * Async thunk to update service preferences on backend
 * Syncs preference changes with the server database
 * Redux state is the single source of truth, updated only after backend confirms
 */
export const updateServicePreferenceAsync = createAsyncThunk(
  'config/updateServicePreferenceAsync',
  async ({ userEmail, preference, value, currentPreferences }, { rejectWithValue }) => {
    try {
      // Build updated preferences object
      const updatedPreferences = {
        ...currentPreferences,
        [preference]: value,
      };

      // Call backend API to persist the change
      const response = await apiService.updateServicePreferences(
        userEmail,
        updatedPreferences
      );

      console.log('[CONFIG-SLICE] Preferences synced with backend:', response);

      return {
        preference,
        value,
        preferences: updatedPreferences,
      };
    } catch (error) {
      console.error('[CONFIG-SLICE] Error updating preferences:', error);
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

const initialState = {
  servicePreferences: {
    recordingsLecture: false,
    captureBooks: false,
    voiceModality: false,
    bionicText: false,
    simplification: false,
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
        bionicText: action.payload.bionicText || false,
        simplification: action.payload.simplification || false,
      };
      state.error = null;
      state.isLoading = false;
    },

    /**
     * Update individual service preference (local only, use async for backend)
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
          bionicText: servicePreferences.bionicText || false,
          simplification: servicePreferences.simplification || false,
        };
      }
      if (language) state.language = language;
      if (educationStandard) state.educationStandard = educationStandard;
      if (educationBoard) state.educationBoard = educationBoard;
      state.error = null;
      state.isLoading = false;
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
  extraReducers: (builder) => {
    builder
      // Handle updateServicePreferenceAsync
      .addCase(updateServicePreferenceAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateServicePreferenceAsync.fulfilled, (state, action) => {
        const { preference, value } = action.payload;
        state.servicePreferences[preference] = value;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateServicePreferenceAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update preferences';
      });
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
