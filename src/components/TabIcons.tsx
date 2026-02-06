import React from 'react';
import { View } from 'react-native';

interface TabIconProps {
  color: string;
  size: number;
}

export const HomeIcon: React.FC<TabIconProps> = ({ color, size }) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* House roof */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.45,
          borderRightWidth: size * 0.45,
          borderBottomWidth: size * 0.35,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          marginBottom: -2,
        }}
      />
      {/* House body */}
      <View
        style={{
          width: size * 0.7,
          height: size * 0.45,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
};

export const StatsIcon: React.FC<TabIconProps> = ({ color, size }) => {
  const barWidth = size * 0.18;
  const gap = size * 0.08;

  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: size * 0.1,
      }}
    >
      {/* Bar 1 - short */}
      <View
        style={{
          width: barWidth,
          height: size * 0.35,
          backgroundColor: color,
          borderRadius: 2,
          marginRight: gap,
        }}
      />
      {/* Bar 2 - tall */}
      <View
        style={{
          width: barWidth,
          height: size * 0.65,
          backgroundColor: color,
          borderRadius: 2,
          marginRight: gap,
        }}
      />
      {/* Bar 3 - medium */}
      <View
        style={{
          width: barWidth,
          height: size * 0.5,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
};
