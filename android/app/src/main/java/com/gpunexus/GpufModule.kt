package com.gpunexus

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.gpuf.c.GPUEngine
import com.gpuf.c.RemoteWorker

class GpufModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private val TAG = "GpufModule"
  private var emitter: RemoteWorkerEmitter? = null

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
      // Pass null for outputBuffer as it's optional in the new API
      val result = GPUEngine.generate(modelPtr.toLong(), contextPtr.toLong(), prompt, maxTokens, null)
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

  @ReactMethod
  fun setRemoteWorkerModel(modelPath: String, promise: Promise) {
    try {
      val result = RemoteWorker.setRemoteWorkerModel(modelPath)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("REMOTE_WORKER_SET_MODEL_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun startRemoteWorker(
    serverAddr: String,
    controlPort: Int,
    proxyPort: Int,
    workerType: String,
    clientId: String,
    promise: Promise
  ) {
    try {
      val result = RemoteWorker.startRemoteWorker(serverAddr, controlPort, proxyPort, workerType, clientId)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("REMOTE_WORKER_START_ERROR", e.message, e)
    }
  }

  /**
   * 注册回调 emitter（建议在应用启动时或首次分享前调用一次）
   */
  @ReactMethod
  fun registerEmitter(promise: Promise) {
    try {
      if (emitter == null) {
        emitter = RemoteWorkerEmitter(reactApplicationContext)
        Log.d(TAG, "创建 RemoteWorkerEmitter")
      }
      
      val result = RemoteWorker.registerCallbackEmitter(emitter!!)
      if (result == 0) {
        Log.d(TAG, "✅ 成功注册回调 emitter")
        promise.resolve(result)
      } else {
        Log.e(TAG, "❌ 注册回调 emitter 失败，返回码: $result")
        promise.reject("REGISTER_EMITTER_ERROR", "注册 emitter 失败，返回码: $result")
      }
    } catch (e: Exception) {
      Log.e(TAG, "注册 emitter 时出错", e)
      promise.reject("REGISTER_EMITTER_ERROR", e.message, e)
    }
  }

  /**
   * 启动后台任务处理线程（使用已注册的 Java emitter 回调）
   */
  @ReactMethod
  fun startRemoteWorkerTasks(promise: Promise) {
    try {
      // 如果还没有注册 emitter，先注册
      if (emitter == null) {
        Log.d(TAG, "自动注册 emitter...")
        emitter = RemoteWorkerEmitter(reactApplicationContext)
        val registerResult = RemoteWorker.registerCallbackEmitter(emitter!!)
        if (registerResult != 0) {
          Log.w(TAG, "自动注册 emitter 失败，返回码: $registerResult，将使用无回调模式")
          // 如果注册失败，回退到无回调模式
          val result = RemoteWorker.startRemoteWorkerTasks(0L)
          promise.resolve(result)
          return
        }
      }
      
      // 使用新的方法启动任务（会自动使用已注册的 emitter）
      val result = RemoteWorker.startRemoteWorkerTasksWithJavaCallback()
      Log.d(TAG, "startRemoteWorkerTasksWithJavaCallback 返回结果: $result")
      promise.resolve(result)
    } catch (e: Exception) {
      Log.e(TAG, "启动后台任务失败", e)
      // 如果新方法失败，尝试回退到无回调模式
      try {
        val fallbackResult = RemoteWorker.startRemoteWorkerTasks(0L)
        Log.w(TAG, "回退到无回调模式，返回结果: $fallbackResult")
        promise.resolve(fallbackResult)
      } catch (fallbackError: Exception) {
        promise.reject("REMOTE_WORKER_START_TASKS_ERROR", e.message, e)
      }
    }
  }

  @ReactMethod
  fun getRemoteWorkerStatus(promise: Promise) {
    try {
      val status = RemoteWorker.getRemoteWorkerStatus()
      promise.resolve(status)
    } catch (e: Exception) {
      promise.reject("REMOTE_WORKER_STATUS_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopRemoteWorker(promise: Promise) {
    try {
      val result = RemoteWorker.stopRemoteWorker()
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("REMOTE_WORKER_STOP_ERROR", e.message, e)
    }
  }
}