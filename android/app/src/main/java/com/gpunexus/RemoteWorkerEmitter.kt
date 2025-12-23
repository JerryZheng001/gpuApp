package com.gpunexus

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * RemoteWorkerEmitter - 将 native 回调消息转发到 React Native
 * 
 * 这个类实现了 SDK 要求的 emit(String message) 方法，
 * 用于接收来自 C++ SDK 的状态更新消息，并通过 React Native 的
 * DeviceEventEmitter 发送到 JavaScript 层。
 */
class RemoteWorkerEmitter(
    private val reactContext: ReactApplicationContext
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val TAG = "RemoteWorkerEmitter"

    /**
     * 接收来自 native 层的状态消息并转发到 React Native
     * 
     * @param message 状态消息字符串，例如：
     *   - "STARTING - Initializing background tasks..."
     *   - "HEARTBEAT - Sending heartbeat to server"
     *   - "LOGIN_SUCCESS - Login successful"
     *   - "INFERENCE_START - Task: xxx-xxx-xxx"
     *   - "INFERENCE_SUCCESS - Task: xxx-xxx-xxx in XXXms"
     */
    fun emit(message: String) {
        Log.d(TAG, "收到 native 回调消息: $message")
        
        // 建议切到主线程再发给 JS（更稳）
        mainHandler.post {
            try {
                val params = com.facebook.react.bridge.Arguments.createMap()
                params.putString("message", message)
                
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("RemoteWorkerEvent", params)
                
                Log.d(TAG, "已发送事件到 React Native: $message")
            } catch (e: Exception) {
                Log.e(TAG, "发送事件到 React Native 失败", e)
            }
        }
    }
}

