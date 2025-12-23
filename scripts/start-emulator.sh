#!/bin/bash

# Script to start Android emulator
# Usage: ./scripts/start-emulator.sh [AVD_NAME]

set -e

EMULATOR_PATH="/Users/max/Library/Android/sdk/emulator/emulator"

# Check if emulator exists
if [ ! -f "$EMULATOR_PATH" ]; then
    echo "❌ 错误: 找不到 Android 模拟器"
    echo "   请确保 Android SDK 已正确安装"
    exit 1
fi

# List available AVDs
echo "📱 可用的 Android 模拟器:"
AVDS=$("$EMULATOR_PATH" -list-avds 2>/dev/null)

if [ -z "$AVDS" ]; then
    echo "   ❌ 没有找到可用的模拟器"
    echo "   请使用 Android Studio 创建 AVD"
    exit 1
fi

# Display available AVDs
echo "$AVDS" | while read -r avd; do
    echo "   - $avd"
done

# Get AVD name from argument or use first available
AVD_NAME="${1:-$(echo "$AVDS" | head -n1)}"

# Check if AVD exists
if ! echo "$AVDS" | grep -q "^${AVD_NAME}$"; then
    echo "❌ 错误: 模拟器 '$AVD_NAME' 不存在"
    exit 1
fi

# Check if emulator is already running
if pgrep -f "emulator.*$AVD_NAME" > /dev/null; then
    echo "⚠️  模拟器 '$AVD_NAME' 已经在运行中"
    exit 0
fi

# Start emulator
echo ""
echo "🚀 正在启动模拟器: $AVD_NAME"
echo "   这可能需要一些时间，请稍候..."
echo ""

"$EMULATOR_PATH" -avd "$AVD_NAME" > /dev/null 2>&1 &

# Wait for emulator to boot
echo "⏳ 等待模拟器启动..."
sleep 5

# Wait for device to be ready
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if adb devices | grep -q "emulator.*device$"; then
        echo "✅ 模拟器已启动并准备就绪！"
        adb devices
        exit 0
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    if [ $((WAITED % 10)) -eq 0 ]; then
        echo "   等待中... ($WAITED/$MAX_WAIT 秒)"
    fi
done

echo "⚠️  模拟器启动超时，但可能仍在启动中"
echo "   请检查模拟器窗口或运行 'adb devices' 查看状态"
adb devices

