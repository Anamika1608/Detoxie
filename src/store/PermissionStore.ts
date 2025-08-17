import { create } from 'zustand';
import { NativeModules, Alert } from 'react-native';

const { ReelsMonitorModule } = NativeModules;

export const usePermissionStore = create((set, get) => ({
  // State
  hasAccessibilityPermission: false,
  hasOverlayPermission: false,
  reelsStatus: 'Initializing...',
  isMonitoring: false,

  // Actions
  setHasAccessibilityPermission: (hasPermission) =>
    set({ hasAccessibilityPermission: hasPermission }),

  setHasOverlayPermission: (hasPermission) =>
    set({ hasOverlayPermission: hasPermission }),

  setReelsStatus: (status) =>
    set({ reelsStatus: status }),

  setIsMonitoring: (monitoring) =>
    set({ isMonitoring: monitoring }),

  startMonitoring: async () => {
    try {
      await ReelsMonitorModule.startMonitoring();
      set({ 
        isMonitoring: true,
        reelsStatus: 'Monitoring Active'
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      set({ reelsStatus: 'Error starting monitoring' });
    }
  },

  checkPermissions: async () => {
    try {
      const accessibilityResult = await ReelsMonitorModule.checkAccessibilityPermission();
      const overlayResult = await ReelsMonitorModule.checkOverlayPermission();

      set({
        hasAccessibilityPermission: accessibilityResult,
        hasOverlayPermission: overlayResult
      });

      if (accessibilityResult && overlayResult) {
        get().startMonitoring();
      } else {
        set({ reelsStatus: 'Permissions Required' });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      set({ reelsStatus: 'Error checking permissions' });
    }
  },

  requestAccessibilityPermission: async () => {
    try {
      await ReelsMonitorModule.requestAccessibilityPermission();
      Alert.alert(
        'Permission Required',
        'Enable accessibility service for this app and return.',
        [
          {
            text: 'OK',
            onPress: () => get().checkPermissions()
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting accessibility permission:', error);
      Alert.alert('Error', 'Failed to request accessibility permission');
    }
  },

  requestOverlayPermission: async () => {
    try {
      await ReelsMonitorModule.requestOverlayPermission();
      Alert.alert(
        'Permission Required',
        'Allow overlay permission for this app and return.',
        [
          {
            text: 'OK',
            onPress: () => get().checkPermissions()
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting overlay permission:', error);
      Alert.alert('Error', 'Failed to request overlay permission');
    }
  },

  // Initialize permissions check
  initialize: () => {
    get().checkPermissions();
  }
}));