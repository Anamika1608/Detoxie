import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export const PermissionCard = ({
  title,
  granted,
  onRequest
}: {
  title: string;
  granted: boolean;
  onRequest: () => void;
}) => (
  <View className="mb-3">
    <Text className="text-sm text-gray-700 mb-1">{title}</Text>
    <View className="flex-row items-center justify-between">
      <Text className={`text-sm font-medium ${granted ? 'text-emerald-500' : 'text-red-500'}`}>
        {granted ? 'Granted' : 'Not Granted'}
      </Text>
      {!granted && (
        <TouchableOpacity className="bg-blue-500 px-4 py-1.5 rounded" onPress={onRequest}>
          <Text className="text-white text-xs font-medium">Request</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);
