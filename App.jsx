
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigation/AppNavigator';
// enableScreens(true);

const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
