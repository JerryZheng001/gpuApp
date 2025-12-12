# Android Keystore 说明

## 什么是 Keystore？

**Keystore（密钥库）** 是 Android 应用签名的文件，用于：
- **验证应用身份**：证明应用是由你发布的
- **应用更新**：只有使用相同 keystore 签名的应用才能覆盖安装
- **应用商店发布**：Google Play 等应用商店要求使用 release keystore

## Debug Keystore vs Release Keystore

### Debug Keystore（调试签名）
- **用途**：开发和测试
- **特点**：
  - 密码固定：`android`
  - 所有人都有相同的 debug keystore
  - 不能用于正式发布
  - 可以随时删除重建
- **当前状态**：你的 APK 目前使用的是 debug keystore

### Release Keystore（发布签名）
- **用途**：生产环境、正式发布
- **特点**：
  - 密码由你自定义（必须保密！）
  - 每个开发者/公司都有唯一的 keystore
  - 必须妥善保管，丢失后无法更新应用
  - 用于 Google Play、应用商店发布

## 为什么需要 Release Keystore？

### 1. **应用更新**
- 如果用户安装了用 debug keystore 签名的应用
- 之后你想用 release keystore 签名的应用更新
- **会失败**：系统认为这是不同的应用

### 2. **应用商店要求**
- Google Play、华为应用市场等都要求 release 签名
- Debug 签名会被拒绝

### 3. **安全性**
- Debug keystore 是公开的，任何人都可以用
- Release keystore 是私有的，只有你有

## 当前状态

你的项目配置：
- ✅ 有 debug keystore：`android/app/debug.keystore`
- ❌ 没有 release keystore：`android/app/pocketpal-release-key.keystore`（不存在）

所以构建时自动使用了 debug keystore（看到警告信息）。

## 如何生成 Release Keystore？

### 方法 1：使用 keytool 命令（推荐）

```bash
cd android/app

# 生成 release keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore pocketpal-release-key.keystore \
  -alias pocketpal_key_alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 会提示输入：
# - keystore 密码（记住这个密码！）
# - key 密码（可以和 keystore 密码相同）
# - 姓名、组织等信息
```

### 方法 2：使用 Android Studio

1. Build → Generate Signed Bundle / APK
2. 选择 APK
3. 创建新的 keystore
4. 填写信息并保存

## 配置 Release Keystore

生成后，需要配置密码：

### 方法 1：环境变量
```bash
export APP_RELEASE_STORE_PASSWORD=你的密码
export APP_RELEASE_KEY_PASSWORD=你的密码
```

### 方法 2：.env 文件
在 `android/app/.env` 文件中：
```
APP_RELEASE_STORE_PASSWORD=你的密码
APP_RELEASE_KEY_PASSWORD=你的密码
```

## 重要提醒 ⚠️

1. **备份 keystore**：生成后立即备份到安全的地方
2. **记住密码**：忘记密码 = 无法更新应用
3. **不要提交到 Git**：keystore 文件应该添加到 `.gitignore`
4. **不要分享**：keystore 是应用的身份证明

## 对于当前情况

**如果你只是：**
- ✅ 内部测试 → 使用 debug keystore 可以
- ✅ 给朋友试用 → 使用 debug keystore 可以
- ❌ 正式发布 → 必须使用 release keystore

**建议**：
- 如果只是测试，继续用 debug keystore 没问题
- 如果要正式发布，先生成 release keystore


