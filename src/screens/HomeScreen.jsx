import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { getBookDetailById } from '../services/mockApiService';
import { useConfig } from '../hooks/useConfig';

export default function HomeScreen({ navigation }) {
  const handleOpenBookDetail = () => {
    // Get mock book data
    const mockBook = getBookDetailById('64a1b2c3d4e5f6g7h8i9j0k1');
    // Navigate directly to BookDetail with mock data
    navigation.navigate('BookDetail', {
      bookId: '64a1b2c3d4e5f6g7h8i9j0k1',
      mockData: mockBook,
    });
  };

  const { servicePreferences } = useConfig();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Accessibility Study App
      </Text>

      {/* Recording Lecture - Only show if recordingsLecture preference is enabled */}
      {servicePreferences.recordingsLecture && (
        <PrimaryButton
          title="Record a Lecture"
          onPress={() => navigation.navigate('LectureCapture')}
        />
      )}
      
      {/* My Recordings - Only show if recordingsLecture preference is enabled */}
      {servicePreferences.recordingsLecture && (
        <PrimaryButton
          title="My Recordings"
          onPress={() => navigation.navigate('RecordingsList')}
        />
      )}

      <PrimaryButton
        title="Coach (Ask Questions)"
        onPress={() => navigation.navigate('GeneralCoach')}
      />
      <PrimaryButton
        title="My Notes"
        onPress={() => navigation.navigate('Notes')}
      />

      {/* Read a Book - Only show if captureBooks preference is enabled */}
      {servicePreferences.captureBooks && (
        <PrimaryButton
          title="Read a Book"
          onPress={() => navigation.navigate('CapturedBooksLibrary')}
        />
      )}

      <PrimaryButton
        title="Sugamya Pustakalaya"
        onPress={() => navigation.navigate('Sugamya')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    marginBottom: 24,
    fontWeight: '600',
    color: '#000000',
  },
});
