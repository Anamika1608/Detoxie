import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  variant?: 'small' | 'large';
  progress: number;
  progressColor: string;
  backgroundColor?: string;
  showProgress?: boolean; 
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  variant = 'large',
  progress,
  progressColor,
  backgroundColor = '#E5E5E5',
  showProgress = true,
  children,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const isLarge = variant === 'large';

  const outerSize = isLarge ? 200 : 50;
  const strokeWidth = isLarge ? 12 : 4;

  const radius = (outerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Purple arc represents time spent (progress), gray is remaining
  const strokeDashoffset = circumference * (1 - clampedProgress);

  const innerSize = outerSize - strokeWidth * 2;

  return (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={outerSize} height={outerSize}>
        {/* Full gray ring (remaining time track) */}
        <Circle
          cx={outerSize / 2}
          cy={outerSize / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Purple progress arc (time spent) */}
        {showProgress && clampedProgress > 0 && (
          <Circle
            cx={outerSize / 2}
            cy={outerSize / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            // Start from top (12 o'clock) and go clockwise
            transform={`rotate(-90 ${outerSize / 2} ${outerSize / 2})`}
          />
        )}
      </Svg>

      {/* Center content area */}
      <View
        style={{
          position: 'absolute',
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: '#FBF7EF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
};
