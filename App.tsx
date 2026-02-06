import * as React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View } from 'react-native';
import { usePermissionStore } from './src/store/PermissionStore';
import HomeScreen from './src/screens/HomeScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PermissionScreen from './src/screens/PermissionScreen';
import SetTimerScreen from './src/screens/SetTimerScreen';
import AddTodoScreen from './src/screens/AddToDo';
import AddDreamVision from './src/screens/AddDreamVision';
import PlatformStatsScreen from './src/screens/PlatformStatsScreen';
import { HomeIcon, StatsIcon } from './src/components/TabIcons';

import "./global.css";

type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  Permission: undefined;
  SetTimer: undefined;
  AddToDo: undefined;
  AddDreamVision: undefined;
};

type TabParamList = {
  Home: undefined;
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FBF7EF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingTop: 4,
          paddingBottom: 8,
          height: 56,
        },
        tabBarActiveTintColor: '#4C4B7E',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={PlatformStatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <StatsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

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
      <View style={{ flex: 1, backgroundColor: '#FBF7EF' }}>
        <StatusBar backgroundColor="#FBF7EF" barStyle="dark-content" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar backgroundColor="#FBF7EF" barStyle="dark-content" />

      <Stack.Navigator
        key={bothPermissionsGranted ? 'authed' : 'onboard'}
        initialRouteName={bothPermissionsGranted ? "MainTabs" : "Welcome"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Permission" component={PermissionScreen} />
        <Stack.Screen name="SetTimer" component={SetTimerScreen} />
        <Stack.Screen name="AddToDo" component={AddTodoScreen} />
        <Stack.Screen name="AddDreamVision" component={AddDreamVision} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
