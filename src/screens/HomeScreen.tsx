import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, SafeAreaView } from 'react-native';
import ActionCard from '../components/ActionCard'; 
import home from "../assets/illustrations/home.png";
import vacation from "../assets/illustrations/vacation.png";
import { ThemedText } from '../ui/ThemedText';
import homeScreen from "../assets/vectors/homeScreen.png"
import { useNavigation } from '@react-navigation/native';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { dbHelper } from '../database';
import { usePermissionStore } from '../store/PermissionStore';

function HomeScreen() {
    const navigation = useNavigation();
    const { isVacationMode, setVacationMode } = usePermissionStore();

    // Load vacation mode from storage on component mount
    useEffect(() => {
        const loadVacationMode = async () => {
            try {
                const vacationMode = await dbHelper.getVacationMode();
                await setVacationMode(vacationMode);
            } catch (error) {
                console.error('Error loading vacation mode:', error);
            }
        };
        loadVacationMode();
    }, [setVacationMode]);

    // Handle vacation mode toggle
    const handleVacationModeToggle = async (value: boolean) => {
        try {
            await dbHelper.setVacationMode(value);
            await setVacationMode(value);
        } catch (error) {
            console.error('Error saving vacation mode:', error);
        }
    };

    const handleSetTimer = () => {
        navigation.navigate('SetTimer');
        // Handle set timer action
        console.log('Set timer pressed');
    };

    const handleAddTodo = () => {
        // Handle add to-do action
        navigation.navigate('AddToDo');
        console.log('Add to-do pressed');
    };

    const handleCreateDream = () => {
        navigation.navigate('AddDreamVision');

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
                <View className="flex-1 pt-8 px-4">
                    {/* Vacation Mode Toggle and Header text */}
                    <View className="mb-1 px-2 mr-0">
                        <View className="flex-row items-center justify-between mb-4 mx-4">
                            <ThemedText className="text-lg text-[#4C4B7E] font-medium">
                                Vacation Mode
                            </ThemedText>
                        <ToggleSwitch
                            value={isVacationMode}
                            onValueChange={handleVacationModeToggle}
                        />
                        </View>
                        <ThemedText className="text-black text-4xl leading-10 mb-2 mx-4">
                            {isVacationMode 
                                ? "Go, touch some grass ;" 
                                : "Take control of your screen time to stay productive."
                            }
                        </ThemedText>
                    </View>

                    {isVacationMode ? (
                        /* Vacation Mode Content */
                        <View className="flex-1 items-center justify-center py-20">
                            <Image
                                source={vacation}
                                className="w-80 h-80"
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        /* Normal Mode Content */
                        <>
                            {/* Illustration */}
                            <View className="items-end mb-4 pr-0">
                                <Image
                                    source={home}
                                    className="w-72 h-48 scale-125"
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
                                    description="Stay inspired. Add photos that inspire you to achieve your dreams."
                                    backgroundColor="#a6a5d4"
                                    onPress={handleCreateDream}
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default HomeScreen;