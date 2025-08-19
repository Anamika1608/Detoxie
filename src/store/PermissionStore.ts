import { create } from 'zustand';
import { NativeModules, AppState } from 'react-native';

const { ReelsMonitorModule } = NativeModules;

export const usePermissionStore = create((set, get) => ({
  // State
  hasAccessibilityPermission: false,
  hasOverlayPermission: false,
  reelsStatus: 'Initializing...',
  isMonitoring: false,
  showPermissionModal: false,
  permissionModalType: null, // 'accessibility' or 'overlay'
  isCheckingPermissions: false,

  // Actions
  setHasAccessibilityPermission: (hasPermission) =>
    set({ hasAccessibilityPermission: hasPermission }),

  setHasOverlayPermission: (hasPermission) =>
    set({ hasOverlayPermission: hasPermission }),

  setReelsStatus: (status) =>
    set({ reelsStatus: status }),

  setIsMonitoring: (monitoring) =>
    set({ isMonitoring: monitoring }),

  setShowPermissionModal: (show, type = null) =>
    set({ showPermissionModal: show, permissionModalType: type }),

  startMonitoring: async () => {
    try {
      await ReelsMonitorModule.startMonitoring();
      set({ 
        isMonitoring: true,
        reelsStatus: 'Monitoring Active',
        showPermissionModal: false,
        permissionModalType: null
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      set({ reelsStatus: 'Error starting monitoring' });
    }
  },

  checkPermissions: async () => {
    if (get().isCheckingPermissions) return;
    
    try {
      set({ isCheckingPermissions: true });
      const accessibilityResult = await ReelsMonitorModule.checkAccessibilityPermission();
      const overlayResult = await ReelsMonitorModule.checkOverlayPermission();

      set({
        hasAccessibilityPermission: accessibilityResult,
        hasOverlayPermission: overlayResult,
        isCheckingPermissions: false
      });

      if (accessibilityResult && overlayResult) {
        get().startMonitoring();
      } else {
        set({ reelsStatus: 'Permissions Required' });
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      set({ 
        reelsStatus: 'Error checking permissions',
        isCheckingPermissions: false
      });
    }
  },

  // Show custom modal instead of native alert
  requestAccessibilityPermission: async () => {
    set({ showPermissionModal: true, permissionModalType: 'accessibility' });
  },

  requestOverlayPermission: async () => {
    set({ showPermissionModal: true, permissionModalType: 'overlay' });
  },

  // Handle modal actions
  handlePermissionModalProceed: async () => {
    const { permissionModalType } = get();
    
    try {
      if (permissionModalType === 'accessibility') {
        await ReelsMonitorModule.requestAccessibilityPermission();
      } else if (permissionModalType === 'overlay') {
        await ReelsMonitorModule.requestOverlayPermission();
      }
      
      // Setup listener for when user returns
      get().setupAppStateListener();
      
      // Hide modal
      set({ showPermissionModal: false, permissionModalType: null });
    } catch (error) {
      console.error('Error requesting permission:', error);
      // You could show an error modal here instead
    }
  },

  handlePermissionModalCancel: () => {
    set({ showPermissionModal: false, permissionModalType: null });
  },

  setupAppStateListener: () => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        setTimeout(() => {
          get().checkPermissions();
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    setTimeout(() => {
      subscription?.remove();
    }, 120000);
  },

  initialize: () => {
    get().checkPermissions();
  }
}));