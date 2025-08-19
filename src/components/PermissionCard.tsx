import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  AppState,
  AppStateStatus
} from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { PermissionModal } from './PermissionModal';
import { PermissionType } from '../types';

interface PermissionCardProps {
  title: string;
  granted: boolean;
  onRequest: () => Promise<void>;
  permissionType: PermissionType;
  onPermissionChange?: (granted: boolean) => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  title,
  granted,
  onRequest,
  permissionType,
  onPermissionChange
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleRequestPress = () => {
    setShowModal(true);
  };

  const handleProceed = async () => {
    try {
      await onRequest();
      setShowModal(false);

      // Setup listener to check permissions when user returns
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // You can call a permission check function here
          // For now, we'll just close the modal
          setTimeout(() => {
            onPermissionChange?.(true); // Optimistically update - you should check actual permission
          }, 500);
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      // Clean up listener after 2 minutes
      setTimeout(() => {
        subscription?.remove();
      }, 120000);

    } catch (error) {
      console.error('Error requesting permission:', error);
      // Handle error - maybe show error message
    }
  };

  const handleCancel = () => {
    setShowModal(false);
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

      {/* Permission Modal */}
      <PermissionModal
        visible={showModal}
        permissionType={permissionType}
        onCancel={handleCancel}
        onProceed={handleProceed}
      />
    </View>
  );
};