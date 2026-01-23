import * as React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePermissionStore } from './src/store/PermissionStore';
import HomeScreen from './src/screens/HomeScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ReelsTrackerScreen from './src/screens/ReelsTrackerScreen';
import PermissionScreen from './src/screens/PermissionScreen';
import SetTimerScreen from './src/screens/SetTimerScreen';
import AddTodoScreen from './src/screens/AddToDo';
import AddDreamVision from './src/screens/AddDreamVision';

type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Permission: undefined;
  SetTimer: undefined;
  AddToDo: undefined;
  AddDreamVision: undefined;
  ReelsTracker: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import "./global.css";

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const hasAccessibilityPermission = usePermissionStore((state) => state.hasAccessibilityPermission);
  const hasOverlayPermission = usePermissionStore((state) => state.hasOverlayPermission);
  const initialize = usePermissionStore((state) => state.initialize);

  const [didInit, setDidInit] = React.useState(false);

  const bothPermissionsGranted = hasAccessibilityPermission && hasOverlayPermission;

  React.useEffect(() => {
    (async () => {
      await initialize();
      setDidInit(true);
    })();
  }, [initialize]);

  React.useEffect(() => {
    if (!didInit) return;
    if (!navigationRef.isReady()) return;
    if (bothPermissionsGranted) return;

    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute !== 'Permission' && currentRoute !== 'Welcome') {
      navigationRef.navigate('Permission');
    }
  }, [bothPermissionsGranted, didInit, navigationRef]);

  if (!didInit) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
          <StatusBar backgroundColor="white" barStyle="dark-content" translucent />
          <ActivityIndicator size="large" color="#5865F2" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <Stack.Navigator
          key={bothPermissionsGranted ? 'authed' : 'onboard'}
          initialRouteName={bothPermissionsGranted ? "Home" : "Welcome"}
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
    </SafeAreaProvider>
  );
}