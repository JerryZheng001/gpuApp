#!/bin/bash

# Script to set up port forwarding for React Native development on Android devices
# This allows the device to connect to Metro bundler running on the development machine

echo "Setting up port forwarding for React Native development..."

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "Error: adb is not installed or not in PATH"
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# Get connected devices
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo "No Android devices found. Please connect a device via USB or start an emulator."
    exit 1
fi

# Set up port forwarding for each device
for DEVICE in $DEVICES; do
    echo "Setting up port forwarding for device: $DEVICE"
    
    # Forward Metro bundler port (8081)
    adb -s "$DEVICE" reverse tcp:8081 tcp:8081
    
    # Optional: Forward other common ports if needed
    # adb -s "$DEVICE" reverse tcp:8082 tcp:8082
    
    if [ $? -eq 0 ]; then
        echo "✓ Port forwarding set up successfully for $DEVICE"
    else
        echo "✗ Failed to set up port forwarding for $DEVICE"
    fi
done

echo ""
echo "Port forwarding setup complete!"
echo "You can now reload the app on your device."
echo ""
echo "To verify, run: adb reverse --list"

