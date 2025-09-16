package com.detoxie;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
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

        // Create custom overlay based on React Native configuration
        overlayView = createCustomOverlay(timeSpent);

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

    private View createCustomOverlay(long timeSpent) {
        // Get configuration from React Native
        ReelsMonitorModule module = ReelsMonitorModule.getInstance();
        ReadableMap config = module != null ? module.getOverlayConfig() : null;
        
        // Create main container
        LinearLayout mainContainer = new LinearLayout(this);
        mainContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.setGravity(Gravity.CENTER);
        mainContainer.setPadding(60, 100, 60, 100);
        
        // Apply background configuration
        GradientDrawable background = new GradientDrawable();
        if (config != null && config.hasKey("backgroundColor")) {
            try {
                String bgColor = config.getString("backgroundColor");
                background.setColor(Color.parseColor(bgColor));
            } catch (Exception e) {
                background.setColor(Color.parseColor("#5865F2")); // Default blue
            }
        } else {
            background.setColor(Color.parseColor("#5865F2")); // Default blue
        }
        background.setCornerRadius(24);
        mainContainer.setBackground(background);

        // Title text
        TextView titleText = new TextView(this);
        String titleMessage = "Make time for what\ntruly matters.";
        if (config != null && config.hasKey("title")) {
            titleMessage = config.getString("title");
        }
        titleText.setText(titleMessage);
        titleText.setTextColor(Color.WHITE);
        titleText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        titleText.setGravity(Gravity.CENTER);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);
        
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleParams.bottomMargin = 40;
        titleText.setLayoutParams(titleParams);
        mainContainer.addView(titleText);

        // Cat illustration container (simplified)
        LinearLayout catContainer = new LinearLayout(this);
        catContainer.setOrientation(LinearLayout.VERTICAL);
        catContainer.setGravity(Gravity.CENTER);
        
        // Speech bubble
        TextView speechBubble = new TextView(this);
        speechBubble.setText("YOUR BREAK PLEASE!");
        speechBubble.setTextColor(Color.BLACK);
        speechBubble.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        speechBubble.setPadding(20, 10, 20, 10);
        GradientDrawable bubbleBackground = new GradientDrawable();
        bubbleBackground.setColor(Color.WHITE);
        bubbleBackground.setCornerRadius(16);
        speechBubble.setBackground(bubbleBackground);
        
        LinearLayout.LayoutParams bubbleParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        bubbleParams.bottomMargin = 20;
        speechBubble.setLayoutParams(bubbleParams);
        catContainer.addView(speechBubble);

        // Simple cat representation (you can replace with actual image)
        TextView catEmoji = new TextView(this);
        catEmoji.setText("🐱");
        catEmoji.setTextSize(TypedValue.COMPLEX_UNIT_SP, 48);
        catEmoji.setGravity(Gravity.CENTER);
        catContainer.addView(catEmoji);
        
        LinearLayout.LayoutParams catParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        catParams.bottomMargin = 40;
        catContainer.setLayoutParams(catParams);
        mainContainer.addView(catContainer);

        // Time circle
        LinearLayout timeContainer = new LinearLayout(this);
        timeContainer.setOrientation(LinearLayout.VERTICAL);
        timeContainer.setGravity(Gravity.CENTER);
        
        GradientDrawable circleBackground = new GradientDrawable();
        circleBackground.setColor(Color.parseColor("#FFD700")); // Gold color
        circleBackground.setShape(GradientDrawable.OVAL);
        timeContainer.setBackground(circleBackground);
        timeContainer.setPadding(40, 40, 40, 40);
        
        // Calculate minutes
        int minutes = (int) (timeSpent / (60 * 1000));
        
        TextView timeNumber = new TextView(this);
        timeNumber.setText(String.valueOf(minutes));
        timeNumber.setTextColor(Color.BLACK);
        timeNumber.setTextSize(TypedValue.COMPLEX_UNIT_SP, 32);
        timeNumber.setTypeface(null, android.graphics.Typeface.BOLD);
        timeNumber.setGravity(Gravity.CENTER);
        timeContainer.addView(timeNumber);
        
        TextView timeLabel = new TextView(this);
        timeLabel.setText("mins left");
        timeLabel.setTextColor(Color.BLACK);
        timeLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        timeLabel.setGravity(Gravity.CENTER);
        timeContainer.addView(timeLabel);
        
        // Make time container circular
        LinearLayout.LayoutParams timeParams = new LinearLayout.LayoutParams(120, 120);
        timeParams.bottomMargin = 60;
        timeContainer.setLayoutParams(timeParams);
        mainContainer.addView(timeContainer);

        // Close button
        Button closeButton = new Button(this);
        String buttonText = "Close";
        if (config != null && config.hasKey("buttonText")) {
            buttonText = config.getString("buttonText");
        }
        closeButton.setText(buttonText);
        closeButton.setTextColor(Color.WHITE);
        closeButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        closeButton.setTypeface(null, android.graphics.Typeface.BOLD);
        
        GradientDrawable buttonBackground = new GradientDrawable();
        buttonBackground.setColor(Color.BLACK);
        buttonBackground.setCornerRadius(24);
        closeButton.setBackground(buttonBackground);
        closeButton.setPadding(0, 20, 0, 20);
        
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        buttonParams.setMargins(40, 0, 40, 0);
        closeButton.setLayoutParams(buttonParams);
        
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
        
        mainContainer.addView(closeButton);
        
        return mainContainer;
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