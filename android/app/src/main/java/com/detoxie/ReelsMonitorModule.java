package com.detoxie;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = ReelsMonitorModule.NAME)
public class ReelsMonitorModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ReelsMonitorModule";
    private static final String TAG = "ReelsMonitorModule";
    private static ReelsMonitorModule instance;

    public ReelsMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        instance = this;
    }

    @Override
    public String getName() {
        return NAME;
    }

    public static ReelsMonitorModule getInstance() {
        return instance;
    }

    public void sendEventToReactNative(String eventName, WritableMap params) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            if (context != null && context.hasActiveCatalystInstance()) {
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
                Log.d(TAG, "Event sent to React Native: " + eventName);
            } else {
                Log.w(TAG, "ReactContext is null or not active, cannot send event: " + eventName);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to send event to React Native: " + eventName, e);
        }
    }

    @ReactMethod
    public void checkAccessibilityPermission(Promise promise) {
        try {
            boolean isEnabled = isAccessibilityServiceEnabled();
            if (isEnabled) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to check accessibility permission", e);
            promise.reject("ERROR", "Failed to check accessibility permission: " + e.getMessage());
        }
    }

    @ReactMethod
    public void requestAccessibilityPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve("Opened accessibility settings");
        } catch (Exception e) {
            Log.e(TAG, "Failed to open accessibility settings", e);
            promise.reject("ERROR", "Failed to open accessibility settings: " + e.getMessage());
        }
    }

    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        try {
            boolean hasPermission = Settings.canDrawOverlays(getReactApplicationContext());
            if (hasPermission) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to check overlay permission", e);
            promise.reject("ERROR", "Failed to check overlay permission: " + e.getMessage());
        }
    }

    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve("Opened overlay permission settings");
        } catch (Exception e) {
            Log.e(TAG, "Failed to open overlay permission settings", e);
            promise.reject("ERROR", "Failed to open overlay permission settings: " + e.getMessage());
        }
    }  

    @ReactMethod
    public void startMonitoring(Promise promise) {
        try {
            boolean accessibilityEnabled = isAccessibilityServiceEnabled();
            boolean overlayEnabled = isOverlayPermissionGranted();

            if (!accessibilityEnabled || !overlayEnabled) {
                promise.reject("PERMISSION_ERROR", "Accessibility or overlay permission not granted");
                return;
            }
            
            promise.resolve("Monitoring started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start monitoring", e);
            promise.reject("ERROR", "Failed to start monitoring: " + e.getMessage());
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        String service = getReactApplicationContext().getPackageName() + "/" + ReelsMonitorService.class.getCanonicalName();
        String enabledServices = Settings.Secure.getString(
            getReactApplicationContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        
        return enabledServices != null && enabledServices.contains(service);
    }

    private boolean isOverlayPermissionGranted() {
        return Settings.canDrawOverlays(getReactApplicationContext());
    }
}