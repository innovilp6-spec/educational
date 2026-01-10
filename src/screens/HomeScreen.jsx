import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, marginBottom: 24 }}>
        Accessibility Study App
      </Text>

      <PrimaryButton
        title="Capture a Lecture"
        onPress={() => navigation.navigate('LectureCapture')}
      />
      <PrimaryButton
        title="My Recordings"
        onPress={() => navigation.navigate('RecordingsList')}
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
        onPress={() => navigation.navigate('BookReading')}
      />

      <PrimaryButton
        title="Sugamya Pustakalaya"
        onPress={() => navigation.navigate('Sugamya')}
      />
    </View>
  );
}
