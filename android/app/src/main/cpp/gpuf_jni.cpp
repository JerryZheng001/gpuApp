#include <jni.h>
extern "C" {
#include "gpuf_c.h"
}

extern "C" JNIEXPORT jint JNICALL
Java_com_pocketpalai_GpufNative_init(JNIEnv *env, jclass clazz) {
  return gpuf_init();
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_pocketpalai_GpufNative_getLastError(JNIEnv *env, jclass clazz) {
  char *err = gpuf_get_last_error();
  if (err == nullptr) {
    return env->NewStringUTF("");
  }
  jstring jerr = env->NewStringUTF(err);
  gpuf_free_string(err);
  return jerr;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_pocketpalai_GpufNative_getVersion(JNIEnv *env, jclass clazz) {
  const char *ver = gpuf_version();
  if (ver == nullptr) {
    return env->NewStringUTF("");
  }
  return env->NewStringUTF(ver);
}

extern "C" JNIEXPORT jint JNICALL
Java_com_pocketpalai_GpufNative_llmInit(JNIEnv *env, jclass clazz, jstring jModelPath,
                                       jint jCtxSize, jint jGpuLayers) {
  const char *modelPath = env->GetStringUTFChars(jModelPath, nullptr);
  if (modelPath == nullptr) {
    return -1;
  }
  int32_t res = gpuf_llm_init(modelPath, (uint32_t)jCtxSize, (uint32_t)jGpuLayers);
  env->ReleaseStringUTFChars(jModelPath, modelPath);
  return res;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_pocketpalai_GpufNative_llmGenerate(JNIEnv *env, jclass clazz, jstring jPrompt,
                                            jlong jMaxTokens) {
  const char *prompt = env->GetStringUTFChars(jPrompt, nullptr);
  if (prompt == nullptr) {
    return env->NewStringUTF("");
  }
  char *result = gpuf_llm_generate(prompt, (uintptr_t)jMaxTokens);
  env->ReleaseStringUTFChars(jPrompt, prompt);

  if (result == nullptr) {
    return env->NewStringUTF("");
  }
  jstring jResult = env->NewStringUTF(result);
  gpuf_free_string(result);
  return jResult;
}