import React from 'react';
import { View, Image } from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import instagramIcon from '../assets/icons/instagram.png';
import youtubeShortsIcon from '../assets/icons/youtube-shorts.png';

interface PlatformCardProps {
  name: string;
  color: string;
  usedSeconds: number;
  totalLimit: number;
  percentage: number;
  platformKey?: 'instagram' | 'youtube';
}

const PLATFORM_ICONS = {
  instagram: instagramIcon,
  youtube: youtubeShortsIcon,
} as const;

export const PlatformCard: React.FC<PlatformCardProps> = ({
  name,
  color,
  usedSeconds,
  percentage,
  platformKey,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const clampedPercentage = Math.min(percentage, 1);
  const iconSource = platformKey ? PLATFORM_ICONS[platformKey] : null;

  return (
    <View
      className="bg-transparent border-[2px] border-[#efe5d3] rounded-2xl p-4 mb-4 flex-row items-center"
    >
      {/* Icon at start, y-centered */}
      {iconSource && (
        <View className="mr-3" style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={iconSource}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Middle: name + time used */}
      <View className="flex-1">
        <ThemedText className="text-lg font-semibold text-gray-800">
          {name}
        </ThemedText>
        <ThemedText className="text-sm text-gray-500 mt-1">
          {formatTime(usedSeconds)} used
        </ThemedText>
      </View>

      {/* Percentage at end, y-centered */}
      <ThemedText
        className="text-lg font-semibold"
        
      >
        {Math.round(clampedPercentage * 100)}%
      </ThemedText>
    </View>
  );
};
