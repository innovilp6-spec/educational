import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import LectureCaptureScreen from '../screens/LectureCaptureScreen';
import StudyLibraryScreen from '../screens/StudyLibraryScreen';
import BookReadingScreen from '../screens/BookReadingScreen';
import SugamyaLibraryScreen from '../screens/SugamyaLibraryScreen';
import ExportScreen from '../screens/ExportScreen';
import TranscribingScreen from '../screens/TranscribingScreen';
import TranscriptScreen from '../screens/TranscriptScreen';
import ErrorScreen from '../screens/ErrorScreen';
import NameSessionScreen from '../screens/NameSessionScreen';
import TranscriptViewerScreen from '../screens/TranscriptViewerScreen';
import RecordingsListScreen from '../screens/RecordingsListScreen';
import AgenticCoachScreen from '../screens/AgenticCoachScreen';
import AgenticNotesScreen from '../screens/AgenticNotesScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="LectureCapture" component={LectureCaptureScreen} />
            <Stack.Screen name="StudyLibrary" component={StudyLibraryScreen} />
            <Stack.Screen name="BookReading" component={BookReadingScreen} />
            <Stack.Screen name="Sugamya" component={SugamyaLibraryScreen} />
            <Stack.Screen name="Export" component={ExportScreen} />
            <Stack.Screen name="Transcribing" component={TranscribingScreen} />
            <Stack.Screen name="Transcript" component={TranscriptScreen} />
            <Stack.Screen name="Error" component={ErrorScreen} />
            <Stack.Screen name="NameSession" component={NameSessionScreen} />
            <Stack.Screen name="TranscriptViewer" component={TranscriptViewerScreen} />
            <Stack.Screen name="RecordingsList" component={RecordingsListScreen} />
            <Stack.Screen
                name="AgenticCoach"
                component={AgenticCoachScreen}
                options={{
                    title: 'Study with Coach',
                }}
            />
            <Stack.Screen
                name="Notes"
                component={AgenticNotesScreen}
                options={{
                    title: 'Agentic Notes',
                }}
            />
        </Stack.Navigator>
    );
}
