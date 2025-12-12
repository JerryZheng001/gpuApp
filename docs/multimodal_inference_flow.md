# 多模态推理流程说明

## 多模态推理入口

### 主要入口：`ModelStore.initContext()`

**位置**：`src/store/ModelStore.ts` 第 960 行

**流程**：

1. **检查多模态初始化条件**（第 967-991 行）：
   ```typescript
   // 检查是否启用vision
   const visionEnabled = this.getModelVisionPreference(model);
   
   // 如果提供了 mmProjPath 且 vision 启用
   if (mmProjPath && visionEnabled) {
     isMultimodalInit = true;
   }
   // 或者检查模型是否有默认投影模型
   else if (
     model.supportsMultimodal &&
     model.defaultProjectionModel &&
     visionEnabled
   ) {
     projectionModel = this.models.find(
       m => m.id === model.defaultProjectionModel,
     );
     if (projectionModel?.isDownloaded) {
       mmProjPath = await this.getModelFullPath(projectionModel);
       isMultimodalInit = true;
     }
   }
   ```

2. **设备能力检查**（第 993-1001 行）：
   - 检查内存是否足够（考虑多模态需要更多内存）
   - 检查设备是否支持多模态（`isHighEndDevice()`）

3. **初始化模型上下文**（第 1072-1150 行）：
   - 调用 `initLlama()` 初始化主模型
   - 如果 `isMultimodalInit && mmProjPath`，调用 `ctx.initMultimodal()`：
     ```typescript
     const success = await ctx.initMultimodal({
       path: mmProjPath,
       use_gpu: !this.contextInitParams.no_gpu_devices,
     });
     ```

### 其他入口

1. **VideoPalScreen**（`src/screens/ChatScreen/VideoPalScreen.tsx` 第 48-107 行）：
   - 在初始化 Video Pal 时，如果模型支持多模态，会自动加载投影模型

2. **ProjectionModelSelector**（`src/components/ProjectionModelSelector/ProjectionModelSelector.tsx` 第 74-104 行）：
   - 用户切换投影模型时，会重新初始化上下文

## 下载流程

### 主模型和投影模型下载

**重要**：主模型和投影模型**不是一起下载**的，而是**分别下载**的。

### 下载流程详解

1. **用户触发下载**（`downloadHFModel` 第 1242 行）：
   ```typescript
   await modelStore.downloadHFModel(hfModel, modelFile, {
     enableVision: true,  // 用户选择是否启用vision
     projectionModelId: 'xxx/mmproj.gguf',  // 可选：用户选择的投影模型
   });
   ```

2. **添加到模型列表**（`addHFModel` 第 1312 行）：
   - 将主模型添加到 `models` 列表
   - **自动添加所有投影模型到列表**（第 1330-1350 行）：
     ```typescript
     // 获取仓库中的所有 mmproj 文件
     const mmprojFiles = getMmprojFiles(hfModel.siblings || []);
     
     // 为每个投影模型创建 Model 对象并添加到列表
     for (const mmprojFile of mmprojFiles) {
       const projModel = hfAsModel(hfModel, mmprojFile);
       this.models.push(projModel);
     }
     ```

3. **开始下载主模型**（`checkSpaceAndDownload` 第 761 行）：
   ```typescript
   await downloadManager.startDownload(model, destinationPath, authToken);
   ```

4. **自动下载投影模型**（第 781 行）：
   ```typescript
   // 主模型下载开始后，立即检查是否需要下载投影模型
   await this._downloadProjectionModelIfNeeded(model);
   ```

5. **投影模型下载条件**（`_downloadProjectionModelIfNeeded` 第 718 行）：
   ```typescript
   // 只有满足以下条件才会自动下载：
   // 1. 模型支持多模态
   // 2. 有默认投影模型
   // 3. 不是投影模型本身
   // 4. Vision 已启用
   // 5. 投影模型未下载且不在下载中
   if (
     model.supportsMultimodal &&
     model.defaultProjectionModel &&
     visionEnabled &&
     !projModel.isDownloaded &&
     !downloadManager.isDownloading(projModelId)
   ) {
     await this.checkSpaceAndDownload(projModelId);
   }
   ```

### 下载特点

1. **异步下载**：
   - 主模型和投影模型是**分别启动下载**的
   - 主模型下载开始后，投影模型会紧接着开始下载
   - 两者可以**并行下载**

2. **可选下载**：
   - 投影模型下载失败**不会影响**主模型下载
   - 如果投影模型下载失败，用户可以稍后手动下载

3. **自动匹配**：
   - 系统会根据主模型的量化级别自动推荐匹配的投影模型
   - 推荐逻辑在 `getRecommendedProjectionModel()` 中（`src/utils/multimodalHelpers.ts`）

## 关键代码位置

| 功能 | 文件 | 行号 |
|------|------|------|
| 多模态初始化入口 | `src/store/ModelStore.ts` | 960 |
| 投影模型自动下载 | `src/store/ModelStore.ts` | 718 |
| 下载触发 | `src/store/ModelStore.ts` | 761, 781 |
| 模型添加到列表 | `src/store/ModelStore.ts` | 1312 |
| 投影模型推荐 | `src/utils/multimodalHelpers.ts` | 52 |
| SDK 多模态初始化 | `src/store/ModelStore.ts` | 1123 |

## 投影模型是否必需？

### ✅ **是的，必须有投影模型才能运行多模态**

从代码逻辑可以看出：

1. **多模态初始化条件**（第 974-991 行）：
   ```typescript
   // 条件1：直接提供 mmProjPath 且 vision 启用
   if (mmProjPath && visionEnabled) {
     isMultimodalInit = true;
   }
   // 条件2：模型有默认投影模型、vision 启用、且投影模型已下载
   else if (
     model.supportsMultimodal &&
     model.defaultProjectionModel &&
     visionEnabled &&
     projectionModel?.isDownloaded  // 关键：必须已下载
   ) {
     mmProjPath = await this.getModelFullPath(projectionModel);
     isMultimodalInit = true;
   }
   ```

2. **多模态初始化调用**（第 1118 行）：
   ```typescript
   // 只有当 isMultimodalInit && mmProjPath 时才初始化
   if (isMultimodalInit && mmProjPath) {
     await ctx.initMultimodal({
       path: mmProjPath,  // 必须有投影模型路径
       use_gpu: ...
     });
   }
   ```

3. **如果没有投影模型**：
   - `isMultimodalInit` 会是 `false`
   - 不会调用 `ctx.initMultimodal()`
   - 多模态功能不会被启用
   - 模型只能作为普通文本模型使用

4. **UI 层面的处理**：
   - 如果投影模型缺失，会显示警告标识（`projectionMissingWarning`）
   - 用户可以通过点击警告来下载缺失的投影模型
   - 在 `getProjectionModelStatus()` 中，缺失状态返回 `state: 'missing'`

### 结论

- ✅ **投影模型是必需的**：没有投影模型，多模态功能无法初始化
- ✅ **投影模型必须已下载**：即使模型列表中有投影模型，如果未下载也无法使用
- ✅ **可以降级使用**：没有投影模型时，模型仍然可以作为普通文本模型使用

## 总结

1. **多模态推理入口**：`ModelStore.initContext()` 是主要入口，会检查条件并调用 `ctx.initMultimodal()`

2. **投影模型必需性**：
   - ✅ **必须有投影模型**：没有投影模型无法运行多模态
   - ✅ **投影模型必须已下载**：未下载的投影模型无法使用
   - ✅ **可以降级使用**：没有投影模型时，模型仍可作为文本模型使用

3. **下载方式**：
   - ❌ **不是一起下载**
   - ✅ **分别下载**：主模型先开始，投影模型紧接着自动开始
   - ✅ **可以并行下载**：两个下载任务可以同时进行
   - ✅ **投影模型下载是可选的**：失败不影响主模型（但会影响多模态功能）

4. **自动下载触发**：
   - 当用户下载支持多模态的主模型时
   - 如果 vision 已启用
   - 系统会自动开始下载对应的投影模型

