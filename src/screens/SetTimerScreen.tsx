import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { ThemedText } from '../ui/ThemedText'
import CustomButton from '../ui/CustomButton'
import Slider from '@react-native-community/slider'
import LinearGradient from 'react-native-linear-gradient'
import { dbHelper } from '../database'

function SetTimerScreen() {
    const [timerValue, setTimerValue] = useState(10)
    const [saveStatus, setSaveStatus] = useState('idle')

    useEffect(() => {
        const init = async () => {
            await dbHelper.initializeDatabase()
            const saved = await dbHelper.getTimerMinutes()
            if (typeof saved === 'number') {
                const roundedValue = Math.round(Math.max(saved, 5) / 5) * 5
                setTimerValue(roundedValue)
            }
        }
        init()
    }, [])

    const handleSliderChange = (value) => {
        const roundedValue = Math.round(value / 5) * 5
        setTimerValue(roundedValue)
    }

    const handleSetTimer = async () => {
        setSaveStatus('saving')
        try {
            await dbHelper.setTimerMinutes(timerValue)
            setSaveStatus('saved')

            setTimeout(() => {
                setSaveStatus('idle')
            }, 500)
        } catch (error) {
            console.error('Error saving timer:', error)
            setSaveStatus('idle')
        }
    }

    return (
        <View className='flex-1 bg-[#FBF7EF] px-6'>
            {/* Header */}
            <Text
                className='text-3xl text-center mt-16 text-[#4C4B7E]'
                style={{ fontFamily: 'YoungSerif-Regular' }}
            >
                Set timer
            </Text>

            <ThemedText className='text-lg text-center mt-4 text-gray-600 px-4'>
                Once the timer runs out, we'll remind you to focus on what truly matters.
            </ThemedText>

            {/* Timer Circle Display */}
            <View className='flex-1 justify-center items-center mt-8'>
                {/* Outer White Circle */}
                <View
                    className='bg-white rounded-full justify-center items-center shadow-lg'
                    style={{
                        width: 200,
                        height: 200,
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, y: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    }}
                >
                    {/* Inner Orange Circle */}
                    <LinearGradient
                        colors={['#FFBF75', '#f7d7b2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: 180,
                            height: 180,
                            borderRadius: 90,
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Inner Shadow Border */}
                        <View
                            style={{
                                position: 'absolute',
                                width: 180,
                                height: 180,
                                borderRadius: 90,
                                borderWidth: 4,
                                borderColor: 'rgba(0,0,0,0.10)',
                            }}
                        />

                        {/* Timer Value Display */}
                        <ThemedText
                            className="text-5xl font-bold text-black"
                            style={{ fontWeight: '800' }}
                        >
                            {timerValue}
                        </ThemedText>
                        <ThemedText className="text-lg text-black font-medium">mins</ThemedText>
                    </LinearGradient>
                </View>

                {/* Save Status Message */}
                {saveStatus === 'saved' && (
                    <View className='mt-4 bg-green-100 px-4 py-2 rounded-2xl'>
                        <ThemedText className='text-green-700 font-medium'>
                            Timer saved successfully!
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Slider Container */}
            <View className='mb-8 px-4'>
                {/* Slider */}
                <Slider
                    style={{
                        width: '100%',
                        height: 50,
                        marginVertical: 8,
                    }}
                    minimumValue={5}
                    maximumValue={45}
                    value={timerValue}
                    onValueChange={handleSliderChange}
                    step={5}
                    minimumTrackTintColor="#4C4B7E"
                    maximumTrackTintColor="#a6a9ad"
                    thumbTintColor="#4C4B7E"
                />

                <View className='flex-row justify-between -mt-3' style={{ paddingHorizontal: 12 }}>
                    <ThemedText className='text-gray-600 text-sm'>5 </ThemedText>
                    <ThemedText className='text-gray-600 text-sm'>45 </ThemedText>
                </View>
            </View>

            {/* Continue Button */}
            <View className='mb-8'>
                <CustomButton
                    onPress={handleSetTimer}
                    title='Save'
                    className='bg-black'
                />
            </View>
        </View>
    )
}

export default SetTimerScreen