#!/bin/bash

# Script to set up port forwarding for React Native development on Android devices
# This allows the device to connect to Metro bundler running on the development machine

set -e

echo "🔧 Setting up port forwarding for React Native development..."
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb is not installed or not in PATH"
    echo "Please install Android SDK Platform Tools:"
    echo "  - macOS: brew install android-platform-tools"
    echo "  - Or download from: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

# Restart adb server to ensure clean state
echo "🔄 Restarting ADB server..."
adb kill-server 2>/dev/null || true
adb start-server

# Wait a moment for adb to initialize
sleep 1

# Get connected devices
echo "📱 Checking for connected devices..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo "❌ No Android devices found."
    echo ""
    echo "Please ensure:"
    echo "  1. Device is connected via USB"
    echo "  2. USB debugging is enabled on the device"
    echo "  3. You have authorized the computer on the device"
    echo ""
    echo "To check devices manually, run: adb devices"
    exit 1
fi

echo "✓ Found $(echo "$DEVICES" | wc -l | tr -d ' ') device(s)"
echo ""

# Remove existing port forwards first (to avoid conflicts)
echo "🧹 Cleaning up existing port forwards..."
for DEVICE in $DEVICES; do
    adb -s "$DEVICE" reverse --remove tcp:8081 2>/dev/null || true
done

# Set up port forwarding for each device
SUCCESS_COUNT=0
for DEVICE in $DEVICES; do
    DEVICE_NAME=$(adb -s "$DEVICE" shell getprop ro.product.model 2>/dev/null || echo "Unknown")
    echo "📲 Setting up port forwarding for device: $DEVICE ($DEVICE_NAME)"
    
    # Forward Metro bundler port (8081)
    if adb -s "$DEVICE" reverse tcp:8081 tcp:8081; then
        echo "   ✓ Port 8081 forwarded successfully"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ✗ Failed to set up port forwarding"
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ Port forwarding setup complete!"
    echo ""
    echo "You can now:"
    echo "  1. Start Metro bundler: yarn start"
    echo "  2. Reload the app on your device (shake device and press 'Reload')"
    echo ""
    echo "To verify port forwarding, run: adb reverse --list"
else
    echo "❌ Failed to set up port forwarding for any device"
    exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

