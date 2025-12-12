# 上下文推理 Token 窗口大小

## 📊 默认值和限制

### 默认值
- **默认上下文窗口大小：** `1024` tokens
- **最小值：** `200` tokens（SDK 限制）
- **最大值：** 取决于模型和内存，通常可以设置到 `4096` 或更高

### 设置位置

**代码位置：** `src/utils/contextInitParamsVersions.ts:142`

```typescript
export function createDefaultContextInitParams(): ContextInitParams {
  const defaultParams = createContextInitParams({
    n_ctx: 1024,  // ← 默认值
    n_batch: 512,
    n_ubatch: 512,
    // ...
  });
}
```

**最小值限制：** `src/store/ModelStore.ts:107`

```typescript
MIN_CONTEXT_SIZE = 200;  // ← SDK 要求的最小值
```

## 🔧 如何设置

### 1. 在应用设置中修改（用户可配置）

**界面位置：** 设置页面 → Context Size

**代码位置：** `src/screens/SettingsScreen/SettingsScreen.tsx`

```typescript
// 用户可以输入自定义的上下文大小
const handleContextSizeChange = (text: string) => {
  setContextSize(text);
  const value = parseInt(text, 10);
  
  if (!isNaN(value) && value >= modelStore.MIN_CONTEXT_SIZE) {
    setIsValidInput(true);
    debouncedUpdateStore.current(value);
  } else {
    setIsValidInput(false);
  }
};
```

### 2. 在代码中设置

**代码位置：** `src/store/ModelStore.ts:269`

```typescript
setNContext = (n_ctx: number) => {
  runInAction(() => {
    this.contextInitParams = {
      ...this.contextInitParams,
      n_ctx,
    };
  });
};
```

**使用示例：**
```typescript
import {modelStore} from '../store';

// 设置上下文窗口大小为 2048
modelStore.setNContext(2048);
```

## 📝 参数说明

### `n_ctx` 参数

- **全称：** `n_ctx` (number of context tokens)
- **含义：** 上下文窗口大小，决定模型可以"记住"多少 tokens
- **单位：** tokens（不是字符数）
- **影响：**
  - 更大的值 = 可以处理更长的对话历史
  - 更大的值 = 需要更多内存
  - 更大的值 = 可能影响推理速度

### 相关参数

```typescript
{
  n_ctx: 1024,      // 上下文窗口大小（主要参数）
  n_batch: 512,     // 批处理大小（必须 ≤ n_ctx）
  n_ubatch: 512,    // 未批处理大小（必须 ≤ n_batch）
}
```

## 🔍 实际使用

### 在模型初始化时

**代码位置：** `src/store/ModelStore.ts:1099`

```typescript
const ctx = await initLlama(
  {
    model: filePath,
    ...effectiveSettings,  // 包含 n_ctx
    use_progress_callback: true,
  },
  (_progress: number) => {
    // ...
  },
);
```

### 在 iOS Shortcuts 中

**代码位置：** `ios/PocketPal/AppIntents/LlamaInferenceEngine.swift:76`

```swift
// 默认值
var contextSize = 2048

// 从应用设置读取
if let nCtx = contextInitParams["n_ctx"] as? Int {
    // 限制范围：200 - 4096
    if nCtx < 200 {
        contextSize = 200
    } else if nCtx > 4096 {
        contextSize = 4096
    } else {
        contextSize = nCtx
    }
}
```

## ⚙️ 是 SDK 设置还是应用设置？

### 答案：**应用设置，但有 SDK 限制**

1. **默认值由应用设置：** 
   - 应用代码中设置默认值为 `1024`
   - 用户可以在设置界面修改

2. **最小值由 SDK 限制：**
   - SDK（llama.cpp）要求最小值为 `200`
   - 应用代码中也有检查：`MIN_CONTEXT_SIZE = 200`

3. **实际值由应用决定：**
   - 应用可以设置任意值（≥ 200）
   - 但受设备内存限制
   - 某些模型可能有自己的最大上下文限制

## 📈 常见值

| 用途 | 推荐值 | 说明 |
|------|--------|------|
| 短对话 | 512-1024 | 节省内存，快速响应 |
| 标准对话 | 1024-2048 | 平衡性能和上下文长度 |
| 长对话 | 2048-4096 | 需要更多内存 |
| 文档分析 | 4096+ | 需要处理长文档 |

## 🔗 相关文件

- **默认值定义：** `src/utils/contextInitParamsVersions.ts:142`
- **最小值定义：** `src/store/ModelStore.ts:107`
- **设置方法：** `src/store/ModelStore.ts:269`
- **用户界面：** `src/screens/SettingsScreen/SettingsScreen.tsx:173`
- **模型初始化：** `src/store/ModelStore.ts:1099`

## 💡 总结

1. **默认值：** `1024` tokens（应用设置）
2. **最小值：** `200` tokens（SDK 限制）
3. **可配置：** 用户可以在设置中修改
4. **代码设置：** 通过 `modelStore.setNContext(value)` 设置
5. **实际限制：** 受设备内存和模型能力限制

**结论：上下文窗口大小是应用设置的，不是 SDK 默认的，但 SDK 有最小限制（200）。**

