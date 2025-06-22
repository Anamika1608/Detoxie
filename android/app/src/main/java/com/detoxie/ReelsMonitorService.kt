package com.detoxie

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class ReelsMonitorService : AccessibilityService() {

    companion object {
        private const val TAG = "ReelsMonitorService"
        private const val INSTAGRAM_PACKAGE = "com.instagram.android"
        private const val TIME_THRESHOLD = 2 * 60 * 1000L // 5 minutes in milliseconds
    }

    private var reelsStartTime: Long = 0
    private var isInReels = false

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val packageName = event?.packageName?.toString() ?: return
        val rootNode = rootInActiveWindow ?: return

        if (packageName == INSTAGRAM_PACKAGE && isReelsSectionActive(rootNode)) {
            if (!isInReels) {
                // Entering Reels section
                isInReels = true
                reelsStartTime = System.currentTimeMillis()
                Log.d(TAG, "Started tracking Reels time")
            }

            if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
                val timeSpent = System.currentTimeMillis() - reelsStartTime
                if (timeSpent >= TIME_THRESHOLD) {
                    Log.d(TAG, "User has spent 2 minutes scrolling Reels!")
                    // Reset 
                    // reelsStartTime = System.currentTimeMillis()
                }
            }
        } else if (isInReels) {
            // Exiting Reels section
            isInReels = false
            val timeSpent = System.currentTimeMillis() - reelsStartTime
            Log.d(TAG, "Left Reels section. Time spent: ${timeSpent / 1000} seconds")
            reelsStartTime = 0
        }
    }

    private fun isReelsSectionActive(node: AccessibilityNodeInfo?): Boolean {
        if (node == null) return false

        val text = node.text?.toString()?.lowercase()
        if (text?.contains("reels") == true) {
            return true
        }

        for (i in 0 until node.childCount) {
            if (isReelsSectionActive(node.getChild(i))) {
                return true
            }
        }

        return false
    }


    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Service connected")
    }
}
