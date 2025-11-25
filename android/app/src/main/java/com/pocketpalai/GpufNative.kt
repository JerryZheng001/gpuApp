package com.pocketpal

object GpufNative {
  init {
    System.loadLibrary("gpuf-jni")
  }

  external fun init(): Int
  external fun getLastError(): String
  external fun getVersion(): String
  external fun llmInit(modelPath: String, ctxSize: Int, gpuLayers: Int): Int
  external fun llmGenerate(prompt: String, maxTokens: Long): String
}