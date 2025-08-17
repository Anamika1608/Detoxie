import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ui/ThemedText';

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
    <View className="flex-row items-center justify-between mb-1">
      <ThemedText className="text-lg text-[#4C4B7E] flex-1 mr-3">{title}</ThemedText>
      {!granted && (
        <TouchableOpacity 
          className="bg-[#4C4B7E] px-4 py-2 rounded-xl" 
          onPress={onRequest}
        >
          <ThemedText className="text-white text-sm font-medium">Request</ThemedText>
        </TouchableOpacity>
      )}
    </View>
    <ThemedText className={`text-sm font-medium ${granted ? 'text-emerald-500' : 'text-red-500'}`}>
      {granted ? 'Granted' : 'Not Granted'}
    </ThemedText>
  </View>
);