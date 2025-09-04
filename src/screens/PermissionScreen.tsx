import React from 'react'
import { View, SafeAreaView, ScrollView, Image } from 'react-native'
import { PermissionCard } from '../components/PermissionCard'
import usePermissionTracker from '../hooks/usePermissionTracker';
import permissions from "../assets/illustrations/permissions.png";
import roughCircle from "../assets/vectors/roughCircle.png";
import CustomButton from '../ui/CustomButton';
import { ThemedText } from '../ui/ThemedText';
import { useNavigation } from '@react-navigation/native';

function PermissionScreen() {
    const navigation = useNavigation();

    const {
        hasAccessibilityPermission,
        hasOverlayPermission,
        requestAccessibilityPermission,
        requestOverlayPermission,
    } = usePermissionTracker();

    const bothPermissionsGranted = hasAccessibilityPermission && hasOverlayPermission;

    const handleContinue = () => {
        navigation.navigate('Home');
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FBF7EF]">
            <View
                className="absolute top-3 right-5 w-[17px] h-[17px] bg-[#FFBF75] rounded-full"
            />
            <View className="absolute top-8 right-10 w-[44px] h-[44px]">
                {/* Orange background circle */}
                <View className="w-full h-full bg-[#FFBF75] rounded-full" />

                {/* Rough circle image on top */}
                <Image
                    source={roughCircle}
                    className="absolute w-[44px] h-[44px] left-3 top-2"
                    resizeMode="contain"
                />
            </View>

            {/* <View className="absolute bg-[#F2E9D3] -right-32 -left-56 top-16 rounded-t-full h-full" /> */}

            {/* Main content area */}
            <View className="flex-1">
                {/* Scrollable content */}
                <ScrollView className="flex-1 px-6 pt-8">
                    {/* Header text */}
                    <View className="mt-20">
                        <ThemedText className="text-black text-3xl leading-tight">
                            For the best detox{'\n'}experience, we need a few permissions!
                        </ThemedText>
                    </View>

                    {/* Permission cards container */}
                    <View className="mt-5 mb-6">
                        <PermissionCard
                            title="Accessibility Service"
                            permissionType="accessibility"
                            granted={hasAccessibilityPermission}
                            onRequest={requestAccessibilityPermission}
                        />
                        <PermissionCard
                            title="Overlay Permission"
                            permissionType="overlay"
                            granted={hasOverlayPermission}
                            onRequest={requestOverlayPermission}
                        />
                    </View>
                </ScrollView>

                {/* Bottom fixed content */}
                <View className="px-6 pb-6">
                    <Image
                        source={permissions}
                        className="self-center mb-4"
                        resizeMode="contain"
                    />

                    <CustomButton
                        onPress={handleContinue}
                        title='Allow & Continue'
                        className='mt-0'
                        disabled={!bothPermissionsGranted}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

export default PermissionScreen