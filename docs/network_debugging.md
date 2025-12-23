# 网络请求调试指南

## 📱 查看网络请求的几种方法

### 方法 1: Chrome DevTools（推荐）⭐

这是最常用和最简单的方法。

**重要提示：** React Native DevTools 和 Chrome DevTools 是不同的工具！
- **React Native Dev Menu**：开发菜单（你当前看到的）
- **Chrome DevTools**：用于查看 Network 请求、Sources 等（需要单独打开）

#### 步骤：

1. **在设备上打开开发者菜单**
   - Android: 摇一摇设备，或按 `Cmd+M` (Mac) / `Ctrl+M` (Windows)
   - iOS: 摇一摇设备，或按 `Cmd+D` (Mac)
   - 会显示 "React Native Dev Menu" 菜单

2. **点击 "Open DevTools"**
   - 在菜单中找到并点击 **"Open DevTools"**
   - 这会自动打开 Chrome 浏览器，显示 `http://localhost:8081/debugger-ui/`
   - **注意**：这是 Chrome DevTools，不是 React Native Dev Menu

3. **在 Chrome DevTools 中查看 Network**
   - Chrome 会自动打开 DevTools（如果没有，按 `F12` 或 `Cmd+Option+I` / `Ctrl+Shift+I`）
   - 点击顶部的 **Network** 标签（在标签栏中）
   - 如果看不到 Network 标签，点击 `>>` 查看更多标签

4. **触发网络请求并查看**
   - 在应用中触发网络请求（如发送验证码）
   - 在 Network 面板中可以看到所有请求
   - 点击请求可以查看详细信息（Headers、Payload、Response 等）

#### 如果 "Open DevTools" 没有反应：

**方法 A：手动打开 Chrome DevTools**
1. 在 Chrome 浏览器中访问：`http://localhost:8081/debugger-ui/`
2. 按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows) 打开 DevTools
3. 点击 **Network** 标签

**方法 B：使用 chrome://inspect**
1. 在 Chrome 浏览器中访问：`chrome://inspect`
2. 找到 "Remote Target" 部分
3. 找到你的应用（GPUNexus），点击 "inspect"
4. 在打开的 DevTools 中点击 **Network** 标签

#### 如果看不到 Network 标签：

1. **确认打开了正确的 DevTools**
   - 应该是在 Chrome 浏览器中，不是 React Native DevTools
   - URL 应该是 `http://localhost:8081/debugger-ui/` 或类似

2. **检查 DevTools 窗口大小**
   - Network 标签可能在 `>>` 下拉菜单中
   - 尝试调整窗口大小或点击 `>>` 查看隐藏的标签

3. **手动打开 Chrome DevTools**
   - 在 Chrome 中按 `F12` 或 `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - 确保在正确的标签页中（调试器标签页）

#### 查看请求详情：
- **Headers**: 请求头、响应头
- **Payload**: 请求体（POST 数据）
- **Response**: 服务器响应
- **Timing**: 请求耗时

---

### 方法 2: React Native Debugger

如果安装了 React Native Debugger，可以更详细地查看网络请求。

#### 安装：
```bash
# macOS
brew install --cask react-native-debugger

# 或下载
# https://github.com/jhen0409/react-native-debugger/releases
```

#### 使用：
1. 打开 React Native Debugger
2. 在应用中打开调试菜单，选择 "Debug"
3. 在 Debugger 中可以看到 Network 请求

---

### 方法 3: 控制台日志（当前代码已有）

代码中已经添加了日志，可以在以下位置查看：

#### Android:
```bash
# 查看所有日志
adb logcat

# 只查看 React Native 日志
adb logcat | grep -i "react"

# 只查看网络相关日志
adb logcat | grep -i "发送验证码\|Network\|fetch"
```

#### iOS:
```bash
# 在 Xcode 中查看控制台
# 或使用：
xcrun simctl spawn booted log stream --level=debug
```

#### 在代码中查看：
- `console.log('发送验证码请求:', phoneNumber)` - 请求发送前
- `console.log('发送验证码响应:', data)` - 响应成功
- `console.error('发送验证码失败:', error)` - 请求失败

---

### 方法 4: 添加更详细的网络日志

可以在 `MobileAuthApi.ts` 中添加更详细的日志：

```typescript
// 在发送请求前
console.log('=== 网络请求开始 ===');
console.log('URL:', `${API_BASE_URL}/api/sms/sendverifyCode`);
console.log('Method: POST');
console.log('Headers:', {
  'Content-Type': 'application/json',
});
console.log('Body:', JSON.stringify({
  phone_num: phoneNumber,
}));

// 在收到响应后
console.log('=== 网络响应 ===');
console.log('Status:', response.status);
console.log('Status Text:', response.statusText);
console.log('Response:', data);
```

---

### 方法 5: 使用 Flipper（高级）

Flipper 是 Facebook 开发的调试工具，可以查看网络请求、日志等。

#### 安装：
```bash
# macOS
brew install --cask flipper

# 或下载
# https://fbflipper.com/
```

#### 使用：
1. 安装 Flipper
2. 在项目中安装 Flipper 插件（如果还没有）
3. 启动应用，Flipper 会自动连接
4. 在 Flipper 的 Network 插件中查看请求

---

## 🔍 检查网络连接是否通畅

### 1. 测试 API 是否可访问

在终端中测试：

```bash
# 测试发送验证码接口
curl -X POST https://test.chengfangtech.com/api/sms/sendverifyCode \
  -H "Content-Type: application/json" \
  -d '{"phone_num":"13800138000"}'

# 如果返回 JSON 数据，说明接口可访问
# 如果返回错误，说明网络或接口有问题
```

### 2. 在应用中添加网络测试

可以在应用中添加一个测试按钮，直接测试网络连接：

```typescript
const testNetwork = async () => {
  try {
    const response = await fetch('https://test.chengfangtech.com/api/sms/sendverifyCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: '13800138000',
      }),
    });
    console.log('网络测试成功:', response.status);
    console.log('响应:', await response.json());
  } catch (error) {
    console.error('网络测试失败:', error);
  }
};
```

### 3. 检查 Android 网络配置

确保 `network_security_config.xml` 配置正确：

```xml
<!-- 允许 HTTPS 请求 -->
<base-config cleartextTrafficPermitted="true">
    <trust-anchors>
        <certificates src="system" />
    </trust-anchors>
</base-config>
```

---

## 🐛 常见问题排查

### 问题 1: Network request failed

**可能原因：**
- Android 模拟器无法访问外部网络
- 网络配置不正确
- DNS 解析失败

**解决方法：**
1. 使用真实设备测试
2. 检查 `network_security_config.xml`
3. 尝试使用 IP 地址代替域名

### 问题 2: 看不到 Network 请求

**可能原因：**
- 没有打开调试模式
- Chrome DevTools 没有正确连接

**解决方法：**
1. 确保应用在调试模式下运行
2. 重新打开 Chrome DevTools
3. 检查 `http://localhost:8081/debugger-ui/` 是否可以访问

### 问题 3: 请求超时

**可能原因：**
- 网络连接慢
- 服务器响应慢
- 防火墙阻止

**解决方法：**
1. 检查网络连接
2. 在代码中添加超时控制
3. 检查服务器状态

---

## 📝 快速检查清单

- [ ] 应用在调试模式下运行
- [ ] Chrome DevTools 已打开
- [ ] Network 标签已选中
- [ ] 在应用中触发了网络请求
- [ ] 查看控制台日志（`adb logcat` 或 Xcode）
- [ ] 检查请求 URL 是否正确
- [ ] 检查请求方法（GET/POST）是否正确
- [ ] 检查请求头是否正确
- [ ] 检查请求体是否正确
- [ ] 查看响应状态码
- [ ] 查看响应数据

---

## 💡 推荐工作流程

1. **开发时**：使用 Chrome DevTools 的 Network 标签
2. **调试时**：查看控制台日志（`adb logcat`）
3. **测试时**：使用 `curl` 命令测试接口
4. **生产环境**：使用 Flipper 或专业监控工具

