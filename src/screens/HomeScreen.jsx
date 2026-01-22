import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { getBookDetailById } from '../services/mockApiService';

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

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, marginBottom: 24 }}>
        Accessibility Study App
      </Text>

      {/* DEBUG: Temporary button to test BookDetailScreen */}
      <PrimaryButton
        title="🧪 DEBUG: Open Book Detail"
        onPress={handleOpenBookDetail}
      />

      <PrimaryButton
        title="Capture a Lecture"
        onPress={() => navigation.navigate('LectureCapture')}
      />
      <PrimaryButton
        title="My Recordings"
        onPress={() => navigation.navigate('RecordingsList')}
      />
      <PrimaryButton
        title="Coach (Ask Questions)"
        onPress={() => navigation.navigate('GeneralCoach')}
      />
      <PrimaryButton
        title="My Notes"
        onPress={() => navigation.navigate('Notes')}
      />
      <PrimaryButton
        title="My Study Library"
        onPress={() => navigation.navigate('StudyLibrary')}
      />

      <PrimaryButton
        title="Read a Book"
        onPress={() => navigation.navigate('CapturedBooksLibrary')}
      />

      <PrimaryButton
        title="Sugamya Pustakalaya"
        onPress={() => navigation.navigate('Sugamya')}
      />
    </View>
  );
}
