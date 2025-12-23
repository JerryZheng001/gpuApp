#!/bin/bash

# Script to fix Metro bundler connection issues
# This script sets up port forwarding and verifies the connection

set -e

echo "🔧 修复 Metro bundler 连接问题..."

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ 错误: adb 未找到，请确保 Android SDK 已正确安装"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo "❌ 错误: 没有检测到已连接的 Android 设备"
    echo "   请确保："
    echo "   1. 设备已通过 USB 连接"
    echo "   2. 已启用 USB 调试"
    echo "   3. 已授权此电脑的调试权限"
    exit 1
fi

echo "✓ 检测到设备: $DEVICES"

# Remove existing port forwarding (if any)
echo "🔧 清理旧的端口转发..."
adb reverse --remove tcp:8081 2>/dev/null || true

# Set up port forwarding
echo "🔧 设置端口转发 (8081 -> 8081)..."
for DEVICE in $DEVICES; do
    if adb -s "$DEVICE" reverse tcp:8081 tcp:8081; then
        echo "   ✓ 端口转发已设置: $DEVICE"
    else
        echo "   ❌ 端口转发设置失败: $DEVICE"
        exit 1
    fi
done

# Verify port forwarding
echo "🔧 验证端口转发..."
FORWARD_LIST=$(adb reverse --list 2>/dev/null | grep "tcp:8081" || true)
if [ -n "$FORWARD_LIST" ]; then
    echo "   ✓ 端口转发验证成功:"
    echo "     $FORWARD_LIST"
else
    echo "   ⚠️  警告: 无法验证端口转发，但可能已设置成功"
fi

# Check if Metro is running
echo "🔧 检查 Metro bundler 状态..."
if pgrep -f "react-native start" > /dev/null || pgrep -f "metro" > /dev/null; then
    echo "   ✓ Metro bundler 正在运行"
else
    echo "   ⚠️  警告: Metro bundler 似乎没有运行"
    echo "   请运行: yarn start"
fi

echo ""
echo "✅ 修复完成！"
echo ""
echo "下一步："
echo "1. 确保 Metro bundler 正在运行: yarn start"
echo "2. 重新加载应用（摇一摇设备，选择 'Reload'）"
echo "3. 或者重新安装应用: yarn android"

