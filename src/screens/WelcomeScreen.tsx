import React from 'react';
import { View, Text, StatusBar, Image } from 'react-native';
import welcome from "../assets/illustrations/welcome.png";
import topBlob from "../assets/vectors/topBlob.png";
import bottomLeftBlob from "../assets/vectors/bottomLeftBlob.png";
import CustomButton from '../ui/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../ui/ThemedText';

const DetoxieWelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const handleGetStarted = () => {
    navigation.navigate('Permission');
  }

  return (
    <View className="flex-1 bg-[#FBF7EF] items-center justify-center relative">

      <Image
        source={topBlob}
        className="absolute -top-56 -left-60 scale-[0.4] rotate-12 shadow-sm"
        resizeMode="contain"
      />

      <View
        className="absolute top-20 right-7 w-[130px] h-[130px] bg-[#FFBF75] rounded-full"
      />

      <Image
        source={bottomLeftBlob}
        className="absolute -bottom-48 -left-52 scale-[0.4] shadow-sm"
        resizeMode="contain"
      />


      {/* Main Illustration */}
      <Image
        source={welcome}
        className="w-[250px] h-[250px] mt-40"
        resizeMode="contain"
      />

      {/* Title */}
      <Text className="text-3xl text-center mt-6 text-[#4C4B7E] "
        style={{ fontFamily: 'YoungSerif-Regular' }}>
        Welcome to Detoxie
      </Text>

      <ThemedText className='text-xl text-center mt-5 text-[#4C4B7E]'>
        A step towards a healthier digital life.
      </ThemedText>

      <CustomButton onPress={handleGetStarted} title='Get Started' className='mt-10' />

    </View>
  );
};

export default DetoxieWelcomeScreen;