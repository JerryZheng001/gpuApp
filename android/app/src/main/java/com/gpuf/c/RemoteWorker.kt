package com.gpuf.c

object RemoteWorker {
  init {
    System.loadLibrary("gpuf_c_sdk_v9")
  }

  external fun setRemoteWorkerModel(modelPath: String): Int
  external fun startRemoteWorker(
    serverAddr: String,
    controlPort: Int,
    proxyPort: Int,
    workerType: String,
    clientId: String
  ): Int
  external fun startRemoteWorkerTasks(): Int
  external fun getRemoteWorkerStatus(): String
  external fun stopRemoteWorker(): Int
}


