import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import WelcomeScreen from './src/screens/WelcomeScreen';
import ReelsTrackerScreen from './src/screens/ReelsTrackerScreen';
import PermissionScreen from './src/screens/PermissionScreen';

const Stack = createNativeStackNavigator();

import "./global.css";

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={WelcomeScreen} />
        <Stack.Screen name="Permission" component={PermissionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
