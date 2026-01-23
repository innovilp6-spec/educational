import { PermissionsAndroid, Platform } from 'react-native';

export async function requestMicPermission() {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message:
          'This app needs access to your microphone to record lectures.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Mic permission error:', err);
    return false;
  }
}

export async function requestReadExternalStoragePermission() {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message:
          'This app needs access to your storage to read audio files for lecture simulation.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Storage permission error:', err);
    return false;
  }
}
