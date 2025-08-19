import React from 'react';
import {
  View,
  TouchableOpacity
} from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { PermissionModal } from './PermissionModal';
import { PermissionType } from '../types';
import usePermissionTracker from '../hooks/usePermissionTracker'; 

interface PermissionCardProps {
  title: string;
  granted: boolean;
  onRequest: () => Promise<void>;
  permissionType: PermissionType;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  title,
  granted,
  onRequest,
  permissionType,
}) => {
  const {
    showPermissionModal,
    permissionModalType,
    handlePermissionModalProceed,
    handlePermissionModalCancel
  } = usePermissionTracker();

  const isModalVisible = showPermissionModal && permissionModalType === permissionType;

  const handleRequestPress = () => {
    onRequest(); 
  };

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <ThemedText className="text-lg text-[#4C4B7E] flex-1 mr-3">
          {title}
        </ThemedText>
        {!granted && (
          <TouchableOpacity
            className="bg-[#4C4B7E] px-4 py-2 rounded-xl"
            onPress={handleRequestPress}
          >
            <ThemedText className="text-white text-sm font-medium">
              Request
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ThemedText className={`text-sm font-medium ${granted ? 'text-emerald-500' : 'text-red-500'}`}>
        {granted ? 'Granted' : 'Not Granted'}
      </ThemedText>

      <PermissionModal
        visible={isModalVisible}
        permissionType={permissionType}
        onCancel={handlePermissionModalCancel}
        onProceed={handlePermissionModalProceed}
      />
    </View>
  );
};