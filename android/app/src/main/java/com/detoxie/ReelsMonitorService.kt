package com.detoxie

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class ReelsMonitorService : AccessibilityService() {

    companion object {
        private const val TAG = "ReelsMonitorService"
        private const val INSTAGRAM_PACKAGE = "com.instagram.android"
    }

     override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val packageName = event?.packageName?.toString() ?: return

        if (packageName == INSTAGRAM_PACKAGE) {
            val rootNode = rootInActiveWindow
            if (rootNode != null && isReelsSectionActive(rootNode)) {
                Log.d(TAG, "User is in Instagram Reels section")
            }
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
