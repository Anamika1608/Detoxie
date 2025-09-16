import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { usePermissionStore } from './src/store/PermissionStore';
import HomeScreen from './src/screens/HomeScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ReelsTrackerScreen from './src/screens/ReelsTrackerScreen';
import PermissionScreen from './src/screens/PermissionScreen';
import SetTimerScreen from './src/screens/SetTimerScreen'
import AddTodoScreen from './src/screens/AddToDo'
import AddDreamVision from './src/screens/AddDreamVision'

const Stack = createNativeStackNavigator();

import "./global.css";

export default function App() {
  const { updateOverlayConfig, applyOverlayTheme } = usePermissionStore();

  React.useEffect(() => {
    // Configure overlay on app startup
    // Option 1: Apply a preset theme
    applyOverlayTheme('purple'); // or 'green', 'orange', 'red', 'blue', 'minimal'
    
    // Option 2: Or use custom configuration
    // updateOverlayConfig({
    //   backgroundColor: '#FF6B6B',
    //   title: 'Time to step away\nfrom the screen! 📱',
    //   buttonText: 'Take a break',
    // });
  }, []);

  return (
    <NavigationContainer>
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Permission" component={PermissionScreen} />
        <Stack.Screen name="SetTimer" component={SetTimerScreen} />
        <Stack.Screen name="AddToDo" component={AddTodoScreen} />
        <Stack.Screen name="AddDreamVision" component={AddDreamVision} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}