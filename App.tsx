import React from 'react';
import { SafeAreaView } from 'react-native';
import ReelsTrackerScreen from './src/screens/ReelsTrackerScreen';

const App: React.FC = () => {

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ReelsTrackerScreen />
    </SafeAreaView>
  );
};

export default App;