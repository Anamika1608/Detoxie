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

public class ContentMonitorService extends AccessibilityService {
    private static final String TAG = "ContentMonitorService";

    // Platform package names
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";
    private static final String YOUTUBE_PACKAGE = "com.google.android.youtube";

    // Platform identifiers
    public static final String PLATFORM_INSTAGRAM = "instagram";
    public static final String PLATFORM_YOUTUBE = "youtube";

    private static final String PREFS_NAME = "ContentMonitorPrefs";
    private static final String TOTAL_TIME_KEY = "total_time_spent";
    private static final String SESSION_COUNT_KEY = "session_count";
    private static final String LAST_SESSION_DATE_KEY = "last_session_date";

    // Daily gating keys (shared across platforms)
    private static final String DAILY_DATE_KEY = "daily_date";
    private static final String DAILY_ACCUMULATED_MS_KEY = "daily_accumulated_ms";
    private static final String DAILY_HALF_SHOWN_KEY = "daily_half_shown";
    private static final String DAILY_LIMIT_REACHED_KEY = "daily_limit_reached";

    // Per-platform daily tracking keys
    private static final String INSTAGRAM_DAILY_MS_KEY = "instagram_daily_ms";
    private static final String YOUTUBE_DAILY_MS_KEY = "youtube_daily_ms";

    private long contentStartTime = 0;
    private boolean isInContent = false;
    private String currentPlatform = null; // "instagram" or "youtube"
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

        sendEventToReactNative("ContentEvent", createEventMap("Service Connected", null, 0));
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getPackageName() == null) return;

        String packageName = event.getPackageName().toString();

        // If overlay is showing, keep it visible only while user remains in tracked sections
        if (isOverlayShowing) {
            if (YOUTUBE_PACKAGE.equals(packageName)) {
                AccessibilityNodeInfo rootNode = getRootInActiveWindow();
                boolean shortsSectionActive = rootNode != null && isYouTubeShortsActive(rootNode);

                if (!shortsSectionActive) {
                    String previousPlatform = currentPlatform;
                    Log.d(TAG, "User left YouTube Shorts while overlay was showing");
                    onExitContentIfNeeded();
                    String status = PLATFORM_YOUTUBE.equals(previousPlatform) ? "Left Shorts" : "Left App";
                    sendEventToReactNative("ContentEvent", createEventMap(status, previousPlatform, getTotalTimeSpent()));
                }
                return;
            }

            if (INSTAGRAM_PACKAGE.equals(packageName)) {
                AccessibilityNodeInfo rootNode = getRootInActiveWindow();
                boolean reelsSectionActive = rootNode != null && isReelsSectionActive(rootNode);

                if (!reelsSectionActive) {
                    String previousPlatform = currentPlatform;
                    Log.d(TAG, "User left Instagram Reels while overlay was showing");
                    onExitContentIfNeeded();
                    String status = PLATFORM_INSTAGRAM.equals(previousPlatform) ? "Left Reels" : "Left App";
                    sendEventToReactNative("ContentEvent", createEventMap(status, previousPlatform, getTotalTimeSpent()));
                }
                return;
            }

            if (!INSTAGRAM_PACKAGE.equals(packageName) &&
                !YOUTUBE_PACKAGE.equals(packageName) &&
                !packageName.equals(getPackageName()) &&
                !packageName.equals("android") &&
                !packageName.equals("com.android.systemui")) {

                Log.d(TAG, "User genuinely switched to another app: " + packageName);
                removeOverlay();
                sendEventToReactNative("ContentEvent", createEventMap("Left App", currentPlatform, getTotalTimeSpent()));
            }
            return;
        }

        if (!isOverlayShowing) {
            lastKnownPackage = packageName;
        }

        // Check if user is in Instagram
        if (INSTAGRAM_PACKAGE.equals(packageName)) {
            handleInstagramEvent(event);
            return;
        }

        // Check if user is in YouTube
        if (YOUTUBE_PACKAGE.equals(packageName)) {
            handleYouTubeEvent(event);
            return;
        }

        // User switched to another app
        Log.d(TAG, "User has exited content app to: " + packageName);
        onExitContentIfNeeded();
        sendEventToReactNative("ContentEvent", createEventMap("Left App", currentPlatform, getTotalTimeSpent()));
    }

    private void handleInstagramEvent(AccessibilityEvent event) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        boolean reelsSectionActive = rootNode != null && isReelsSectionActive(rootNode);

        if (reelsSectionActive) {
            handleContentActive(PLATFORM_INSTAGRAM);
        } else {
            if (isInContent && PLATFORM_INSTAGRAM.equals(currentPlatform)) {
                onExitContentIfNeeded();
                sendEventToReactNative("ContentEvent", createEventMap("Left Reels", PLATFORM_INSTAGRAM, getTotalTimeSpent()));
            }
        }
    }

    private void handleYouTubeEvent(AccessibilityEvent event) {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        boolean shortsSectionActive = rootNode != null && isYouTubeShortsActive(rootNode);

        if (shortsSectionActive) {
            handleContentActive(PLATFORM_YOUTUBE);
        } else {
            if (isInContent && PLATFORM_YOUTUBE.equals(currentPlatform)) {
                onExitContentIfNeeded();
                sendEventToReactNative("ContentEvent", createEventMap("Left Shorts", PLATFORM_YOUTUBE, getTotalTimeSpent()));
            }
        }
    }

    private void handleContentActive(String platform) {
        ensureDailyState();
        long now = System.currentTimeMillis();

        // If switching platforms mid-session, close previous session first
        if (isInContent && currentPlatform != null && !currentPlatform.equals(platform)) {
            onExitContentIfNeeded();
        }

        if (!isInContent) {
            isInContent = true;
            currentPlatform = platform;
            contentStartTime = now;
            String eventName = PLATFORM_INSTAGRAM.equals(platform) ? "Entered Reels" : "Entered Shorts";
            Log.d(TAG, eventName + " on " + platform);
            sendEventToReactNative("ContentEvent", createEventMap(eventName, platform, getTotalTimeSpent()));
        }

        // Send periodic updates while in content
        long currentSessionTime = now - contentStartTime;
        sendEventToReactNative("ContentTimeUpdate", createTimeUpdateMap(currentSessionTime, platform));

        // Calculate total elapsed today (combined across platforms)
        long accumulatedToday = prefs.getLong(DAILY_ACCUMULATED_MS_KEY, 0);
        long totalElapsedToday = accumulatedToday + currentSessionTime;

        long fullThresholdMs = getConfiguredLimitMs();
        long halfThresholdMs = fullThresholdMs / 2;

        boolean halfShown = prefs.getBoolean(DAILY_HALF_SHOWN_KEY, false);
        boolean limitReached = prefs.getBoolean(DAILY_LIMIT_REACHED_KEY, false);

        // Check if vacation mode is enabled - if so, don't show any overlays
        ContentMonitorModule module = ContentMonitorModule.getInstance();
        if (module != null && module.isVacationMode()) {
            Log.d(TAG, "Vacation mode is enabled, skipping overlay display");
            return;
        }

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
    }

    private WritableMap createEventMap(String status, String platform, long totalTime) {
        WritableMap map = Arguments.createMap();
        map.putString("status", status);
        map.putDouble("totalTimeSpent", totalTime / 1000.0); // Convert to seconds
        if (platform != null) {
            map.putString("platform", platform);
        }
        return map;
    }

    private WritableMap createTimeUpdateMap(long currentSessionTime, String platform) {
        WritableMap map = Arguments.createMap();
        map.putDouble("currentSessionTime", currentSessionTime / 1000.0);
        map.putDouble("totalTimeSpent", getTotalTimeSpent() / 1000.0);
        if (platform != null) {
            map.putString("platform", platform);
        }
        // Include per-platform stats
        map.putDouble("instagramTimeToday", prefs.getLong(INSTAGRAM_DAILY_MS_KEY, 0) / 1000.0);
        map.putDouble("youtubeTimeToday", prefs.getLong(YOUTUBE_DAILY_MS_KEY, 0) / 1000.0);
        return map;
    }

    private void updateTotalTimeSpent(long sessionTime, String platform) {
        long totalTime = prefs.getLong(TOTAL_TIME_KEY, 0) + sessionTime;
        int sessionCount = prefs.getInt(SESSION_COUNT_KEY, 0) + 1;
        String currentDate = java.text.DateFormat.getDateInstance().format(new java.util.Date());

        SharedPreferences.Editor editor = prefs.edit()
            .putLong(TOTAL_TIME_KEY, totalTime)
            .putInt(SESSION_COUNT_KEY, sessionCount)
            .putString(LAST_SESSION_DATE_KEY, currentDate);

        // Update per-platform daily stats
        if (PLATFORM_INSTAGRAM.equals(platform)) {
            long instagramToday = prefs.getLong(INSTAGRAM_DAILY_MS_KEY, 0) + sessionTime;
            editor.putLong(INSTAGRAM_DAILY_MS_KEY, instagramToday);
        } else if (PLATFORM_YOUTUBE.equals(platform)) {
            long youtubeToday = prefs.getLong(YOUTUBE_DAILY_MS_KEY, 0) + sessionTime;
            editor.putLong(YOUTUBE_DAILY_MS_KEY, youtubeToday);
        }

        editor.apply();

        Log.d(TAG, "Updated total time: " + (totalTime / 1000) + " seconds, Session count: " + sessionCount + ", Platform: " + platform);

        // Send updated stats to React Native
        WritableMap statsMap = Arguments.createMap();
        statsMap.putDouble("totalTime", totalTime / 1000.0);
        statsMap.putInt("sessionCount", sessionCount);
        statsMap.putString("lastSessionDate", currentDate);
        if (platform != null) {
            statsMap.putString("platform", platform);
        }
        statsMap.putDouble("instagramTimeToday", prefs.getLong(INSTAGRAM_DAILY_MS_KEY, 0) / 1000.0);
        statsMap.putDouble("youtubeTimeToday", prefs.getLong(YOUTUBE_DAILY_MS_KEY, 0) / 1000.0);
        sendEventToReactNative("ContentStatsUpdate", statsMap);
    }

    private long getTotalTimeSpent() {
        return prefs.getLong(TOTAL_TIME_KEY, 0);
    }

    private void sendEventToReactNative(String eventName, WritableMap params) {
        try {
            ContentMonitorModule module = ContentMonitorModule.getInstance();
            if (module != null) {
                module.sendEventToReactNative(eventName, params);
            } else {
                Log.w(TAG, "ContentMonitorModule instance is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to send event to React Native: " + eventName, e);
        }
    }

    private void onExitContentIfNeeded() {
        if (isInContent) {
            long sessionTime = System.currentTimeMillis() - contentStartTime;
            updateTotalTimeSpent(sessionTime, currentPlatform);
            // Accumulate into today's counter (shared across platforms)
            long accumulatedToday = prefs.getLong(DAILY_ACCUMULATED_MS_KEY, 0);
            prefs.edit().putLong(DAILY_ACCUMULATED_MS_KEY, accumulatedToday + sessionTime).apply();
            isInContent = false;
            contentStartTime = 0;
            currentPlatform = null;
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
                .putLong(INSTAGRAM_DAILY_MS_KEY, 0)
                .putLong(YOUTUBE_DAILY_MS_KEY, 0)
                .putBoolean(DAILY_HALF_SHOWN_KEY, false)
                .putBoolean(DAILY_LIMIT_REACHED_KEY, false)
                .apply();
            Log.d(TAG, "Daily state reset for date: " + today);
        }
    }

    private long getConfiguredLimitMs() {
        long defaultMinutes = 5; // default 5 minutes
        ContentMonitorModule module = ContentMonitorModule.getInstance();
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

        if (!isCurrentPlatformSectionActive()) {
            Log.d(TAG, "Skipping overlay because tracked section is not active for platform: " + currentPlatform);
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
            sendEventToReactNative("ContentEvent", createEventMap("Overlay Shown", currentPlatform, getTotalTimeSpent()));
        } catch (Exception e) {
            Log.e(TAG, "Failed to display overlay", e);
        }
    }

    private View createCustomOverlay(long totalElapsedMsToday, boolean allowClose) {
        long limitMs = getConfiguredLimitMs();
        long remainingMs = Math.max(0, limitMs - totalElapsedMsToday);
        // Get configuration from React Native
        ContentMonitorModule module = ContentMonitorModule.getInstance();
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
        String titleMessage = "Stop Doom Scrolling.\n Make time for what\ntruly matters.";
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
                    tv.setText("* " + item);
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
                boolean stillInContent = false;
                if (currentRoot != null) {
                    if (PLATFORM_INSTAGRAM.equals(currentPlatform) && isReelsSectionActive(currentRoot)) {
                        stillInContent = true;
                    } else if (PLATFORM_YOUTUBE.equals(currentPlatform) && isYouTubeShortsActive(currentRoot)) {
                        stillInContent = true;
                    }
                }
                if (stillInContent) {
                    isInContent = true;
                    contentStartTime = System.currentTimeMillis();
                    Log.d(TAG, "Overlay dismissed, continue tracking");
                    sendEventToReactNative("ContentEvent", createEventMap("Overlay Dismissed", currentPlatform, getTotalTimeSpent()));
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
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                boolean result = isReelsSectionActive(child);
                child.recycle();
                if (result) return true;
            }
        }
        return false;
    }

    private boolean isYouTubeShortsActive(AccessibilityNodeInfo node) {
        if (node == null) return false;

        String textLower = "";
        CharSequence text = node.getText();
        if (text != null) {
            textLower = text.toString().toLowerCase(java.util.Locale.US).trim();
        }

        String descLower = "";
        CharSequence contentDesc = node.getContentDescription();
        if (contentDesc != null) {
            descLower = contentDesc.toString().toLowerCase(java.util.Locale.US);
        }

        String viewIdLower = "";
        String viewId = node.getViewIdResourceName();
        if (viewId != null) {
            viewIdLower = viewId.toLowerCase(java.util.Locale.US);
        }

        // Only treat tab indicators as Shorts when the Shorts tab is selected.
        boolean isShortsTabNode =
            textLower.equals("shorts") ||
            (descLower.contains("shorts") && descLower.contains("tab")) ||
            (viewIdLower.contains("pivot_bar") && textLower.equals("shorts"));
        boolean isSelectedShortsTab = isShortsTabNode && (node.isSelected() || descLower.contains("selected"));
        if (isSelectedShortsTab) {
            return true;
        }

        // Strong Shorts player indicators (avoids false positives on Home/long-form pages).
        if (descLower.contains("shorts player") ||
            (descLower.contains("shorts") && descLower.contains("player"))) {
            return true;
        }
        if (viewIdLower.contains("reel_player") ||
            viewIdLower.contains("shorts_player") ||
            viewIdLower.contains("shorts_video") ||
            viewIdLower.contains("shorts_reel")) {
            return true;
        }

        // Recursive check on children
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                boolean result = isYouTubeShortsActive(child);
                child.recycle();
                if (result) return true;
            }
        }

        return false;
    }

    private boolean isCurrentPlatformSectionActive() {
        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode == null) return false;

        if (PLATFORM_INSTAGRAM.equals(currentPlatform)) {
            return isReelsSectionActive(rootNode);
        }

        if (PLATFORM_YOUTUBE.equals(currentPlatform)) {
            return isYouTubeShortsActive(rootNode);
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
