cmake_minimum_required(VERSION 3.22.1)

project("gpuf-jni")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Prebuilt GPUF library
add_library(gpuf_c SHARED IMPORTED)
set_target_properties(gpuf_c PROPERTIES
  IMPORTED_LOCATION "${CMAKE_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libgpuf_c.so"
)

add_library(gpuf-jni SHARED gpuf_jni.cpp)

find_library(log-lib log)

target_link_libraries(gpuf-jni gpuf_c ${log-lib})