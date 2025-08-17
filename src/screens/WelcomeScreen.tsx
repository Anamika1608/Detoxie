import React from 'react';
import { View, Text, StatusBar, Image } from 'react-native';
import welcome from "../assets/illustrations/welcome.png";
import topBlob from "../assets/vectors/topBlob.png";
import bottomLeftBlob from "../assets/vectors/bottomLeftBlob.png";
import CustomButton from '../ui/CustomButton';

const DetoxieWelcomeScreen: React.FC = () => {
  const handleGetStarted = () => {
    console.log("hey")
  }

  return (
    <View className="flex-1 bg-[#FBF7EF] items-center justify-center relative">

      <Image
        source={topBlob}
        className="absolute -top-44 -left-60 scale-[0.4] rotate-12 shadow-sm"
        resizeMode="contain"
      />

      <View
        className="absolute top-24 right-7 w-[130px] h-[130px] bg-[#FFBF75] rounded-full"
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

      <Text className='text-xl text-center mt-5 text-[#4C4B7E]'
        style={{ fontFamily: 'DMSans-SemiBold' }}>
        A step towards a healthier digital life.
      </Text>

      <CustomButton onPress={handleGetStarted} title='Get Started' className='mt-10'/>

    </View>
  );
};

export default DetoxieWelcomeScreen;