
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as ReduxProvider } from 'react-redux';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { VoiceProvider } from './src/context/VoiceContext';
import store from './src/store';

const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <VoiceProvider>
          <NavigationContainer>
            <View style={{ flex: 1 }}>
              <AppNavigator />
            </View>
          </NavigationContainer>
        </VoiceProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
