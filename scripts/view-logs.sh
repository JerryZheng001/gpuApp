#!/bin/bash
# 查看 React Native 应用日志

echo "选择日志查看方式："
echo "1. React Native 日志（推荐）"
echo "2. 所有 Android 日志"
echo "3. 只查看错误日志"
echo "4. 实时查看日志（按 Ctrl+C 退出）"
echo ""
read -p "请选择 (1-4): " choice

case $choice in
  1)
    echo "查看 React Native 日志..."
    adb logcat | grep -E "ReactNativeJS|ReactNative|JS"
    ;;
  2)
    echo "查看所有日志..."
    adb logcat
    ;;
  3)
    echo "查看错误日志..."
    adb logcat *:E
    ;;
  4)
    echo "实时查看日志（按 Ctrl+C 退出）..."
    adb logcat | grep -E "ReactNativeJS|ReactNative|JS|Error|Exception"
    ;;
  *)
    echo "无效选择"
    ;;
esac
