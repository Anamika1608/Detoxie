import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, SafeAreaView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import dreamVision from "../assets/illustrations/dream.png";
import { ThemedText } from '../ui/ThemedText';
import { dbHelper } from '../database';
import { launchImageLibrary } from 'react-native-image-picker';
import CustomButton from '../ui/CustomButton';

const { width: screenWidth } = Dimensions.get('window');

function AddDreamVisionScreen() {
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                await dbHelper.initializeDatabase();
                const existing = await dbHelper.getDreamImageBase64();
                setImageBase64(existing);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const pickImage = useCallback(async () => {
        try {
            const res = await launchImageLibrary({
                mediaType: 'photo',
                includeBase64: true,
                selectionLimit: 1,
                quality: 0.8,
                fixOrientation: true,
                maxWidth: 800,
                maxHeight: 800,
            });

            if (res.didCancel) return;

            const asset = res.assets && res.assets[0];
            const base64 = asset?.base64;

            if (!base64) return;

            setLoading(true);
            await dbHelper.initializeDatabase();
            await dbHelper.setDreamImageBase64(base64);
            setImageBase64(base64);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to select image');
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteImage = useCallback(async () => {
        try {
            setLoading(true);
            await dbHelper.deleteDreamImage();
            setImageBase64(null);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to delete image');
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-[#FBF7EF]">
            {/* Header text */}
            <View className="pt-12 px-6">
                <ThemedText className="text-black text-3xl leading-10 mb-2" style={{ fontFamily: 'YoungSerif-Regular' }}>
                    Add your dream photo that inspires you.
                </ThemedText>
            </View>

            {/* Scrollable content */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Container */}
                <View className="items-center px-4">
                    {imageBase64 ? (
                        <View style={{ position: 'relative' }}>
                            <View className="bg-white rounded-2xl shadow-lg p-2" style={{
                                width: screenWidth - 48,
                                maxWidth: 320,
                            }}>
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                                    style={{
                                        width: '100%',
                                        aspectRatio: 1,
                                        borderRadius: 12,
                                    }}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Delete button */}
                            <TouchableOpacity
                                onPress={deleteImage}
                                disabled={loading}
                                className="absolute -top-2.5 -right-2.5 bg-blue-100 p-2 rounded-full w-10 h-10 justify-center items-center shadow-lg"
                            >
                                <Text className="text-black text-xl font-bold leading-5">
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Image
                            source={dreamVision}
                            className="w-[250px] h-[250px] scale-150"
                            resizeMode="contain"
                        />
                    )}
                </View>
            </ScrollView>

            {/* Button fixed at bottom */}
            <View className="px-4 pb-8 bg-[#FBF7EF]">
                <CustomButton
                    title={
                        imageBase64
                            ? (loading ? 'Saving...' : 'Change photo')
                            : (loading ? 'Saving...' : 'Upload first photo')
                    }
                    onPress={pickImage}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
    );
}

export default AddDreamVisionScreen;