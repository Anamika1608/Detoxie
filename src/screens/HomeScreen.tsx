import React from 'react';
import { View, Text, Image, ScrollView, SafeAreaView } from 'react-native';
import ActionCard from '../components/ActionCard'; 
import home from "../assets/illustrations/home.png";
import { ThemedText } from '../ui/ThemedText';
import homeScreen from "../assets/vectors/homeScreen.png"
import { useNavigation } from '@react-navigation/native';

function HomeScreen() {
    const navigation = useNavigation();

    const handleSetTimer = () => {
        navigation.navigate('SetTimer');
        // Handle set timer action
        console.log('Set timer pressed');
    };

    const handleAddTodo = () => {
        // Handle add to-do action
        console.log('Add to-do pressed');
    };

    const handleCreateDream = () => {
        // Handle create dream/vision board action
        console.log('Create dream vision pressed');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FBF7EF]">
            <ScrollView className="flex-1">
                <Image
                    source={homeScreen}
                    className="absolute -top-56 -left-60 scale-[0.4] rotate-12 shadow-sm"
                    resizeMode="cover"
                />
                
                {/* Main content */}
                <View className="flex-1 pt-12 px-4">
                    {/* Header text */}
                    <View className="mb-1 px-2 mr-0">
                        <ThemedText className="text-black text-4xl leading-10 mb-2 mx-4">
                            Take control of your screen time to stay productive.
                        </ThemedText>
                    </View>

                    {/* Illustration */}
                    <View className="items-end mb-12 pr-0">
                        <Image
                            source={home}
                            className="w-64 h-48"
                            resizeMode="contain"
                        />
                    </View>

                    {/* Action Cards */}
                    <View className="flex-1 gap-4">
                        <ActionCard
                            title="Set timer"
                            description="Set your limit for scrolling. Once the time's up, we'll remind you of what truly matters."
                            backgroundColor="#faf393" 
                            onPress={handleSetTimer}
                        />

                        <ActionCard
                            title="Add to-do"
                            description="Stay focused. Enter tasks that need your attention once your social break ends."
                            backgroundColor="#f2d2ac"
                            onPress={handleAddTodo}
                        />

                        <ActionCard
                            title="Dream Vision"
                            description="Add photos and goals that inspire you to achieve your dreams."
                            backgroundColor="#a6a5d4"
                            onPress={handleCreateDream}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;