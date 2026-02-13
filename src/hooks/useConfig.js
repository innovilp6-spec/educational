import { useSelector, useDispatch } from 'react-redux';
import {
  setServicePreferences,
  updateServicePreference,
  setUserConfig,
  resetConfig,
  updateServicePreferenceAsync,
} from '../store/slices/configSlice';
import { hash } from 'react-native-fs';

/**
 * Custom hook to access and manage user configuration and service preferences
 * Provides easy access to the config state and dispatch actions
 */
export const useConfig = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.config);

  return {
    // State accessors
    servicePreferences: config.servicePreferences,
    language: config.language,
    educationStandard: config.educationStandard,
    educationBoard: config.educationBoard,
    isLoading: config.isLoading,
    error: config.error,

    // Helper functions to check individual preferences
    hasRecordingsLecture: config.servicePreferences.recordingsLecture,
    hasCaptureBooks: config.servicePreferences.captureBooks,
    hasVoiceModality: config.servicePreferences.voiceModality,
    hasBionicText: config.servicePreferences.bionicText,

    // Action dispatchers
    setServicePreferences: (prefs) =>
      dispatch(setServicePreferences(prefs)),
    updateServicePreference: (userEmail, preference, value, currentPreferences) =>
      dispatch(updateServicePreferenceAsync({ userEmail, preference, value, currentPreferences })),
    setUserConfig: (configData) =>
      dispatch(setUserConfig(configData)),
    resetConfig: () => dispatch(resetConfig()),
  };
};

export default useConfig;
