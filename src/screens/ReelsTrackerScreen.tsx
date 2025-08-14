import React from 'react';
import { View, Text } from 'react-native';
import { useReelsTracker } from '../hooks/useReelsTracker';
import { StatusCard } from '../components/StatusCard';
import { TimeStats } from '../components/TimeStats';
import { PermissionCard } from '../components/PermissionCard';

const ReelsTrackerScreen = () => {
  const {
    reelsStatus,
    currentSessionTime,
    totalTimeSpent,
    hasAccessibilityPermission,
    hasOverlayPermission,
    isMonitoring,
    formatTime,
    requestAccessibilityPermission,
    requestOverlayPermission
  } = useReelsTracker();

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-5 text-center pt-5">Reels Monitor</Text>
      <StatusCard status={reelsStatus} isMonitoring={isMonitoring} />
      <TimeStats
        currentSessionTime={currentSessionTime}
        totalTimeSpent={totalTimeSpent}
        formatTime={formatTime}
      />
      <View className="mb-5 mx-4 p-4 bg-white rounded-xl shadow">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Permissions:</Text>
        <PermissionCard
          title="Accessibility Service"
          granted={hasAccessibilityPermission}
          onRequest={requestAccessibilityPermission}
        />
        <PermissionCard
          title="Overlay Permission"
          granted={hasOverlayPermission}
          onRequest={requestOverlayPermission}
        />
      </View>
    </View>
  );
};

export default ReelsTrackerScreen;
