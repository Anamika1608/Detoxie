import React, { useEffect } from 'react';
import { View, SafeAreaView, ScrollView, Text } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import { CircularProgress } from '../components/CircularProgress';
import { PlatformCard } from '../components/PlatformCard';
import { useContentTracker } from '../hooks/useContentTracker';
import { usePermissionStore } from '../store/PermissionStore';

const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram Reels',
    color: '#A435B4',
  },
  youtube: {
    name: 'YouTube Shorts',
    color: '#F40202',
  },
};

function PlatformStatsScreen() {
  const { platformStats, loadPlatformStats } = useContentTracker();
  const { overlayConfig } = usePermissionStore();

  const limitMinutes = overlayConfig.timerMinutes || 5;
  const limitSeconds = limitMinutes * 60;

  // Raw time spent
  const rawTotalTimeSpent = (platformStats.instagram || 0) + (platformStats.youtube || 0);

  // Cap total time at limit (don't show overflow)
  const totalTimeSpent = Math.min(rawTotalTimeSpent, limitSeconds);
  const remainingSeconds = Math.max(0, limitSeconds - rawTotalTimeSpent);
  const overallProgress = Math.min(rawTotalTimeSpent / limitSeconds, 1);

  // Cap individual platform times proportionally if total exceeds limit
  const cappedInstagram = rawTotalTimeSpent > limitSeconds
    ? Math.round((platformStats.instagram || 0) / rawTotalTimeSpent * limitSeconds)
    : (platformStats.instagram || 0);
  const cappedYoutube = rawTotalTimeSpent > limitSeconds
    ? Math.round((platformStats.youtube || 0) / rawTotalTimeSpent * limitSeconds)
    : (platformStats.youtube || 0);

  useEffect(() => {
    loadPlatformStats();
  }, [loadPlatformStats]);

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return { mins, secs };
  };

  const remaining = formatTimeDisplay(remainingSeconds);
  const used = formatTimeDisplay(totalTimeSpent);

  return (
    <SafeAreaView className="flex-1 bg-[#FBF7EF]">
      <ScrollView className="flex-1 px-8">
        {/* Header - Left aligned with YoungSerif font */}
        <View className="mt-8 mb-10">
          <Text
            className="text-3xl text-black"
            style={{ fontFamily: 'YoungSerif-Regular' }}
          >
            Platform Stats
          </Text>
        </View>

        {/* Overall Progress Circle */}
        <View className="items-center mb-10">
          <CircularProgress
            variant="large"
            progress={overallProgress}
            progressColor="#4C4B7E"
            showProgress={true}
          >
            <View className="items-center">
              <ThemedText className="text-5xl font-bold text-[#4C4B7E]">
                {remaining.mins}
              </ThemedText>
              <ThemedText className="text-base text-gray-500 -mt-1">
                mins left
              </ThemedText>
            </View>
          </CircularProgress>

          <ThemedText className="text-sm text-gray-500 mt-4">
            {overallProgress >= 1
              ? `Limit reached (${limitMinutes} min)`
              : `${limitMinutes} min limit`}
          </ThemedText>
        </View>

        {/* Platform Breakdown */}
        <View className="mb-6">
          <ThemedText
            className="text-xl text-[#4C4B7E] mb-4"
          >
            Breakdown by Platform
          </ThemedText>

          <PlatformCard
            name={PLATFORM_CONFIG.instagram.name}
            color={PLATFORM_CONFIG.instagram.color}
            usedSeconds={cappedInstagram}
            totalLimit={limitSeconds}
            percentage={Math.min(cappedInstagram / limitSeconds, 1)}
            platformKey="instagram"
          />

          <PlatformCard
            name={PLATFORM_CONFIG.youtube.name}
            color={PLATFORM_CONFIG.youtube.color}
            usedSeconds={cappedYoutube}
            totalLimit={limitSeconds}
            percentage={Math.min(cappedYoutube / limitSeconds, 1)}
            platformKey="youtube"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default PlatformStatsScreen;
