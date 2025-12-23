# Android Release 版本构建指南

## 问题说明

如果遇到 "Unable to load script" 错误，通常是因为：
- Release 版本的 APK 没有正确打包 JavaScript bundle
- 或者开发模式下 Metro bundler 没有运行

## 构建 Release APK（用于分发）

### 方法 1：使用 Gradle（推荐）

React Native 的 Gradle 插件会自动处理 JavaScript bundle 的打包，只需运行：

```bash
# 构建 Release APK
cd android && ./gradlew assembleRelease && cd ..

# 或者使用 npm 脚本
yarn build:android:apk
```

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/release/app-release.apk
```

### 方法 2：手动打包 Bundle（如果需要）

如果自动打包失败，可以手动打包：

```bash
# 1. 创建 assets 目录（如果不存在）
mkdir -p android/app/src/main/assets

# 2. 打包 JavaScript bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# 3. 构建 APK
cd android && ./gradlew assembleRelease && cd ..
```

## 开发模式（需要 Metro）

如果是在开发测试，确保：

1. **启动 Metro bundler**：
   ```bash
   yarn start
   ```

2. **确保设备连接**：
   - USB 连接：确保 `adb devices` 能看到设备
   - 网络连接：确保设备和电脑在同一网络，或使用端口转发：
     ```bash
     adb reverse tcp:8081 tcp:8081
     ```

3. **运行应用**：
   ```bash
   yarn android
   ```

## 验证 Bundle 是否打包

检查 APK 中是否包含 bundle：

```bash
# 解压 APK（重命名为 .zip）
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep bundle

# 应该能看到 index.android.bundle 文件
```

## 常见问题

### 1. Bundle 文件太大
- 使用 Hermes 引擎（React Native 0.60+ 默认启用）
- 启用代码压缩和混淆

### 2. 构建失败
- 清理构建缓存：`cd android && ./gradlew clean && cd ..`
- 删除 `node_modules` 并重新安装：`rm -rf node_modules && yarn install`

### 3. 签名问题
- Release 版本需要签名，确保配置了 `android/app/gpunexus-release-key.keystore`
- 或使用 debug keystore（仅用于测试）

## 分发方式

### Google Play 上架
- 需要构建 AAB（Android App Bundle）：
  ```bash
  yarn build:android:release
  ```
- AAB 文件位于：`android/app/build/outputs/bundle/release/app-release.aab`

### 直接网站分发
- 构建 APK：
  ```bash
  yarn build:android:apk
  ```
- 上传 APK 到网站供用户下载
- 用户需要开启"允许安装未知来源的应用"

