import { useEffect } from 'react';
import { usePermissionStore } from '../store/PermissionStore';

function usePermissionTracker() {
  const {
    hasAccessibilityPermission,
    hasOverlayPermission,
    reelsStatus,
    isMonitoring,
    requestAccessibilityPermission,
    requestOverlayPermission,
    initialize,
    showPermissionModal, 
    permissionModalType,
    handlePermissionModalProceed,
    handlePermissionModalCancel 
  } = usePermissionStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    hasAccessibilityPermission,
    hasOverlayPermission,
    reelsStatus,
    isMonitoring,
    requestAccessibilityPermission,
    requestOverlayPermission,
    showPermissionModal, 
    permissionModalType,
    handlePermissionModalProceed,
    handlePermissionModalCancel 
  };
}

export default usePermissionTracker;