import React from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Image
} from 'react-native';
import { ThemedText } from '../ui/ThemedText';
import orangeBlob from "../assets/vectors/lightOrangeBlob.png";
import { PermissionType } from '../types';

const { width } = Dimensions.get('window');

interface ModalContent {
  title: string;
  subtitle: string;
  description: string;
  steps: string[];
  icon: string;
}

interface PermissionModalProps {
  visible: boolean;
  permissionType: PermissionType;
  onCancel: () => void;
  onProceed: () => Promise<void>;
}

const getModalContent = (type: PermissionType): ModalContent => {
  switch (type) {
    case 'accessibility':
      return {
        title: 'Accessibility Permission',
        subtitle: 'Help Detoxie monitor your screen time',
        description: 'This permission allows Detoxie to track when you\'re using social media apps and help you stay focused.',
        steps: [
          'Tap "Open Settings" below',
          'Find "Detoxie" in the accessibility list',
          'Toggle the switch to ON',
          'Confirm in the dialog that appears',
          'Return to this app'
        ],
        icon: '🔒',
      };
    case 'overlay':
      return {
        title: 'Display Over Apps',
        subtitle: 'Allow Detoxie to show focus reminders',
        description: 'This permission lets Detoxie show blocking screens and reminders when you need to focus.',
        steps: [
          'Tap "Open Settings" below',
          'Find "Detoxie" and toggle ON',
          'Return to this app'
        ],
        icon: '📱',
      };
    default:
      return {
        title: '',
        subtitle: '',
        description: '',
        steps: [],
        icon: '',
      };
  }
};

const StepItem: React.FC<{ step: string; index: number }> = ({ step, index }) => (
  <View className="flex-row items-center mb-3">
    <View className="w-7 h-7 rounded-full items-center justify-center mr-3 bg-[#4C4B7E]">
      <ThemedText className="text-sm font-bold text-white">
        {index + 1}
      </ThemedText>
    </View>
    <ThemedText className="flex-1 text-sm leading-5 text-black">
      {step}
    </ThemedText>
  </View>
);

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  permissionType,
  onCancel,
  onProceed
}) => {
  const content = getModalContent(permissionType);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center "
      >
        {/* Background Overlay */}
        <TouchableOpacity
          className="absolute inset-0 bg-black/60"
          activeOpacity={1}
          onPress={onCancel}
        />

        {/* Modal Content */}
        <View
          className="mx-4 rounded-3xl shadow-2xl elevation-24 bg-[#FBF7EF]"
          style={{
            width: Math.min(width * 0.9, 400),
            maxHeight: '80%',
            overflow: 'hidden',
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
          >

            {/* <Image
              source={orangeBlob}
              className="absolute -top-80 -left-60 scale-[0.4] rotate-12 shadow-sm"
              resizeMode="contain"
            /> */}

            {/* Header */}
            <View className="items-center pt-8 px-6 pb-4">
              <ThemedText
                className="text-2xl text-center mb-2 text-black"
                style={{ fontFamily: 'YoungSerif-Regular' }}
              >
                {content.title}
              </ThemedText>
              <ThemedText className="text-base text-center opacity-80 text-gray-600">
                {content.subtitle}
              </ThemedText>
            </View>

            {/* Content */}
            <View className="px-6 pb-6">
              {/* Description */}
              <ThemedText className="text-base leading-6 text-center mb-6 text-black">
                {content.description}
              </ThemedText>

              {/* Steps */}
              <View>
                <ThemedText className="text-lg font-semibold mb-4 text-black">
                  Follow these steps:
                </ThemedText>
                {content.steps.map((step, index) => (
                  <StepItem
                    key={index}
                    step={step}
                    index={index}
                  />
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row px-6 pb-6 gap-3">
              <TouchableOpacity
                className="flex-1 py-4 rounded-xl border border-gray-300 items-center justify-center"
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <ThemedText className="text-base font-medium text-gray-600">
                  Not Now
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-4 rounded-xl items-center justify-center shadow-sm bg-[#4C4B7E]"
                onPress={onProceed}
                activeOpacity={0.8}
              >
                <ThemedText className="text-base font-semibold text-white">
                  Open Settings
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};