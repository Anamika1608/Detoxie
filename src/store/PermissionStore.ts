import { create } from 'zustand';
import { NativeModules, AppState } from 'react-native';
import { dbHelper, DatabaseHelper } from '../database';

const { ContentMonitorModule } = NativeModules;

interface PermissionStore {
  // State
  hasAccessibilityPermission: boolean;
  hasOverlayPermission: boolean;
  reelsStatus: string;
  isMonitoring: boolean;
  showPermissionModal: boolean;
  permissionModalType: string | null;
  isCheckingPermissions: boolean;
  overlayConfig: {
    backgroundColor: string;
    title: string;
    buttonText: string;
    timerMinutes: number;
    todos: any[];
    visionBase64: string | null;
  };
  isVacationMode: boolean;

  // Actions
  setHasAccessibilityPermission: (hasPermission: boolean) => void;
  setHasOverlayPermission: (hasPermission: boolean) => void;
  setReelsStatus: (status: string) => void;
  setIsMonitoring: (monitoring: boolean) => void;
  setShowPermissionModal: (show: boolean, type?: string | null) => void;
  configureOverlay: (config: any) => Promise<void>;
  updateOverlayConfig: (newConfig: any) => void;
  setVacationMode: (isVacationMode: boolean) => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  checkPermissions: () => Promise<void>;
  requestAccessibilityPermission: () => Promise<void>;
  requestOverlayPermission: () => Promise<void>;
  initialize: () => Promise<void>;
  setupAppStateListener: () => void;
  handlePermissionModalProceed: () => Promise<void>;
  handlePermissionModalCancel: () => void;
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
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
  isVacationMode: false,

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
      await ContentMonitorModule.configureOverlay(config);
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

  setVacationMode: async (isVacationMode) => {
    try {
      await ContentMonitorModule.setVacationMode(isVacationMode);
      set({ isVacationMode });
      console.log('Vacation mode updated:', isVacationMode);
    } catch (error) {
      console.error('Error setting vacation mode:', error);
    }
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
      
      await ContentMonitorModule.startMonitoring();
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

  stopMonitoring: async () => {
    try {
      await ContentMonitorModule.stopMonitoring();
      set({ 
        isMonitoring: false,
        reelsStatus: 'Monitoring Stopped'
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      set({ reelsStatus: 'Error stopping monitoring' });
    }
  },

  checkPermissions: async () => {
    if (get().isCheckingPermissions) return;
    
    try {
      set({ isCheckingPermissions: true });
      const accessibilityResult = await ContentMonitorModule.checkAccessibilityPermission();
      const overlayResult = await ContentMonitorModule.checkOverlayPermission();

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
        await ContentMonitorModule.requestAccessibilityPermission();
      } else if (permissionModalType === 'overlay') {
        await ContentMonitorModule.requestOverlayPermission();
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
    const handleAppStateChange = (nextAppState: string) => {
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

  initialize: async () => {
    await get().checkPermissions();
  },

  // Remove theme presets; single color comes from RN code only
}));