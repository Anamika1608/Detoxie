import { create } from 'zustand';
import { NativeModules, AppState } from 'react-native';
import { dbHelper, DatabaseHelper } from '../database';

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
  overlayConfig: {
    backgroundColor: '#5865F2',
    title: 'Make time for what\ntruly matters.',
    buttonText: 'Close',
    timerMinutes: 5,
    todos: [],
    visionBase64: null,
  },

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

  configureOverlay: async (config) => {
    try {
      await ReelsMonitorModule.configureOverlay(config);
      set({ overlayConfig: { ...get().overlayConfig, ...config } });
      console.log('Overlay configured successfully');
    } catch (error) {
      console.error('Error configuring overlay:', error);
    }
  },

  updateOverlayConfig: (newConfig) => {
    const updatedConfig = { ...get().overlayConfig, ...newConfig };
    set({ overlayConfig: updatedConfig });
    get().configureOverlay(updatedConfig);
  },

  startMonitoring: async () => {
    try {
      // Build fresh config from DB: timer, todos, vision
      const helper: DatabaseHelper = dbHelper;
      await helper.initializeDatabase();
      const minutes = (await helper.getTimerMinutes()) ?? 5;
      const todos = await helper.getAllTaskTexts();
      const visionBase64 = await helper.getDreamImageBase64();

      const config = {
        ...get().overlayConfig,
        timerMinutes: minutes,
        todos,
        visionBase64,
        // Enforce single color/theme from RN
        backgroundColor: get().overlayConfig.backgroundColor,
      };

      await get().configureOverlay(config);
      
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
  },

  // Remove theme presets; single color comes from RN code only
}));