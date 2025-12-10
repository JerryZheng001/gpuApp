# 真机开发流程指南

## 🎯 快速回答

### Q: 修改代码后需要重新安装到手机上吗？
**A: 不需要！** 只要 Metro bundler 在运行，修改代码后会自动热重载。

### Q: 每次打开手机时都要执行 `yarn setup:android` 吗？
**A: 不需要！** 我已经优化了脚本，现在 `yarn android` 会自动检查并设置端口转发。

## 📱 正确的开发流程

### 第一次安装到真机

```bash
# 1. 确保设备已连接（USB 调试已开启）
adb devices

# 2. 启动 Metro bundler（在一个终端窗口）
yarn start:reset

# 3. 安装并运行应用（在另一个终端窗口）
yarn android
```

**现在 `yarn android` 会自动：**
- ✅ 检查端口转发是否存在
- ✅ 如果不存在，自动设置
- ✅ 然后运行应用

### 日常开发（修改代码后）

```bash
# 只需要确保 Metro bundler 在运行
yarn start:reset

# 修改代码后，应用会自动热重载！
# 不需要重新安装，不需要重新运行 yarn android
```

**热重载说明：**
- 修改 JavaScript/TypeScript 代码 → 自动重载 ✅
- 修改样式 → 自动重载 ✅
- 修改图片资源 → 可能需要手动重载（摇一摇设备，按 R）
- 修改原生代码（Android/iOS） → 需要重新运行 `yarn android` ⚠️

### 什么时候需要重新安装？

只有在以下情况才需要重新运行 `yarn android`：

1. **修改了原生代码**（Android/iOS 原生代码）
2. **添加了新的原生依赖**（需要重新编译）
3. **修改了 AndroidManifest.xml 或 Info.plist**
4. **首次安装应用**
5. **应用崩溃无法恢复**

### 什么时候需要设置端口转发？

**现在基本不需要手动设置了！** `yarn android` 会自动处理。

但如果你遇到连接问题，可以手动运行：
```bash
yarn setup:android
```

## 🔄 完整的工作流程

### 场景 1: 开始新的一天开发

```bash
# 1. 连接设备
# （确保 USB 调试已开启）

# 2. 启动 Metro bundler
yarn start:reset

# 3. 运行应用（会自动设置端口转发）
yarn android

# 4. 开始开发，修改代码会自动热重载
```

### 场景 2: 修改代码后

```bash
# Metro bundler 已经在运行
# 直接修改代码，保存后应用会自动更新
# 不需要做任何操作！
```

### 场景 3: 设备重新连接后

```bash
# 如果设备重新连接（拔插 USB），运行：
yarn android
# 会自动检查并重新设置端口转发
```

### 场景 4: 遇到连接问题

```bash
# 1. 手动设置端口转发
yarn setup:android

# 2. 重启 Metro bundler
yarn start:reset

# 3. 重新运行应用
yarn android
```

## 📋 命令说明

| 命令 | 用途 | 什么时候用 |
|------|------|-----------|
| `yarn start` | 启动 Metro bundler | 开始开发时 |
| `yarn start:reset` | 启动 Metro（清除缓存） | 遇到缓存问题时 |
| `yarn android` | 运行 Android 应用 | 首次安装或需要重新安装时 |
| `yarn setup:android` | 手动设置端口转发 | 遇到连接问题时 |
| `yarn android:device` | 设置端口转发并运行 | 等同于 `yarn setup:android && yarn android` |

## 🎯 最佳实践

### ✅ 推荐做法

1. **保持 Metro bundler 运行**
   - 开发时保持 `yarn start:reset` 在运行
   - 这样修改代码后可以立即看到效果

2. **使用热重载**
   - 修改代码后保存，应用会自动更新
   - 不需要每次都重新运行 `yarn android`

3. **遇到问题时重启**
   - 如果热重载不工作，摇一摇设备，按 R 键重载
   - 或者运行 `yarn android` 重新安装

### ❌ 不推荐的做法

1. **不要频繁重新安装**
   - 每次修改代码都运行 `yarn android` 是不必要的
   - 这会浪费时间，因为 Metro 已经提供了热重载

2. **不要忘记启动 Metro**
   - 如果没有 Metro bundler 运行，应用无法加载代码
   - 确保 `yarn start` 或 `yarn start:reset` 在运行

## 🔍 常见问题

### Q: 修改代码后没有自动更新？
**A:** 
1. 检查 Metro bundler 是否在运行
2. 摇一摇设备，按 R 键手动重载
3. 检查是否有编译错误（查看 Metro 终端输出）

### Q: 应用显示 "Unable to load script"？
**A:**
```bash
# 运行这个命令
yarn setup:android

# 然后重启 Metro
yarn start:reset

# 重新运行应用
yarn android
```

### Q: 端口转发总是丢失？
**A:** 
- 现在 `yarn android` 会自动检查并设置
- 如果还是有问题，检查 USB 连接是否稳定

### Q: 热重载不工作？
**A:**
1. 检查 Metro bundler 是否在运行
2. 检查设备和电脑是否在同一网络（iOS）
3. 检查端口转发是否设置（Android）
4. 尝试手动重载：摇一摇设备，按 R

## 📝 总结

**记住这个简单的流程：**

1. **开始开发**：`yarn start:reset` + `yarn android`
2. **修改代码**：直接保存，自动热重载
3. **遇到问题**：`yarn setup:android` + 重启 Metro

**不需要每次打开手机都运行 `yarn setup:android`！** 🎉

