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
import android.util.DisplayMetrics;
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
import android.widget.ScrollView;
import android.widget.TextView;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;

public class ReelsMonitorService extends AccessibilityService {
    private static final String TAG = "ReelsMonitorService";
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";
    private static final String PREFS_NAME = "ReelsMonitorPrefs";
    private static final String TOTAL_TIME_KEY = "total_time_spent";
    private static final String SESSION_COUNT_KEY = "session_count";
    private static final String LAST_SESSION_DATE_KEY = "last_session_date";
    // Daily gating keys
    private static final String DAILY_DATE_KEY = "daily_date";
    private static final String DAILY_ACCUMULATED_MS_KEY = "daily_accumulated_ms";
    private static final String DAILY_HALF_SHOWN_KEY = "daily_half_shown";
    private static final String DAILY_LIMIT_REACHED_KEY = "daily_limit_reached";
    
    private long reelsStartTime = 0;
    private boolean isInReels = false;
    private boolean hasExceededThreshold = false; // legacy flag, no longer used for gating
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
        ensureDailyState();
        
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
            onExitReelsIfNeeded();
            sendEventToReactNative("ReelsEvent", createEventMap("Left Instagram", getTotalTimeSpent()));
            return;
        }

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        boolean reelsSectionActive = rootNode != null && isReelsSectionActive(rootNode);

        if (reelsSectionActive) {
            ensureDailyState();
            long now = System.currentTimeMillis();

            if (!isInReels) {
                isInReels = true;
                reelsStartTime = now;
                Log.d(TAG, "Entered Reels");
                sendEventToReactNative("ReelsEvent", createEventMap("Entered Reels", getTotalTimeSpent()));
            }

            // Send periodic updates while in reels
            long currentSessionTime = now - reelsStartTime;
            sendEventToReactNative("ReelsTimeUpdate", createTimeUpdateMap(currentSessionTime));

            long accumulatedToday = prefs.getLong(DAILY_ACCUMULATED_MS_KEY, 0);
            long totalElapsedToday = accumulatedToday + currentSessionTime;

            long fullThresholdMs = getConfiguredLimitMs();
            long halfThresholdMs = fullThresholdMs / 2;

            boolean halfShown = prefs.getBoolean(DAILY_HALF_SHOWN_KEY, false);
            boolean limitReached = prefs.getBoolean(DAILY_LIMIT_REACHED_KEY, false);

            if (limitReached) {
                showOverlay(totalElapsedToday, /*allowClose*/ false);
                return;
            }

            if (!halfShown && totalElapsedToday >= halfThresholdMs) {
                showOverlay(totalElapsedToday, /*allowClose*/ true);
                prefs.edit().putBoolean(DAILY_HALF_SHOWN_KEY, true).apply();
                return;
            }

            if (totalElapsedToday >= fullThresholdMs) {
                prefs.edit().putBoolean(DAILY_LIMIT_REACHED_KEY, true).apply();
                showOverlay(totalElapsedToday, /*allowClose*/ false);
                return;
            }
        } else {
            if (isInReels) {
                onExitReelsIfNeeded();
                sendEventToReactNative("ReelsEvent", createEventMap("Left Reels", getTotalTimeSpent()));
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
    
    private void onExitReelsIfNeeded() {
        if (isInReels) {
            long sessionTime = System.currentTimeMillis() - reelsStartTime;
            updateTotalTimeSpent(sessionTime);
            // Accumulate into today's counter (no reset)
            long accumulatedToday = prefs.getLong(DAILY_ACCUMULATED_MS_KEY, 0);
            prefs.edit().putLong(DAILY_ACCUMULATED_MS_KEY, accumulatedToday + sessionTime).apply();
            isInReels = false;
            reelsStartTime = 0;
        }
        removeOverlay();
    }

    private void ensureDailyState() {
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(new java.util.Date());
        String stored = prefs.getString(DAILY_DATE_KEY, null);
        if (stored == null || !stored.equals(today)) {
            prefs.edit()
                .putString(DAILY_DATE_KEY, today)
                .putLong(DAILY_ACCUMULATED_MS_KEY, 0)
                .putBoolean(DAILY_HALF_SHOWN_KEY, false)
                .putBoolean(DAILY_LIMIT_REACHED_KEY, false)
                .apply();
            Log.d(TAG, "Daily state reset for date: " + today);
        }
    }

    private long getConfiguredLimitMs() {
        long defaultMinutes = 5; // default 5 minutes
        ReelsMonitorModule module = ReelsMonitorModule.getInstance();
        ReadableMap config = module != null ? module.getOverlayConfig() : null;
        if (config != null && config.hasKey("timerMinutes")) {
            try {
                int min = config.getInt("timerMinutes");
                if (min > 0) return min * 60L * 1000L;
            } catch (Exception ignored) {}
        }
        return defaultMinutes * 60L * 1000L;
    }

    private void showOverlay(long totalElapsedMsToday, boolean allowClose) {
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
        overlayView = createCustomOverlay(totalElapsedMsToday, allowClose);

        int screenHeight = getResources().getDisplayMetrics().heightPixels;
        int desiredHeight = (int) (screenHeight * 0.85f); // leave bottom space for navigation

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            desiredHeight,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            android.graphics.PixelFormat.TRANSLUCENT
        );
        params.gravity = android.view.Gravity.TOP;
        params.y = dpToPx(16);

        try {
            windowManager.addView(overlayView, params);
            isOverlayShowing = true;
            Log.d(TAG, "Overlay displayed");
            sendEventToReactNative("ReelsEvent", createEventMap("Overlay Shown", getTotalTimeSpent()));
        } catch (Exception e) {
            Log.e(TAG, "Failed to display overlay", e);
        }
    }

    private View createCustomOverlay(long totalElapsedMsToday, boolean allowClose) {
        long limitMs = getConfiguredLimitMs();
        long remainingMs = Math.max(0, limitMs - totalElapsedMsToday);
        // Get configuration from React Native
        ReelsMonitorModule module = ReelsMonitorModule.getInstance();
        ReadableMap config = module != null ? module.getOverlayConfig() : null;
        com.facebook.react.bridge.ReadableArray todosArray = null;
        String visionBase64 = null;
        if (config != null) {
            if (config.hasKey("todos")) {
                try { todosArray = config.getArray("todos"); } catch (Exception ignored) {}
            }
            if (config.hasKey("visionBase64")) {
                try { visionBase64 = config.getString("visionBase64"); } catch (Exception ignored) {}
            }
        }
        
        // Create scrollable container to ensure all content remains visible
        ScrollView scrollView = new ScrollView(this);
        scrollView.setFillViewport(true);

        LinearLayout mainContainer = new LinearLayout(this);
        mainContainer.setOrientation(LinearLayout.VERTICAL);
        mainContainer.setGravity(Gravity.CENTER);
        mainContainer.setPadding(dpToPx(24), dpToPx(32), dpToPx(24), dpToPx(32));
        
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
        background.setCornerRadius(dpToPx(16));
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
        titleParams.bottomMargin = dpToPx(24);
        titleText.setLayoutParams(titleParams);
        mainContainer.addView(titleText);

        // Optional vision image
        if (visionBase64 != null && !visionBase64.isEmpty()) {
            try {
                byte[] decoded = android.util.Base64.decode(visionBase64, android.util.Base64.DEFAULT);
                android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                if (bitmap != null) {
                    ImageView imageView = new ImageView(this);
                    imageView.setImageBitmap(bitmap);
                    imageView.setAdjustViewBounds(true);
                    imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
                    LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    imgParams.bottomMargin = dpToPx(24);
                    imageView.setLayoutParams(imgParams);
                    imageView.setMaxHeight(dpToPx(380));
                    mainContainer.addView(imageView);
                }
            } catch (Exception ignored) {}
        }

        // Optional todos list
        if (todosArray != null && todosArray.size() > 0) {
            LinearLayout listContainer = new LinearLayout(this);
            listContainer.setOrientation(LinearLayout.VERTICAL);
            listContainer.setGravity(Gravity.CENTER_HORIZONTAL);
            LinearLayout.LayoutParams listParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            listParams.bottomMargin = dpToPx(20);
            listContainer.setLayoutParams(listParams);

            TextView listTitle = new TextView(this);
            listTitle.setText("Your Pending work");
            listTitle.setTextColor(Color.WHITE);
            listTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            listTitle.setTypeface(null, android.graphics.Typeface.BOLD);
            listTitle.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams lt = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lt.bottomMargin = dpToPx(8);
            listTitle.setLayoutParams(lt);
            listContainer.addView(listTitle);

            for (int i = 0; i < todosArray.size(); i++) {
                try {
                    String item = todosArray.getString(i);
                    TextView tv = new TextView(this);
                    tv.setText("• " + item);
                    tv.setTextColor(Color.WHITE);
                    tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
                    tv.setGravity(Gravity.START);
                    LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                    ip.bottomMargin = dpToPx(4);
                    tv.setLayoutParams(ip);
                    listContainer.addView(tv);
                } catch (Exception ignored) {}
            }
            mainContainer.addView(listContainer);
        }

        if (allowClose) {
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
            buttonBackground.setCornerRadius(dpToPx(16));
            closeButton.setBackground(buttonBackground);
            closeButton.setPadding(0, dpToPx(12), 0, dpToPx(12));
            
            LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            buttonParams.setMargins(dpToPx(24), 0, dpToPx(24), 0);
            closeButton.setLayoutParams(buttonParams);
            
            closeButton.setOnClickListener(v -> {
                removeOverlay();
                // continue counting without reset
                AccessibilityNodeInfo currentRoot = getRootInActiveWindow();
                if (currentRoot != null && isReelsSectionActive(currentRoot)) {
                    isInReels = true;
                    reelsStartTime = System.currentTimeMillis();
                    Log.d(TAG, "Overlay dismissed, continue tracking");
                    sendEventToReactNative("ReelsEvent", createEventMap("Overlay Dismissed", getTotalTimeSpent()));
                }
            });
            
            mainContainer.addView(closeButton);
        }
        
        scrollView.addView(mainContainer, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return scrollView;
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
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