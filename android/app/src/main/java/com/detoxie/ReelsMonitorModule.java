package com.detoxie;

import android.content.Intent;
import android.provider.Settings;
import android.util.Log;
import android.net.Uri;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

@ReactModule(name = ReelsMonitorModule.NAME)
public class ReelsMonitorModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ReelsMonitorModule";
    private static final String TAG = "ReelsMonitorModule";

    public ReelsMonitorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void startMonitoring(Promise promise) {
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
    public void checkAccessibilityPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.resolve("Opened accessibility settings for verification");
        } catch (Exception e) {
            Log.e(TAG, "Failed to open accessibility settings", e);
            promise.reject("ERROR", "Failed to check accessibility permission: " + e.getMessage());
        }
    }

    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        boolean hasPermission = Settings.canDrawOverlays(getReactApplicationContext());
        if (!hasPermission) {
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
        } else {
            promise.resolve("Overlay permission granted");
        }
    }
}