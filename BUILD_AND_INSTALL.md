# 生产包构建和安装指南

## Android 生产包构建

### 方法 1: 生成 APK（直接安装到手机）

```bash
# 1. 清理之前的构建
cd android && ./gradlew clean && cd ..

# 2. 生成 Release APK
cd android && ./gradlew assembleRelease && cd ..

# 3. APK 文件位置
# android/app/build/outputs/apk/release/app-release.apk
```

### 方法 2: 使用 npm 脚本（生成 Bundle，用于 Play Store）

```bash
yarn build:android:release
# 生成的文件在: android/app/build/outputs/bundle/release/app-release.aab
```

## 安装到手机

### 方法 1: 使用 ADB（推荐）

```bash
# 1. 连接手机（USB 调试已开启）
adb devices

# 2. 安装 APK
adb install android/app/build/outputs/apk/release/app-release.apk

# 如果已安装过，需要先卸载或使用 -r 参数覆盖安装
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### 方法 2: 手动安装

1. 将 APK 文件传输到手机（通过 USB、邮件、云盘等）
2. 在手机上打开文件管理器
3. 找到 APK 文件并点击安装
4. 允许"安装未知来源应用"（如果提示）

## 签名配置

### 使用 Debug 签名（测试用）

如果没有配置 release 签名，构建会自动使用 debug keystore：
- 位置: `android/app/debug.keystore`
- 密码: `android`
- 别名: `androiddebugkey`

### 配置 Release 签名（生产环境）

1. 生成 keystore（如果还没有）:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore pocketpal-release-key.keystore -alias pocketpal_key_alias -keyalg RSA -keysize 2048 -validity 10000
```

2. 配置环境变量或 .env 文件:
```bash
export APP_RELEASE_STORE_PASSWORD=你的密码
export APP_RELEASE_KEY_PASSWORD=你的密码
```

或者在 `android/app/.env` 文件中：
```
APP_RELEASE_STORE_PASSWORD=你的密码
APP_RELEASE_KEY_PASSWORD=你的密码
```

## iOS 生产包构建

```bash
# 1. 清理构建
yarn clean:ios

# 2. 构建 Release
yarn ios:build:release

# 3. 使用 Xcode 进行 Archive 和导出
# 打开 Xcode > Product > Archive > Distribute App
```

## 注意事项

1. **Release 签名**: 生产环境必须使用自己的 release keystore，不要使用 debug keystore
2. **版本号**: 在 `android/app/build.gradle` 中更新 `versionCode` 和 `versionName`
3. **ProGuard**: 当前配置中 `enableProguardInReleaseBuilds = false`，生产环境建议启用以减小包体积
4. **测试**: 安装前建议先在测试设备上验证

## 快速命令

```bash
# 一键构建并安装到连接的设备
cd android && ./gradlew assembleRelease && cd .. && adb install -r android/app/build/outputs/apk/release/app-release.apk
```


