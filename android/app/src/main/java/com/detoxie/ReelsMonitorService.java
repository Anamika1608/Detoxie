package com.detoxie;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.TextView;

public class ReelsMonitorService extends AccessibilityService {
    private static final String TAG = "ReelsMonitorService";
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";
    private static final long TIME_THRESHOLD = 2 * 60 * 1000;
    private long reelsStartTime = 0;
    private boolean isInReels = false;
    private boolean hasExceededThreshold = false;  // Track if user has exceeded time limit
    private boolean isOverlayShowing = false;  // Track if overlay is currently displayed
    private String lastKnownPackage = "";  // Track the last known package before overlay
    private WindowManager windowManager;
    private View overlayView;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getPackageName() == null) return;

        String packageName = event.getPackageName().toString();
        
        // If overlay is showing, we need to handle this carefully
        if (isOverlayShowing) {
            // Only check for genuine app switches, not overlay-induced package changes
            if (!INSTAGRAM_PACKAGE.equals(packageName) && 
                !packageName.equals(getPackageName()) && // Ignore our own app/overlay
                !packageName.equals("android") && // Ignore system UI changes
                !packageName.equals("com.android.systemui")) { // Ignore system UI
                
                // This is a genuine app switch - remove overlay
                Log.d(TAG, "User genuinely switched to another app: " + packageName);
                removeOverlay();
                resetStates();
            }
            return; 
        }
        
        // Update last known package only when overlay is not showing
        if (!isOverlayShowing) {
            lastKnownPackage = packageName;
        }
        
        // Check for app exit when overlay is NOT showing
        if (!INSTAGRAM_PACKAGE.equals(packageName)) {
            Log.d(TAG, "User has exited Instagram app to: " + packageName);
            resetStates();
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();

        // Check if we're in Instagram and if Reels section is active
        boolean reelsSectionActive = rootNode != null && isReelsSectionActive(rootNode);

        if (reelsSectionActive) {
            // User is in Reels section
            if (!isInReels) {
                // User just entered Reels section
                if (hasExceededThreshold) {
                    // Show overlay if threshold was previously exceeded
                    showOverlay(TIME_THRESHOLD);
                    return; 
                } else {
                    // Start tracking time
                    isInReels = true;
                    reelsStartTime = System.currentTimeMillis();
                    Log.d(TAG, "Started tracking Reels time");
                }
            } else {
                // User is already in Reels, check if threshold exceeded during scrolling
                long timeSpent = System.currentTimeMillis() - reelsStartTime;
                if (timeSpent >= TIME_THRESHOLD && !hasExceededThreshold) {
                    hasExceededThreshold = true;
                    Log.d(TAG, "User has spent 2 minutes scrolling Reels!");
                    showOverlay(timeSpent);
                    // Stop tracking while overlay is shown
                    isInReels = false;
                }
            }
        } else {
            // User left Reels section but still in Instagram
            if (isInReels) {
                isInReels = false;
                long timeSpent = System.currentTimeMillis() - reelsStartTime;
                Log.d(TAG, "Left Reels section. Time spent: " + (timeSpent / 1000) + " seconds");
                reelsStartTime = 0;
            }
        }
    }
    
    private void resetStates() {
        if (isInReels) {
            isInReels = false;
            reelsStartTime = 0;
        }
        removeOverlay();
        hasExceededThreshold = false;
    }

    private void showOverlay(long timeSpent) {
        if (!Settings.canDrawOverlays(this)) {
            Log.d(TAG, "Overlay permission not granted");
            return;
        }

        if (isOverlayShowing) {
            Log.d(TAG, "Overlay already showing");
            return;
        }

        if (windowManager == null) {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        }

        if (overlayView != null) {
            Log.d(TAG, "remove overlay when overlayView is not null");
            removeOverlay();
        }

        // Inflate the overlay layout
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_reels_exit, null);

        // Update time spent text
        TextView timeText = overlayView.findViewById(R.id.time_spent_text);
        timeText.setText("You've spent " + (timeSpent / 1000) + " seconds on Reels. Take a break?");

        // Set up close button
        Button closeButton = overlayView.findViewById(R.id.close_button);
        closeButton.setOnClickListener(v -> {
            removeOverlay();
            // Reset threshold flag when user dismisses overlay
            hasExceededThreshold = false;
            // Allow user to continue using Reels - restart tracking
            AccessibilityNodeInfo currentRoot = getRootInActiveWindow();
            if (currentRoot != null && isReelsSectionActive(currentRoot)) {
                isInReels = true;
                reelsStartTime = System.currentTimeMillis();
                Log.d(TAG, "Restarted tracking after overlay dismissed");
            }
        });

        // Define window parameters
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            android.graphics.PixelFormat.TRANSLUCENT
        );
        params.gravity = android.view.Gravity.CENTER;

        // Add the view to the window manager
        try {
            windowManager.addView(overlayView, params);
            isOverlayShowing = true;
            Log.d(TAG, "Overlay displayed");
        } catch (Exception e) {
            Log.e(TAG, "Failed to display overlay", e);
        }
    }

    private void removeOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
                overlayView = null;
                isOverlayShowing = false;
                Log.d(TAG, "Overlay removed");
            } catch (Exception e) {
                Log.e(TAG, "Failed to remove overlay", e);
            }
        }
    }

    private boolean isReelsSectionActive(AccessibilityNodeInfo node) {
        if (node == null) return false;

        if (node.getText() != null && (node.getText().toString().toLowerCase().contains("reels") || node.getText().toString().toLowerCase().contains("explore"))) {
            return true;
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            if (isReelsSectionActive(node.getChild(i))) {
                return true;
            }
        }

        return false;
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "Service interrupted");
        removeOverlay();
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service connected");
        if (!Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch overlay permission settings", e);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        removeOverlay();
        Log.d(TAG, "Service destroyed");
    }
}