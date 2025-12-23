# Hugging Face → ModelScope 快速参考

## 🔴 必须修改的核心文件（优先级最高）

### 1. URL 配置
**文件：** `src/config/urls.ts`
```typescript
// 需要替换：
HF_DOMAIN: 'https://huggingface.co' → 'https://www.modelscope.cn'
HF_API_BASE: '/api/models' → ModelScope API 路径
```

### 2. API 调用
**文件：** `src/api/hf.ts`
- `fetchModels()` - 模型列表 API
- `fetchModelFilesDetails()` - 文件详情 API
- `fetchGGUFSpecs()` - GGUF 规格 API
- `fetchModelInfo()` - 模型信息 API

### 3. Store 管理
**文件：** `src/store/HFStore.ts`
- Token 存储服务名：`HF_TOKEN_SERVICE` → `MS_TOKEN_SERVICE`
- Token 变量名：`hfToken` → `msToken`（可选）
- 所有 API 调用方法

### 4. 默认模型 URL
**文件：** `src/store/defaultModels.ts`
- 所有模型的 `downloadUrl` 和 `hfUrl` 字段（10+ 个模型）

### 5. 工具函数
**文件：** `src/utils/hf.ts`
- `addModelFileDownloadUrls()` - 构建下载 URL
- `processHFSearchResults()` - 处理搜索结果

---

## 🟡 UI 和文本（第二优先级）

### 6. 国际化文本
**文件：** `src/utils/l10n.ts`
- 所有包含 "Hugging Face"、"HF"、"huggingface.co" 的文本
- 中英日三种语言都需要更新
- 约 50+ 处文本引用

### 7. Token 设置组件
**文件：** `src/components/HFTokenSheet/HFTokenSheet.tsx`
- 第 102 行：Token 获取页面链接
- 组件名可考虑重命名为 `MSTokenSheet`

### 8. 设置页面
**文件：** `src/screens/SettingsScreen/SettingsScreen.tsx`
- Token 相关 UI 文本引用

### 9. 模型卡片
**文件：** `src/screens/ModelsScreen/ModelCard/ModelCard.tsx`
- `openHuggingFaceUrl` 函数

---

## 🟢 错误处理和下载（第三优先级）

### 10. 错误处理
**文件：** `src/utils/errors.ts`
- 第 85 行：URL 检测逻辑
- 错误服务名：`'huggingface'` → `'modelscope'`

### 11. 下载管理器
**文件：** `src/services/downloads/DownloadManager.ts`
- 下载 URL 和认证头（可能不需要改，因为使用 `model.downloadUrl`）

### 12. 模型 Store
**文件：** `src/store/ModelStore.ts`
- `checkSpaceAndDownload()` - 使用 token 的地方

---

## 🔵 测试文件（最后修改）

### 测试文件列表：
- `jest/fixtures/models.ts` - Mock 数据
- `src/store/__tests__/HFStore.test.ts`
- `src/api/__tests__/hf.test.ts`
- `src/components/HFTokenSheet/__tests__/HFTokenSheet.test.tsx`
- `src/components/DownloadErrorDialog/__tests__/DownloadErrorDialog.test.tsx`
- `src/screens/BenchmarkScreen/BenchResultCard/BenchResultCard.tsx`
- `src/screens/BenchmarkScreen/BenchResultCard/__tests__/BenchResultCard.test.tsx`

---

## 📝 关键替换模式

### URL 替换：
```typescript
// 旧
'https://huggingface.co'
'huggingface.co'
'hf.co'

// 新
'https://www.modelscope.cn'
'modelscope.cn'
'ms.cn' (如果 ModelScope 有短域名)
```

### API 路径替换：
```typescript
// 旧
'/api/models'
'/api/models/{modelId}/tree/main'
'/api/models/{modelId}'

// 新（需确认 ModelScope API 路径）
'/api/v1/models' (示例)
```

### 下载路径替换：
```typescript
// 旧
'/{modelId}/resolve/main/{filename}'

// 新（需确认 ModelScope 下载路径）
'/{modelId}/resolve/{revision}/{filename}' (示例)
```

### Token 页面替换：
```typescript
// 旧
'https://huggingface.co/settings/tokens'

// 新（需确认）
'https://www.modelscope.cn/settings/tokens'
```

---

## ⚠️ 需要确认的 ModelScope 信息

在开始替换前，请确认：

1. ✅ ModelScope API 基础 URL 和端点
2. ✅ 模型下载 URL 格式
3. ✅ Token 认证方式（Bearer token？）
4. ✅ Token 设置页面 URL
5. ✅ API 响应格式（是否兼容）
6. ✅ 模型 ID 格式（是否需要转换）
7. ✅ 默认模型在 ModelScope 上的可用性

---

## 📊 统计

- **核心文件：** 5 个
- **UI 组件：** 4 个
- **业务逻辑：** 4 个
- **测试文件：** 7+ 个
- **文档：** 1 个
- **总计：** 约 30+ 个文件

---

## 🚀 建议的迁移顺序

1. **配置层** → `urls.ts`
2. **API 层** → `api/hf.ts`
3. **Store 层** → `HFStore.ts`
4. **工具层** → `utils/hf.ts`
5. **UI 层** → 组件和文本
6. **测试层** → 测试文件

