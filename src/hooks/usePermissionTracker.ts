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
    initialize
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
    requestOverlayPermission
  };
}

export default usePermissionTracker;