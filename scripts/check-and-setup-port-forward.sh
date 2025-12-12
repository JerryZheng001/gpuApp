#!/bin/bash

# Smart script that checks if port forwarding is needed and sets it up automatically
# This is called automatically by yarn android to ensure port forwarding is always set

set +e  # Don't exit on error, we want to continue even if port forwarding check fails

# Check if adb is available
if ! command -v adb &> /dev/null; then
    # If adb is not available, just continue (might be iOS or emulator)
    exit 0
fi

# Check if port forwarding already exists
EXISTING_FORWARD=$(adb reverse --list 2>/dev/null | grep "tcp:8081" || true)

if [ -n "$EXISTING_FORWARD" ]; then
    # Port forwarding already exists, no need to set it up
    exit 0
fi

# Check if there are any connected devices
DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    # No devices connected, might be emulator or iOS, just continue
    exit 0
fi

# Port forwarding doesn't exist and we have devices, set it up
echo "🔧 Auto-setting up port forwarding for connected device(s)..."
for DEVICE in $DEVICES; do
    adb -s "$DEVICE" reverse tcp:8081 tcp:8081 2>/dev/null && echo "   ✓ Port forwarding set up for $DEVICE" || true
done

exit 0

