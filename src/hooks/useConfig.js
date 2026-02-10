import { useSelector, useDispatch } from 'react-redux';
import {
  setServicePreferences,
  updateServicePreference,
  setUserConfig,
  resetConfig,
} from '../store/slices/configSlice';

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

    // Action dispatchers
    setServicePreferences: (prefs) =>
      dispatch(setServicePreferences(prefs)),
    updateServicePreference: (preference, value) =>
      dispatch(updateServicePreference({ preference, value })),
    setUserConfig: (configData) =>
      dispatch(setUserConfig(configData)),
    resetConfig: () => dispatch(resetConfig()),
  };
};

export default useConfig;
