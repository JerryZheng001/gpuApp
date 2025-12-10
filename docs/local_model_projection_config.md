# 本地模型的投影模型配置

## 概述

本地模型（`ModelOrigin.LOCAL`）**默认没有投影模型配置**，但可以通过手动方式设置。

## 1. 本地模型添加时的配置

### 位置：`ModelStore.addLocalModel()`

**文件**：`src/store/ModelStore.ts` 第 1417-1451 行

**关键代码**：

```typescript
addLocalModel = async (localFilePath: string) => {
  const filename = localFilePath.split('/').pop();
  const defaultSettings = getLocalModelDefaultSettings();

  const model: Model = {
    id: uuidv4(),
    author: '',
    name: filename,
    // ... 其他基本字段
    origin: ModelOrigin.LOCAL,
    fullPath: localFilePath,
    // ... chatTemplate, completionSettings 等
    
    // ❌ 注意：没有设置以下多模态相关字段：
    // - supportsMultimodal
    // - defaultProjectionModel
    // - compatibleProjectionModels
    // - modelType
    // - visionEnabled
  };

  this.models.push(model);
}
```

**结论**：
- ❌ **本地模型添加时不会自动设置投影模型配置**
- ❌ **不会自动检测是否为多模态模型**
- ❌ **不会自动设置 `supportsMultimodal`**
- ❌ **不会自动设置 `defaultProjectionModel`**

## 2. 手动设置投影模型

### 方法：`ModelStore.setDefaultProjectionModel()`

**文件**：`src/store/ModelStore.ts` 第 1765-1772 行

**代码**：

```typescript
setDefaultProjectionModel = (modelId: string, projectionModelId: string) => {
  const model = this.models.find(m => m.id === modelId);
  if (model && model.supportsMultimodal) {
    runInAction(() => {
      model.defaultProjectionModel = projectionModelId;
    });
  }
};
```

**限制**：
- ⚠️ **需要先设置 `supportsMultimodal = true`**
- ⚠️ **只能通过代码手动设置，没有 UI 界面**

### UI 设置方式

**位置**：`ProjectionModelSelector` 组件

**文件**：`src/components/ProjectionModelSelector/ProjectionModelSelector.tsx`

**使用场景**：
- 在模型设置界面（`ModelSettingsSheet`）中
- 只有当 `model.supportsMultimodal === true` 时才会显示投影模型选择器

**代码**（第 101-108 行）：

```typescript
<ProjectionModelSelector
  model={model}
  onProjectionModelSelect={projectionModelId => {
    modelStore.setDefaultProjectionModel(
      model.id,
      projectionModelId,
    );
  }}
/>
```

## 3. 本地模型使用投影模型的完整流程

### 步骤 1：添加本地模型

```typescript
await modelStore.addLocalModel('/path/to/local/model.gguf');
// 此时模型没有多模态配置
```

### 步骤 2：手动设置多模态支持（如果需要）

```typescript
// 需要通过代码手动设置
const localModel = modelStore.models.find(m => m.id === localModelId);
if (localModel) {
  runInAction(() => {
    localModel.supportsMultimodal = true;
    localModel.modelType = ModelType.VISION; // 如果是视觉模型
  });
}
```

### 步骤 3：添加投影模型（如果还没有）

```typescript
// 添加投影模型文件
await modelStore.addLocalModel('/path/to/mmproj.gguf');
const projectionModel = modelStore.models.find(m => m.filename === 'mmproj.gguf');
```

### 步骤 4：设置默认投影模型

```typescript
// 方法 1：通过代码设置
modelStore.setDefaultProjectionModel(localModel.id, projectionModel.id);

// 方法 2：通过 UI（如果 supportsMultimodal = true）
// 在模型设置界面选择投影模型
```

## 4. 与 HF 模型的对比

| 特性 | HF 模型 | 本地模型 |
|------|---------|----------|
| 自动检测多模态 | ✅ 是（通过仓库 siblings） | ❌ 否 |
| 自动设置投影模型 | ✅ 是（通过 `hfAsModel()`） | ❌ 否 |
| 自动推荐投影模型 | ✅ 是（根据量化级别） | ❌ 否 |
| 手动设置投影模型 | ✅ 支持 | ✅ 支持 |
| UI 选择投影模型 | ✅ 支持 | ✅ 支持（需先设置 `supportsMultimodal`） |

## 5. 当前限制和问题

### 限制 1：需要手动设置 `supportsMultimodal`

本地模型默认 `supportsMultimodal` 为 `undefined`，需要手动设置为 `true` 才能：
- 在 UI 中显示投影模型选择器
- 使用 `setDefaultProjectionModel()` 方法

### 限制 2：没有自动检测机制

- 不会自动检测本地模型文件是否为多模态模型
- 不会自动检测同目录下是否有投影模型文件
- 不会自动匹配投影模型

### 限制 3：投影模型也需要手动添加

- 投影模型文件也需要通过 `addLocalModel()` 单独添加
- 不会自动关联同目录下的投影模型

## 6. 建议的改进方案

### 方案 1：自动检测本地多模态模型

```typescript
addLocalModel = async (localFilePath: string) => {
  // 检测文件名是否包含 vision 相关关键词
  const isVisionModel = detectVisionModel(localFilePath);
  
  // 检测同目录下是否有投影模型
  const projectionModelPath = findProjectionModelInSameDir(localFilePath);
  
  if (isVisionModel && projectionModelPath) {
    // 自动添加投影模型
    await this.addLocalModel(projectionModelPath);
    // 自动设置关联
    model.supportsMultimodal = true;
    model.defaultProjectionModel = projectionModel.id;
  }
}
```

### 方案 2：在 UI 中提供设置选项

- 在模型设置界面添加"启用多模态"开关
- 添加"选择投影模型"选项（即使 `supportsMultimodal` 未设置）

## 7. 总结

**当前状态**：
- ❌ 本地模型**没有默认投影模型配置**
- ✅ 可以通过 `setDefaultProjectionModel()` **手动设置**
- ⚠️ 需要先设置 `supportsMultimodal = true`
- ⚠️ 投影模型也需要单独添加

**使用建议**：
1. 如果本地模型是多模态模型，需要：
   - 手动设置 `supportsMultimodal = true`
   - 添加投影模型文件
   - 通过 UI 或代码设置 `defaultProjectionModel`
2. 目前没有自动检测和配置机制，需要手动完成所有设置


