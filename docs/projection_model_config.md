# 投影模型配置读取位置

## 概述

投影模型的配置读取主要涉及两个方面：
1. **投影模型文件路径**的获取
2. **投影模型初始化参数**的读取

## 1. 投影模型路径配置

### 位置：`ModelStore.getModelFullPath()` 

**文件**：`src/store/ModelStore.ts` 第 626-667 行

**功能**：根据模型的 origin 和 filename 生成完整的文件路径

**路径规则**：

```typescript
// 1. LOCAL 模型
if (model.isLocal || model.origin === ModelOrigin.LOCAL) {
  return model.fullPath;  // 直接使用 fullPath
}

// 2. PRESET 模型
if (model.origin === ModelOrigin.PRESET) {
  const author = model.author || 'unknown';
  const oldPath = `${RNFS.DocumentDirectoryPath}/${model.filename}`;
  const newPath = `${RNFS.DocumentDirectoryPath}/models/preset/${author}/${model.filename}`;
  // 优先检查旧路径（向后兼容），否则使用新路径
  return await RNFS.exists(oldPath) ? oldPath : newPath;
}

// 3. HF (HuggingFace) 模型
if (model.origin === ModelOrigin.HF) {
  const author = model.author || 'unknown';
  return `${RNFS.DocumentDirectoryPath}/models/hf/${author}/${model.filename}`;
}
```

**调用位置**：
- `ModelStore.initContext()` 第 988 行：获取投影模型路径
- `VideoPalScreen.tsx` 第 79 行：获取投影模型路径
- `ProjectionModelSelector.tsx` 第 94 行：获取投影模型路径

## 2. 投影模型初始化配置

### 位置：`ModelStore.proceedWithInitialization()` 

**文件**：`src/store/ModelStore.ts` 第 1117-1148 行

**配置参数**：

```typescript
// 第 1123-1126 行
const success = await ctx.initMultimodal({
  path: mmProjPath,  // 投影模型文件路径（通过 getModelFullPath 获取）
  use_gpu: !this.contextInitParams.no_gpu_devices,  // GPU 使用配置
});
```

### 配置参数来源

#### 2.1 `path` 参数

**来源**：`getModelFullPath(projectionModel)` 的返回值

**获取流程**：
```typescript
// 第 984-988 行
projectionModel = this.models.find(
  m => m.id === model.defaultProjectionModel,
);
if (projectionModel?.isDownloaded) {
  mmProjPath = await this.getModelFullPath(projectionModel);
}
```

#### 2.2 `use_gpu` 参数

**来源**：`this.contextInitParams.no_gpu_devices`

**配置位置**：
- **存储位置**：`ModelStore.contextInitParams`（第 61 行导入）
- **设置方法**：`ModelStore.setNoGpuDevices()`（第 1554 行）
- **默认值**：`true`（禁用 GPU，在 `contextInitParamsVersions.ts` 第 47 行）
- **UI 设置**：`SettingsScreen.tsx` 第 142 行和第 307 行

**逻辑**：
```typescript
use_gpu: !this.contextInitParams.no_gpu_devices
// 如果 no_gpu_devices = true（禁用 GPU），则 use_gpu = false
// 如果 no_gpu_devices = false（启用 GPU），则 use_gpu = true
```

## 3. 投影模型元数据配置

### 位置：`hfAsModel()` 函数

**文件**：`src/utils/index.ts` 第 405-491 行

**功能**：从 HuggingFace 模型数据创建 Model 对象，包含投影模型相关信息

**配置字段**：

```typescript
const _model: Model = {
  // ... 其他字段
  
  // 多模态支持字段
  supportsMultimodal: isVisionLLM,  // 是否支持多模态
  modelType: isProjModel 
    ? ModelType.PROJECTION  // 如果是投影模型
    : isVisionLLM 
      ? ModelType.VISION  // 如果是视觉模型
      : undefined,
  
  // 投影模型相关
  compatibleProjectionModels: isVisionLLM 
    ? compatibleProjectionModels  // 兼容的投影模型 ID 列表
    : undefined,
  defaultProjectionModel: isVisionLLM 
    ? defaultProjectionModel  // 默认投影模型 ID
    : undefined,
  
  visionEnabled: isVisionLLM ? true : undefined,  // 默认启用 vision
};
```

**投影模型推荐逻辑**（第 433-447 行）：
```typescript
if (isVisionLLM) {
  const mmprojFiles = getMmprojFiles(hfModel.siblings || []);
  compatibleProjectionModels = mmprojFiles.map(
    file => `${hfModel.id}/${file.rfilename}`,
  );
  
  // 根据量化级别推荐匹配的投影模型
  const recommendedFile = getRecommendedProjectionModel(
    modelFile.rfilename,
    mmprojFilenames,
  );
  
  if (recommendedFile) {
    defaultProjectionModel = `${hfModel.id}/${recommendedFile}`;
  }
}
```

## 4. 配置读取流程

### 完整流程

```
1. 用户选择/下载多模态模型
   ↓
2. hfAsModel() 创建 Model 对象
   - 设置 supportsMultimodal = true
   - 设置 defaultProjectionModel = "repo/mmproj.gguf"
   - 设置 compatibleProjectionModels = [...]
   ↓
3. 用户初始化模型 (initContext)
   ↓
4. 查找投影模型对象
   projectionModel = models.find(m => m.id === defaultProjectionModel)
   ↓
5. 获取投影模型路径
   mmProjPath = await getModelFullPath(projectionModel)
   - 根据 origin 和 filename 生成路径
   - 例如：/Documents/models/hf/author/mmproj.gguf
   ↓
6. 读取 GPU 配置
   use_gpu = !this.contextInitParams.no_gpu_devices
   - 从 ModelStore.contextInitParams 读取
   - 默认值：true（禁用 GPU）
   ↓
7. 初始化多模态
   await ctx.initMultimodal({
     path: mmProjPath,
     use_gpu: use_gpu,
   })
```

## 5. 关键代码位置总结

| 配置项 | 读取位置 | 文件 | 行号 |
|--------|----------|------|------|
| 投影模型路径 | `getModelFullPath()` | `src/store/ModelStore.ts` | 626 |
| 投影模型路径使用 | `initContext()` | `src/store/ModelStore.ts` | 988 |
| GPU 配置读取 | `proceedWithInitialization()` | `src/store/ModelStore.ts` | 1125 |
| GPU 配置存储 | `contextInitParams` | `src/store/ModelStore.ts` | 多处 |
| GPU 配置设置 | `setNoGpuDevices()` | `src/store/ModelStore.ts` | 1554 |
| GPU 配置 UI | `SettingsScreen` | `src/screens/SettingsScreen/SettingsScreen.tsx` | 142, 307 |
| 投影模型元数据 | `hfAsModel()` | `src/utils/index.ts` | 405-491 |
| 投影模型推荐 | `getRecommendedProjectionModel()` | `src/utils/multimodalHelpers.ts` | 52 |

## 6. 配置持久化

投影模型相关的配置会持久化到：
- **模型列表**：存储在 `ModelStore.models` 中，包含 `defaultProjectionModel` 和 `compatibleProjectionModels`
- **GPU 配置**：存储在 `ModelStore.contextInitParams.no_gpu_devices` 中
- **Vision 启用状态**：存储在 `Model.visionEnabled` 中

这些配置会在应用重启后自动恢复。





