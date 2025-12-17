package com.gpuf.c

object GPUEngine {
  init {
    System.loadLibrary("gpuf_c_sdk_v9")
  }

  external fun gpuf_init(): Int
  external fun cleanup(): Int
  external fun getVersion(): String
  external fun getSystemInfo(): String
  external fun initialize(): Int
  external fun loadModel(modelPath: String): Long
  external fun createContext(modelPtr: Long): Long
  external fun generate(modelPtr: Long, contextPtr: Long, prompt: String, maxTokens: Int, outputBuffer: Any?): Int
}