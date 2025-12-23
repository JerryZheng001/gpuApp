# Hugging Face 到 ModelScope 迁移清单

本文档列出了所有需要从 Hugging Face 替换为 ModelScope 的代码和配置位置。

## 📋 目录
1. [核心配置文件](#核心配置文件)
2. [API 请求相关](#api-请求相关)
3. [下载链接相关](#下载链接相关)
4. [UI 文本和链接](#ui-文本和链接)
5. [默认模型配置](#默认模型配置)
6. [错误处理](#错误处理)
7. [测试文件](#测试文件)
8. [其他引用](#其他引用)

---

## 1. 核心配置文件

### 1.1 `src/config/urls.ts` ⚠️ **核心文件**
**当前内容：**
```typescript
export const HF_DOMAIN = 'https://huggingface.co';
export const HF_API_BASE = `${HF_DOMAIN}/api/models`;

export const urls = {
  // API URLs
  modelsList: () => `${HF_API_BASE}`,
  modelTree: (modelId: string) => `${HF_API_BASE}/${modelId}/tree/main`,
  modelSpecs: (modelId: string) => `${HF_API_BASE}/${modelId}`,
  
  // Web URLs
  modelDownloadFile: (modelId: string, filename: string) =>
    `${HF_DOMAIN}/${modelId}/resolve/main/${filename}`,
  modelWebPage: (modelId: string) => `${HF_DOMAIN}/${modelId}`,
  // ...
};
```

**需要替换为：**
- `HF_DOMAIN`: `https://huggingface.co` → `https://www.modelscope.cn`
- `HF_API_BASE`: `/api/models` → ModelScope API 路径（需确认）
- `modelDownloadFile`: `/resolve/main/` → ModelScope 下载路径（需确认）
- `modelWebPage`: ModelScope 模型页面路径（需确认）

---

## 2. API 请求相关

### 2.1 `src/api/hf.ts` ⚠️ **核心文件**
**需要修改的函数：**
- `fetchModels()` - 获取模型列表
- `fetchModelFilesDetails()` - 获取模型文件详情
- `fetchGGUFSpecs()` - 获取 GGUF 规格
- `fetchModelInfo()` - 获取模型信息

**当前使用的 URL：**
- `urls.modelsList()` → `https://huggingface.co/api/models`
- `urls.modelTree(modelId)` → `https://huggingface.co/api/models/{modelId}/tree/main`
- `urls.modelSpecs(modelId)` → `https://huggingface.co/api/models/{modelId}`

**注意事项：**
- ModelScope API 可能使用不同的参数格式
- 认证方式可能不同（Bearer token 可能需要调整）
- 响应格式可能需要适配

### 2.2 `src/store/HFStore.ts` ⚠️ **核心文件**
**需要修改的方法：**
- `fetchModels()` - 调用 `fetchModels` API
- `fetchMoreModels()` - 分页获取模型
- `fetchAndSetGGUFSpecs()` - 获取 GGUF 规格
- `fetchModelFileDetails()` - 获取文件详情

**Token 相关：**
- `hfToken` - 可能需要改为 `msToken` 或 `modelScopeToken`
- `HF_TOKEN_SERVICE` - Keychain 服务名可能需要更新
- Token 获取页面链接需要更新

---

## 3. 下载链接相关

### 3.1 `src/utils/hf.ts`
**需要修改的函数：**
- `addModelFileDownloadUrls()` - 添加下载 URL
- `processHFSearchResults()` - 处理搜索结果，添加网页 URL

**当前逻辑：**
```typescript
url: urls.modelDownloadFile(modelId, sibling.rfilename)
// → https://huggingface.co/{modelId}/resolve/main/{filename}
```

### 3.2 `src/services/downloads/DownloadManager.ts`
**当前使用：**
- `model.downloadUrl` - 直接使用模型对象的下载 URL
- `Authorization: Bearer ${authToken}` - 下载时的认证头

**注意事项：**
- ModelScope 的下载 URL 格式可能不同
- 认证方式可能需要调整

### 3.3 `src/store/ModelStore.ts`
**相关方法：**
- `checkSpaceAndDownload()` - 下载时使用 `hfStore.hfToken`
- `addHFModel()` - 添加 HF 模型时构建下载 URL

---

## 4. UI 文本和链接

### 4.1 `src/utils/l10n.ts` ⚠️ **大量文本需要更新**
**需要替换的文本（中英文日文）：**

#### 英文 (en):
- `huggingFaceTokenLabel`: "Hugging Face Token" → "ModelScope Token"
- `setTokenDescription`: "Set a token to access gated models from Hugging Face." → "Set a token to access gated models from ModelScope."
- `useHfTokenLabel`: "Use HF Token" → "Use MS Token"
- `useHfTokenDescription`: "Use HF token to access gated models" → "Use ModelScope token to access gated models"
- `addFromHuggingFace`: "Add from Hugging Face" → "Add from ModelScope"
- `menuTitleHf`: "Hugging Face Models" → "ModelScope Models"
- `searchPlaceholder`: "Search Hugging Face models" → "Search ModelScope models"
- `viewModelCardOnHuggingFace`: "View Model Card on Hugging Face" → "View Model Card on ModelScope"
- `getTokenTitle`: "Get Hugging Face Token" → "Get ModelScope Token"
- `getTokenMessage`: "This model requires a Hugging Face token to download." → "This model requires a ModelScope token to download."
- `getTokenSteps`: 包含 "huggingface.co" 的步骤说明
- `tokenDisabledMessage`: 包含 "Hugging Face token" 的文本
- `viewOnHuggingFace`: "View Model on HF ↗" → "View Model on MS ↗"
- `hfTokenSheet.title`: "Hugging Face Token" → "ModelScope Token"
- `hfTokenSheet.description`: "Required to access gated models" (可能需要更新)
- `hfTokenSheet.getTokenLink`: "Get a token from huggingface.co ↗" → "Get a token from modelscope.cn ↗"
- 错误消息中的 "Hugging Face" 引用

#### 中文 (zh):
- `huggingFaceTokenLabel`: "Hugging Face令牌" → "ModelScope令牌"
- `useHfTokenLabel`: "使用HF令牌" → "使用MS令牌"
- `addFromHuggingFace`: "从Hugging Face添加" → "从ModelScope添加"
- `menuTitleHf`: "Hugging Face模型" → "ModelScope模型"
- `searchPlaceholder`: "搜索Hugging Face模型" → "搜索ModelScope模型"
- `viewModelCardOnHuggingFace`: "在Hugging Face上查看模型卡片" → "在ModelScope上查看模型卡片"
- 所有包含 "Hugging Face" 或 "huggingface" 的文本

#### 日文 (ja):
- 类似的中文替换逻辑

### 4.2 `src/components/HFTokenSheet/HFTokenSheet.tsx`
**需要修改：**
- 第 102 行：`Linking.openURL('https://huggingface.co/settings/tokens')` 
  → `Linking.openURL('https://www.modelscope.cn/settings/tokens')` (需确认 ModelScope 的 token 设置页面)

**组件名称考虑：**
- `HFTokenSheet` → `MSTokenSheet` 或 `ModelScopeTokenSheet`
- 文件名也需要重命名

### 4.3 `src/screens/SettingsScreen/SettingsScreen.tsx`
**需要修改：**
- 导入：`HFTokenSheet` → 新的组件名
- UI 文本引用：所有 `l10n.settings.huggingFaceTokenLabel` 等

### 4.4 `src/screens/ModelsScreen/ModelCard/ModelCard.tsx`
**需要修改：**
- `openHuggingFaceUrl` 函数 - 打开模型页面的链接
- 第 1175 行：`testID="open-huggingface-url"` → `testID="open-modelscope-url"`

---

## 5. 默认模型配置

### 5.1 `src/store/defaultModels.ts` ⚠️ **所有模型 URL 需要更新**
**需要替换的字段（每个模型）：**
- `downloadUrl`: `https://huggingface.co/.../resolve/main/...` → ModelScope 下载 URL
- `hfUrl`: `https://huggingface.co/...` → ModelScope 模型页面 URL
- `hfModelFile.url`: 同上

**涉及的模型（共 10+ 个）：**
1. `bartowski/gemma-2-2b-it-GGUF`
2. `TheDrummer/Gemmasutra-Mini-2B-v1-GGUF`
3. `MaziyarPanahi/Phi-3.5-mini-instruct-GGUF`
4. `Qwen/Qwen2.5-1.5B-Instruct-GGUF`
5. `Qwen/Qwen2.5-3B-Instruct-GGUF`
6. `hugging-quants/Llama-3.2-1B-Instruct-Q8_0-GGUF`
7. `bartowski/Llama-3.2-3B-Instruct-GGUF`
8. `bartowski/SmolLM2-1.7B-Instruct-GGUF`
9. `ggml-org/SmolVLM-500M-Instruct-GGUF` (主模型 + projection 模型)

**注意事项：**
- 需要确认 ModelScope 上是否有对应的模型
- 模型 ID 格式可能需要转换（如 `owner/model-name` → ModelScope 格式）
- 文件路径可能需要调整

---

## 6. 错误处理

### 6.1 `src/utils/errors.ts`
**需要修改：**
- 第 85 行：`if (url.includes('huggingface.co') || url.includes('hf.co'))`
  → `if (url.includes('modelscope.cn') || url.includes('ms.cn'))`
- `errorService = 'huggingface'` → `errorService = 'modelscope'`

**相关错误消息：**
- `hfAuthenticationError` → `msAuthenticationError`
- `hfAuthorizationError` → `msAuthorizationError`
- `hfServerError` → `msServerError`
- `hfNetworkTimeout` → `msNetworkTimeout`
- `hfNetworkError` → `msNetworkError`

### 6.2 `src/components/DownloadErrorDialog/DownloadErrorDialog.tsx`
**需要修改：**
- 错误类型判断逻辑
- 错误消息显示

---

## 7. 测试文件

### 7.1 `jest/fixtures/models.ts`
**需要更新：**
- Mock 数据中的 `downloadUrl` 和 `hfUrl`
- Mock `HuggingFaceModel` 对象中的 `url` 字段

### 7.2 `src/store/__tests__/HFStore.test.ts`
**需要更新：**
- Mock URL
- 测试用例中的 URL 断言

### 7.3 `src/api/__tests__/hf.test.ts`
**需要更新：**
- API 端点测试
- Mock 响应

### 7.4 `src/components/HFTokenSheet/__tests__/HFTokenSheet.test.tsx`
**需要更新：**
- 第 109 行：`'https://huggingface.co/settings/tokens'` → ModelScope token 页面

### 7.5 `src/components/DownloadErrorDialog/__tests__/DownloadErrorDialog.test.tsx`
**需要更新：**
- Mock 模型数据中的 `hfUrl`

### 7.6 `src/screens/BenchmarkScreen/BenchResultCard/BenchResultCard.tsx`
**需要更新：**
- 第 76 行：`'https://huggingface.co/spaces/a-ghorbani/ai-phone-leaderboard'`
  → ModelScope 对应的 leaderboard 页面（如果有）

### 7.7 `src/screens/BenchmarkScreen/BenchResultCard/__tests__/BenchResultCard.test.tsx`
**需要更新：**
- Leaderboard URL

---

## 8. 其他引用

### 8.1 `README.md`
**需要更新：**
- 第 146 行：Leaderboard 链接
- 第 155 行：Token 文档链接

### 8.2 `android/app/build.gradle`
**注释中提到：**
- "sending benchmarks to Hugging Face Spaces via Firebase" - 可能需要更新注释

### 8.3 `android/build.gradle`
**注释中提到：**
- "sending benchmarks to Hugging Face Spaces via Firebase" - 可能需要更新注释

### 8.4 `src/hooks/useMemoryCheck.ts`
**注释中提到：**
- `https://huggingface.co/spaces/a-ghorbani/ai-phone-leaderboard` - 可能需要更新

### 8.5 类型定义
**`src/utils/types.ts`:**
- `HuggingFaceModel` 接口名可能需要改为 `ModelScopeModel`
- `HuggingFaceModelsResponse` → `ModelScopeModelsResponse`
- 但考虑到影响范围，可能保留接口名，只改实现

### 8.6 Store 命名
**考虑重命名：**
- `HFStore` → `MSStore` 或 `ModelScopeStore`
- `hfStore` → `msStore`
- 文件名：`HFStore.ts` → `MSStore.ts`

### 8.7 工具函数
**`src/utils/index.ts`:**
- `hfAsModel()` 函数名可能需要改为 `msAsModel()` 或 `modelScopeAsModel()`

### 8.8 聊天模板
**`src/utils/chat.ts`:**
- `getHFDefaultSettings()` → `getMSDefaultSettings()` 或 `getModelScopeDefaultSettings()`

---

## 9. 需要确认的 ModelScope API 信息

在开始替换前，需要确认以下信息：

### 9.1 API 端点
- [ ] ModelScope API 基础 URL
- [ ] 模型列表 API 端点
- [ ] 模型详情 API 端点
- [ ] 模型文件树 API 端点
- [ ] GGUF 规格 API 端点

### 9.2 下载 URL 格式
- [ ] ModelScope 模型文件下载 URL 格式
- [ ] 是否需要认证
- [ ] 下载时的认证方式

### 9.3 认证方式
- [ ] Token 格式（是否也是 Bearer token）
- [ ] Token 获取页面 URL
- [ ] Token 设置页面 URL

### 9.4 响应格式
- [ ] API 响应格式是否与 HF 兼容
- [ ] 需要哪些字段映射
- [ ] 分页方式（Link header 还是其他）

### 9.5 模型 ID 格式
- [ ] ModelScope 模型 ID 格式（如 `owner/model-name`）
- [ ] 是否需要转换函数

### 9.6 默认模型
- [ ] ModelScope 上是否有对应的模型
- [ ] 模型路径是否一致
- [ ] 文件命名是否一致

---

## 10. 迁移步骤建议

1. **第一阶段：配置和核心 API**
   - 更新 `src/config/urls.ts`
   - 更新 `src/api/hf.ts`（可能需要重命名为 `ms.ts`）
   - 测试 API 连接

2. **第二阶段：Store 和状态管理**
   - 更新 `src/store/HFStore.ts`
   - 更新 token 相关逻辑
   - 测试模型搜索和列表

3. **第三阶段：下载功能**
   - 更新下载 URL 构建逻辑
   - 测试模型下载

4. **第四阶段：UI 和文本**
   - 更新所有 UI 文本
   - 更新链接和按钮
   - 更新组件名称（可选）

5. **第五阶段：默认模型**
   - 更新所有默认模型的 URL
   - 确认模型在 ModelScope 上的可用性

6. **第六阶段：测试和清理**
   - 更新所有测试文件
   - 更新文档
   - 清理未使用的代码

---

## 11. 注意事项

1. **向后兼容性**
   - 考虑是否需要支持同时访问 HF 和 ModelScope
   - 可能需要配置开关来选择数据源

2. **模型同步**
   - ModelScope 上的模型可能与 HF 不完全一致
   - 需要确认每个默认模型在 ModelScope 上的可用性

3. **API 差异**
   - ModelScope API 可能与 HF API 有差异
   - 需要仔细测试每个 API 端点

4. **命名约定**
   - 考虑是否完全替换命名（HF → MS）
   - 或者保留部分命名但指向 ModelScope

5. **国际化**
   - 确保所有语言的文本都已更新

---

## 12. 文件清单总结

### 核心文件（必须修改）：
- ✅ `src/config/urls.ts`
- ✅ `src/api/hf.ts`
- ✅ `src/store/HFStore.ts`
- ✅ `src/store/defaultModels.ts`
- ✅ `src/utils/hf.ts`
- ✅ `src/utils/l10n.ts`
- ✅ `src/utils/errors.ts`

### UI 组件（必须修改）：
- ✅ `src/components/HFTokenSheet/HFTokenSheet.tsx`
- ✅ `src/components/DownloadErrorDialog/DownloadErrorDialog.tsx`
- ✅ `src/screens/SettingsScreen/SettingsScreen.tsx`
- ✅ `src/screens/ModelsScreen/ModelCard/ModelCard.tsx`

### 业务逻辑（必须修改）：
- ✅ `src/store/ModelStore.ts`
- ✅ `src/services/downloads/DownloadManager.ts`
- ✅ `src/utils/index.ts`
- ✅ `src/utils/chat.ts`

### 测试文件（建议修改）：
- ⚠️ `jest/fixtures/models.ts`
- ⚠️ `src/store/__tests__/HFStore.test.ts`
- ⚠️ `src/api/__tests__/hf.test.ts`
- ⚠️ `src/components/HFTokenSheet/__tests__/HFTokenSheet.test.tsx`
- ⚠️ `src/components/DownloadErrorDialog/__tests__/DownloadErrorDialog.test.tsx`
- ⚠️ `src/screens/BenchmarkScreen/BenchResultCard/BenchResultCard.tsx`
- ⚠️ `src/screens/BenchmarkScreen/BenchResultCard/__tests__/BenchResultCard.test.tsx`

### 文档（建议更新）：
- ⚠️ `README.md`

---

**总计：约 30+ 个文件需要修改**

