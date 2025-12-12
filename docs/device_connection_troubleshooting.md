# 真机连接问题排查指南

## 问题描述

在真机上运行应用时，可能会遇到以下错误：
```
Unable to load script. Make sure you're either running Metro (run 'npx react-native start') 
or that your bundle 'index.android.bundle' is packaged correctly for release.
```

## 常见原因

### 1. Android 设备 - 端口转发未设置

**问题**：Android 真机需要通过 USB 调试端口转发才能连接到开发机器上的 Metro bundler。

**解决方案**：

#### 方法一：使用便捷脚本（推荐）
```bash
# 设置端口转发
yarn setup:android

# 或者直接运行 Android 应用（会自动设置端口转发）
yarn android:device
```

#### 方法二：手动设置
```bash
# 检查设备是否连接
adb devices

# 设置端口转发（将设备的 8081 端口转发到开发机器的 8081 端口）
adb reverse tcp:8081 tcp:8081

# 验证端口转发是否成功
adb reverse --list
```

**注意事项**：
- 每次重新连接设备或重启 adb 后，都需要重新设置端口转发
- 如果连接了多个设备，需要为每个设备单独设置

### 2. iOS 设备 - 网络配置问题

**问题**：iOS 真机需要和开发机器在同一 WiFi 网络，或者需要配置正确的 IP 地址。

**解决方案**：

1. **确保设备和开发机器在同一 WiFi 网络**

2. **查找开发机器的 IP 地址**：
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # 或者
   ipconfig getifaddr en0
   ```

3. **在 Xcode 中配置**：
   - 打开 Xcode
   - 选择你的项目
   - 在 Build Settings 中搜索 "Bundle URL"
   - 确保 Debug 配置使用正确的 IP 地址

4. **或者使用环境变量**：
   ```bash
   # 启动 Metro bundler 时指定 IP
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.xxx yarn start
   ```

### 3. Metro Bundler 未正确启动

**检查步骤**：

1. **确认 Metro bundler 正在运行**：
   ```bash
   # 应该能看到 Metro bundler 的输出
   yarn start
   ```

2. **检查端口是否被占用**：
   ```bash
   # macOS/Linux
   lsof -i :8081
   
   # 如果端口被占用，可以杀掉进程
   kill -9 $(lsof -t -i:8081)
   ```

3. **清除缓存并重启**：
   ```bash
   yarn start:reset
   ```

### 4. 防火墙或安全设置阻止连接

**解决方案**：

- **macOS**：系统偏好设置 > 安全性与隐私 > 防火墙
- **Windows**：Windows Defender 防火墙设置
- 确保允许 Node.js 和 Metro bundler 通过防火墙

### 5. 网络配置问题

**检查清单**：

- [ ] 设备和开发机器在同一网络（iOS）
- [ ] USB 调试已启用（Android）
- [ ] 端口转发已设置（Android）
- [ ] Metro bundler 正在运行
- [ ] 防火墙未阻止连接
- [ ] 没有 VPN 或代理干扰

## 快速修复步骤

### Android 设备

```bash
# 1. 停止所有服务
pkill -f "react-native" || true
pkill -f "metro" || true

# 2. 设置端口转发
yarn setup:android

# 3. 启动 Metro bundler
yarn start:reset

# 4. 在另一个终端运行应用
yarn android
```

### iOS 设备

```bash
# 1. 停止所有服务
pkill -f "react-native" || true
pkill -f "metro" || true

# 2. 获取开发机器 IP 地址
export REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0)

# 3. 启动 Metro bundler
yarn start:reset

# 4. 在 Xcode 中运行应用
```

## 预防措施

1. **创建启动脚本**：将端口转发和 Metro 启动合并到一个脚本中
2. **使用环境变量**：配置固定的 IP 地址或主机名
3. **文档化**：记录你的网络配置和常用命令

## 仍然无法解决？

如果以上方法都无法解决问题，请尝试：

1. **完全重启开发环境**：
   ```bash
   # 停止所有服务
   pkill -f "react-native"
   pkill -f "metro"
   pkill -f "node"
   
   # 清除缓存
   yarn start:reset
   
   # 重新设置端口转发（Android）
   yarn setup:android
   ```

2. **检查设备日志**：
   ```bash
   # Android
   adb logcat | grep -i "metro\|react"
   
   # iOS
   # 在 Xcode 中查看控制台输出
   ```

3. **使用 Release 构建测试**：
   如果只是开发时有问题，可以尝试构建 Release 版本：
   ```bash
   yarn build:android:release
   ```

## 相关资源

- [React Native 官方文档 - 运行在设备上](https://reactnative.dev/docs/running-on-device)
- [Android Debug Bridge (adb) 文档](https://developer.android.com/studio/command-line/adb)

