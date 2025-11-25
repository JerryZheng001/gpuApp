package com.pocketpal

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GpufModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "GpufModule"

  @ReactMethod
  fun init(promise: Promise) {
    try {
      val result = GpufNative.init()
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_INIT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getVersion(promise: Promise) {
    try {
      val version = GpufNative.getVersion()
      promise.resolve(version)
    } catch (e: Exception) {
      promise.reject("GPUF_VERSION_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun llmInit(modelPath: String, ctxSize: Int, gpuLayers: Int, promise: Promise) {
    try {
      val result = GpufNative.llmInit(modelPath, ctxSize, gpuLayers)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_LLM_INIT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun llmGenerate(prompt: String, maxTokens: Double, promise: Promise) {
    try {
      val result = GpufNative.llmGenerate(prompt, maxTokens.toLong())
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_LLM_GENERATE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getLastError(promise: Promise) {
    try {
      val err = GpufNative.getLastError()
      promise.resolve(err)
    } catch (e: Exception) {
      promise.reject("GPUF_LAST_ERROR", e.message, e)
    }
  }
}