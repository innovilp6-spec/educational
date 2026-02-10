import { configureStore } from '@reduxjs/toolkit';
import configReducer from './slices/configSlice';

/**
 * Redux Store Configuration
 * Manages global application state including:
 * - Service preferences (recordingsLecture, captureBooks, voiceModality)
 * - User configuration (language, education standard, etc.)
 */

export const store = configureStore({
  reducer: {
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types if needed
        ignoredActions: [],
        // Ignore these field paths in all actions
        ignoredActionPaths: [],
        // Ignore these paths in the state
        ignoredPaths: [],
      },
    }),
});

export default store;
