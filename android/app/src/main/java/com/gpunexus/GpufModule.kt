package com.gpunexus

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.gpuf.c.GPUEngine

class GpufModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "GpufModule"

  @ReactMethod
  fun init(promise: Promise) {
    try {
      val result = GPUEngine.gpuf_init()
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_INIT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getVersion(promise: Promise) {
    try {
      val version = GPUEngine.getVersion()
      promise.resolve(version)
    } catch (e: Exception) {
      promise.reject("GPUF_VERSION_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun getSystemInfo(promise: Promise) {
    try {
      val info = GPUEngine.getSystemInfo()
      promise.resolve(info)
    } catch (e: Exception) {
      promise.reject("GPUF_SYSTEM_INFO_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun initialize(promise: Promise) {
    try {
      val result = GPUEngine.initialize()
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_INITIALIZE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun loadModel(modelPath: String, promise: Promise) {
    try {
      val result = GPUEngine.loadModel(modelPath)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_LOAD_MODEL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun createContext(modelPtr: Double, promise: Promise) {
    try {
      val result = GPUEngine.createContext(modelPtr.toLong())
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_CREATE_CONTEXT_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun generate(modelPtr: Double, contextPtr: Double, prompt: String, maxTokens: Int, promise: Promise) {
    try {
      val result = GPUEngine.generate(modelPtr.toLong(), contextPtr.toLong(), prompt, maxTokens)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_GENERATE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun cleanup(promise: Promise) {
    try {
      val result = GPUEngine.cleanup()
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GPUF_CLEANUP_ERROR", e.message, e)
    }
  }
}