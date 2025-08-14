import React from 'react';
import { View, Text } from 'react-native';

export const StatusCard = ({ status, isMonitoring }: { status: string; isMonitoring: boolean }) => (
  <View className="flex-row items-center mb-5 mx-4 p-4 bg-white rounded-xl shadow">
    <Text className="text-base font-semibold text-gray-700 mr-2">Status:</Text>
    <Text className={`text-base font-medium ${isMonitoring ? 'text-emerald-500' : 'text-red-500'}`}>
      {status}
    </Text>
  </View>
);
