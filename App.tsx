import { useColorScheme, View, Text } from 'react-native';
import "./global.css"

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold text-blue-500">
        Hey there
      </Text>
    </View>
  );
}

export default App;
