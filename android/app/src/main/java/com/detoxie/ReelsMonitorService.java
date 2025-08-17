package com.detoxie;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
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

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class ReelsMonitorService extends AccessibilityService {
    private static final String TAG = "ReelsMonitorService";
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";
    private static final long TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    private static final String PREFS_NAME = "ReelsMonitorPrefs";
    private static final String TOTAL_TIME_KEY = "total_time_spent";
    private static final String SESSION_COUNT_KEY = "session_count";
    private static final String LAST_SESSION_DATE_KEY = "last_session_date";
    
    private long reelsStartTime = 0;
    private boolean isInReels = false;
    private boolean hasExceededThreshold = false;
    private boolean isOverlayShowing = false;
    private String lastKnownPackage = "";
    private WindowManager windowManager;
    private View overlayView;
    private SharedPreferences prefs;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.d(TAG, "Service connected");
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        
        sendEventToReactNative("ReelsEvent", createEventMap("Service Connected", 0));
        
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
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getPackageName() == null) return;

        String packageName = event.getPackageName().toString();
        
        // If overlay is showing, handle carefully
        if (isOverlayShowing) {
            if (!INSTAGRAM_PACKAGE.equals(packageName) && 
                !packageName.equals(getPackageName()) &&
                !packageName.equals("android") &&
                !packageName.equals("com.android.systemui")) {
                
                Log.d(TAG, "User genuinely switched to another app: " + packageName);
                removeOverlay();
                resetStates();
                sendEventToReactNative("ReelsEvent", createEventMap("Left Instagram", getTotalTimeSpent()));
            }
            return; 
        }
        
        if (!isOverlayShowing) {
            lastKnownPackage = packageName;
        }
        
        // Check for app exit when overlay is NOT showing
        if (!INSTAGRAM_PACKAGE.equals(packageName)) {
            Log.d(TAG, "User has exited Instagram app to: " + packageName);
            resetStates();
            sendEventToReactNative("ReelsEvent", createEventMap("Left Instagram", getTotalTimeSpent()));
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        boolean reelsSectionActive = rootNode != null && isReelsSectionActive(rootNode);

        if (reelsSectionActive) {
            if (!isInReels) {
                if (hasExceededThreshold) {
                    showOverlay(TIME_THRESHOLD);
                    return; 
                } else {
                    isInReels = true;
                    reelsStartTime = System.currentTimeMillis();
                    Log.d(TAG, "Started tracking Reels time");
                    sendEventToReactNative("ReelsEvent", createEventMap("Entered Reels", getTotalTimeSpent()));
                }
            } else {
                // Send periodic updates while in reels
                long currentSessionTime = System.currentTimeMillis() - reelsStartTime;
                sendEventToReactNative("ReelsTimeUpdate", createTimeUpdateMap(currentSessionTime));
                
                if (currentSessionTime >= TIME_THRESHOLD && !hasExceededThreshold) {
                    hasExceededThreshold = true;
                    Log.d(TAG, "User has spent 2 minutes scrolling Reels!");
                    
                    // Update total time in preferences
                    updateTotalTimeSpent(currentSessionTime);
                    
                    showOverlay(currentSessionTime);
                    isInReels = false;
                }
            }
        } else {
            if (isInReels) {
                isInReels = false;
                long sessionTime = System.currentTimeMillis() - reelsStartTime;
                updateTotalTimeSpent(sessionTime);
                Log.d(TAG, "Left Reels section. Time spent: " + (sessionTime / 1000) + " seconds");
                sendEventToReactNative("ReelsEvent", createEventMap("Left Reels", getTotalTimeSpent()));
                reelsStartTime = 0;
            }
        }
    }
    
    private WritableMap createEventMap(String status, long totalTime) {
        WritableMap map = Arguments.createMap();
        map.putString("status", status);
        map.putDouble("totalTimeSpent", totalTime / 1000.0); // Convert to seconds
        return map;
    }
    
    private WritableMap createTimeUpdateMap(long currentSessionTime) {
        WritableMap map = Arguments.createMap();
        map.putDouble("currentSessionTime", currentSessionTime / 1000.0);
        map.putDouble("totalTimeSpent", getTotalTimeSpent() / 1000.0);
        return map;
    }
    
    private void updateTotalTimeSpent(long sessionTime) {
        long totalTime = prefs.getLong(TOTAL_TIME_KEY, 0) + sessionTime;
        int sessionCount = prefs.getInt(SESSION_COUNT_KEY, 0) + 1;
        String currentDate = java.text.DateFormat.getDateInstance().format(new java.util.Date());
        
        prefs.edit()
            .putLong(TOTAL_TIME_KEY, totalTime)
            .putInt(SESSION_COUNT_KEY, sessionCount)
            .putString(LAST_SESSION_DATE_KEY, currentDate)
            .apply();
            
        Log.d(TAG, "Updated total time: " + (totalTime / 1000) + " seconds, Session count: " + sessionCount);
        
        // Send updated stats to React Native
        WritableMap statsMap = Arguments.createMap();
        statsMap.putDouble("totalTime", totalTime / 1000.0);
        statsMap.putInt("sessionCount", sessionCount);
        statsMap.putString("lastSessionDate", currentDate);
        sendEventToReactNative("ReelsStatsUpdate", statsMap);
    }
    
    private long getTotalTimeSpent() {
        return prefs.getLong(TOTAL_TIME_KEY, 0);
    }
    
    private void sendEventToReactNative(String eventName, WritableMap params) {
        try {
            ReelsMonitorModule module = ReelsMonitorModule.getInstance();
            if (module != null) {
                module.sendEventToReactNative(eventName, params);
            } else {
                Log.w(TAG, "ReelsMonitorModule instance is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to send event to React Native: " + eventName, e);
        }
    }
    
    private void resetStates() {
        if (isInReels) {
            long sessionTime = System.currentTimeMillis() - reelsStartTime;
            updateTotalTimeSpent(sessionTime);
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
            hasExceededThreshold = false;
            
            // Check if still in reels and restart tracking
            AccessibilityNodeInfo currentRoot = getRootInActiveWindow();
            if (currentRoot != null && isReelsSectionActive(currentRoot)) {
                isInReels = true;
                reelsStartTime = System.currentTimeMillis();
                Log.d(TAG, "Restarted tracking after overlay dismissed");
                sendEventToReactNative("ReelsEvent", createEventMap("Resumed Reels", getTotalTimeSpent()));
            }
        });

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            android.graphics.PixelFormat.TRANSLUCENT
        );
        params.gravity = android.view.Gravity.CENTER;

        try {
            windowManager.addView(overlayView, params);
            isOverlayShowing = true;
            Log.d(TAG, "Overlay displayed");
            sendEventToReactNative("ReelsEvent", createEventMap("Overlay Shown", getTotalTimeSpent()));
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

        if (node.getText() != null && 
            (node.getText().toString().toLowerCase().contains("reels") || 
             node.getText().toString().toLowerCase().contains("explore"))) {
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
    public void onDestroy() {
        super.onDestroy();
        removeOverlay();
        Log.d(TAG, "Service destroyed");
    }
}