import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'small' | 'medium' | 'large';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  size = 'medium'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'w-10 h-6',
          thumb: 'w-5 h-5',
          thumbPosition: value ? 'translate-x-4' : 'translate-x-0'
        };
      case 'large':
        return {
          container: 'w-16 h-8',
          thumb: 'w-7 h-7',
          thumbPosition: value ? 'translate-x-8' : 'translate-x-0'
        };
      default: // medium
        return {
          container: 'w-12 h-7',
          thumb: 'w-6 h-6',
          thumbPosition: value ? 'translate-x-5' : 'translate-x-0'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      className={`${sizeClasses.container} rounded-full ${
        value ? 'bg-[#4C4B7E]' : 'bg-gray-300'
      } justify-center`}
      activeOpacity={0.8}
    >
      <View
        className={`${sizeClasses.thumb} ${sizeClasses.thumbPosition} rounded-full bg-white shadow-sm transition-transform duration-200`}
      />
    </TouchableOpacity>
  );
};
