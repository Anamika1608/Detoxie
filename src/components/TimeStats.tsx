import React from 'react';
import { View, Text } from 'react-native';

export const TimeStats = ({
  currentSessionTime,
  totalTimeSpent,
  formatTime
}: {
  currentSessionTime: number;
  totalTimeSpent: number;
  formatTime: (s: number) => string;
}) => (
  <View className="mb-5 mx-4 p-4 bg-white rounded-xl shadow">
    <View className="flex-row justify-between py-2 border-b border-gray-200">
      <Text className="text-sm text-gray-500 font-medium">Current Session:</Text>
      <Text className="text-base text-gray-800 font-semibold">{formatTime(currentSessionTime)}</Text>
    </View>
    <View className="flex-row justify-between py-2 border-b border-gray-200">
      <Text className="text-sm text-gray-500 font-medium">Total Time Spent:</Text>
      <Text className="text-base text-gray-800 font-semibold">{formatTime(totalTimeSpent)}</Text>
    </View>
  </View>
);
