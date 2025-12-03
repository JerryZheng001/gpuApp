cmake_minimum_required(VERSION 3.22.1)

project("gpuf-jni")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Since we have prebuilt libgpuf-jni.so, no need to build local JNI
# The library is already in jniLibs directory and will be loaded directly