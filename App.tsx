import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ReelsTrackerScreen from './src/screens/ReelsTrackerScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { verifyInstallation } from 'nativewind';
import "./global.css"

const App: React.FC = () => {
  const result = verifyInstallation();
  console.log('NativeWind verifyInstallation:', result);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent />
      <WelcomeScreen />
      {/* <ReelsTrackerScreen /> */}
    </SafeAreaView>
  );
};

export default App;