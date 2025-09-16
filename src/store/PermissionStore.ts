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
  overlayConfig: {
    backgroundColor: '#5865F2',
    title: 'Make time for what\ntruly matters.',
    buttonText: 'Close',
    showCat: true,
    showTimeCircle: true,
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
      await get().configureOverlay(get().overlayConfig);
      
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

  // Preset overlay themes
  applyOverlayTheme: (themeName) => {
    const themes = {
      purple: {
        backgroundColor: '#8B5CF6',
        title: 'Time for a mindful\nbreak! 💜',
        buttonText: 'Got it!',
      },
      green: {
        backgroundColor: '#10B981',
        title: 'Nature is calling!\nTake a walk 🌱',
        buttonText: 'Let\'s go',
      },
      orange: {
        backgroundColor: '#F59E0B',
        title: 'Sunshine awaits\nyou outside! ☀️',
        buttonText: 'Step outside',
      },
      red: {
        backgroundColor: '#EF4444',
        title: 'You\'ve been scrolling\nfor too long! 🔥',
        buttonText: 'Break free',
      },
      blue: {
        backgroundColor: '#3B82F6',
        title: 'Your mind needs\na breather 🌊',
        buttonText: 'Refresh',
      },
      minimal: {
        backgroundColor: '#374151',
        title: 'Time to disconnect\nand reconnect',
        buttonText: 'Close',
      }
    };

    const theme = themes[themeName] || themes.purple;
    get().updateOverlayConfig(theme);
  },
}));