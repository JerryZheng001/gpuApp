# SDK 方法对比：后端提供的 vs 项目需要的

## 📋 后端已提供的方法（test_long_generation.c）

从 `test_long_generation.c` 文件中，后端 SDK 提供了以下方法：

1. **`gpuf_init()`** - 初始化 SDK
2. **`gpuf_cleanup()`** - 清理 SDK
3. **`gpuf_load_model(model_path)`** - 加载模型
4. **`gpuf_create_context(model)`** - 创建上下文
5. **`gpuf_generate_with_sampling(...)`** - 生成文本（带采样参数）

## 🔍 项目中使用的 @pocketpalai/llama.rn 方法

### 1. 初始化相关

#### `initLlama(params, progressCallback)`
- **位置：** `src/store/ModelStore.ts:1099`
- **用途：** 初始化 Llama 上下文
- **参数：**
  ```typescript
  {
    model: string,           // 模型路径
    n_ctx: number,          // 上下文窗口大小
    n_batch: number,        // 批处理大小
    n_ubatch: number,       // 未批处理大小
    n_threads: number,      // 线程数
    flash_attn: boolean,    // Flash Attention
    cache_type_k: string,  // K 缓存类型
    cache_type_v: string,  // V 缓存类型
    n_gpu_layers: number,   // GPU 层数
    no_gpu_devices: boolean,// 禁用 GPU
    use_mlock: boolean,      // 内存锁定
    use_mmap: boolean,      // 内存映射
    use_progress_callback: boolean
  }
  ```
- **返回：** `Promise<LlamaContext>`
- **对应后端方法：** `gpuf_load_model` + `gpuf_create_context`（需要合并）

#### `loadLlamaModelInfo(modelPath)`
- **位置：** `src/utils/memorySettings.ts:25`
- **用途：** 加载模型信息（不加载完整模型）
- **参数：** `modelPath: string`
- **返回：** `Promise<ModelInfo>`（包含文件类型、参数等）
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_get_model_info(model_path)`

### 2. LlamaContext 实例方法

#### `context.completion(params, onToken)`
- **位置：** 多处使用（`src/hooks/useChatSession.ts:360`, `src/store/ModelStore.ts:2168` 等）
- **用途：** 生成文本（主要推理方法）
- **参数：**
  ```typescript
  {
    messages: Array<{role: string, content: string | Array}>,
    prompt?: string,
    n_predict: number,        // 最大生成 token 数
    temperature: number,      // 温度
    top_k: number,           // Top-K
    top_p: number,           // Top-P
    min_p: number,           // Min-P
    repeat_penalty: number,  // 重复惩罚
    stop: string[],          // 停止词
    response_format?: {      // 结构化输出
      type: 'json_schema',
      json_schema: {...}
    },
    // ... 更多参数
  }
  ```
- **回调：** `onToken?: (data: TokenData) => void` - 流式输出 token
- **返回：** `Promise<{text: string, timings: {...}}>`
- **对应后端方法：** `gpuf_generate_with_sampling`（但需要支持更多参数和流式输出）

#### `context.stopCompletion()`
- **位置：** `src/hooks/useChatSession.ts:470`, `src/hooks/useStructuredOutput.ts:45`
- **用途：** 停止正在进行的生成
- **参数：** 无
- **返回：** `Promise<void>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_stop_generation(context)`

#### `context.getFormattedChat(messages)`
- **位置：** `src/utils/chat.ts:112`, `src/screens/DevToolsScreen/.../TestCompletionScreen.tsx:324`
- **用途：** 使用聊天模板格式化消息
- **参数：** `messages: ChatMessage[]`
- **返回：** `Promise<string | JinjaFormattedChatResult>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_format_chat(context, messages, template?)`

#### `context.initMultimodal(params)`
- **位置：** `src/store/ModelStore.ts:1123`
- **用途：** 初始化多模态支持（图像理解）
- **参数：**
  ```typescript
  {
    path: string,      // mmproj 文件路径
    use_gpu: boolean  // 是否使用 GPU
  }
  ```
- **返回：** `Promise<boolean>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_init_multimodal(context, mmproj_path, use_gpu)`

#### `context.isMultimodalEnabled()`
- **位置：** `src/store/ModelStore.ts:1133`, `src/store/ModelStore.ts:1705`
- **用途：** 检查多模态是否已启用
- **参数：** 无
- **返回：** `Promise<boolean>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_is_multimodal_enabled(context)`

#### `context.releaseMultimodal()`
- **位置：** `src/store/ModelStore.ts:1186`
- **用途：** 释放多模态资源
- **参数：** 无
- **返回：** `Promise<void>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_release_multimodal(context)`

#### `context.release()`
- **位置：** `src/store/ModelStore.ts:1204`
- **用途：** 释放上下文资源
- **参数：** 无
- **返回：** `Promise<void>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_release_context(context)`

#### `context.bench(pp, tg, pl, nr)`
- **位置：** `src/screens/BenchmarkScreen/BenchmarkScreen.tsx:165`
- **用途：** 运行性能基准测试
- **参数：**
  ```typescript
  pp: number,  // prompt processing
  tg: number,  // token generation
  pl: number,  // prompt length
  nr: number   // number of runs
  ```
- **返回：** `Promise<{speedPp: number, speedTg: number}>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_bench(context, pp, tg, pl, nr)`

#### `context.saveSession(path, size)`
- **位置：** `ios/PocketPal/AppIntents/LlamaInferenceEngine.swift:339`
- **用途：** 保存会话缓存
- **参数：**
  ```typescript
  path: string,  // 保存路径
  size: number   // 保存的 token 数量（-1 表示全部）
  ```
- **返回：** `Promise<number>` - 保存的 token 数量
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_save_session(context, path, size)`

#### `context.loadSession(path)`
- **位置：** `ios/PocketPal/AppIntents/LlamaContextWrapper.mm:116`
- **用途：** 加载会话缓存
- **参数：** `path: string`
- **返回：** `Promise<SessionData>`
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_load_session(context, path)`

#### `context.invalidate()`
- **位置：** `ios/PocketPal/AppIntents/LlamaInferenceEngine.swift:318`
- **用途：** 使上下文无效（清理）
- **参数：** 无
- **返回：** `void`
- **对应后端方法：** 可能等同于 `gpuf_release_context`

#### `context.isModelLoaded`
- **位置：** `ios/PocketPal/AppIntents/LlamaContextWrapper.mm:40`
- **用途：** 检查模型是否已加载
- **类型：** `boolean`（属性）
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_is_model_loaded(context)`

### 3. Context 属性

#### `context.model`
- **位置：** 多处使用
- **用途：** 访问模型信息
- **属性：**
  ```typescript
  {
    size: number,        // 模型大小
    nParams: number,     // 参数数量
    desc: string,        // 模型描述
    // ... 更多属性
  }
  ```
- **对应后端方法：** ❌ **缺失** - 需要提供 `gpuf_get_model_info(context)`

#### `context.id`
- **位置：** `src/hooks/useChatSession.ts:131`
- **用途：** 上下文 ID
- **类型：** `number`
- **对应后端方法：** 可能需要 `gpuf_get_context_id(context)`

## 📊 方法对比总结

| 功能 | 后端提供 | 项目需要 | 状态 |
|------|---------|---------|------|
| 初始化 SDK | ✅ `gpuf_init` | ✅ | ✅ 已提供 |
| 清理 SDK | ✅ `gpuf_cleanup` | ✅ | ✅ 已提供 |
| 加载模型 | ✅ `gpuf_load_model` | ✅ | ✅ 已提供 |
| 创建上下文 | ✅ `gpuf_create_context` | ✅ | ✅ 已提供 |
| 生成文本 | ✅ `gpuf_generate_with_sampling` | ✅ `completion` | ⚠️ 需要增强 |
| 停止生成 | ❌ | ✅ `stopCompletion` | ❌ **缺失** |
| 获取模型信息 | ❌ | ✅ `loadLlamaModelInfo` | ❌ **缺失** |
| 格式化聊天 | ❌ | ✅ `getFormattedChat` | ❌ **缺失** |
| 多模态初始化 | ❌ | ✅ `initMultimodal` | ❌ **缺失** |
| 检查多模态 | ❌ | ✅ `isMultimodalEnabled` | ❌ **缺失** |
| 释放多模态 | ❌ | ✅ `releaseMultimodal` | ❌ **缺失** |
| 释放上下文 | ❌ | ✅ `release` | ❌ **缺失** |
| 性能基准测试 | ❌ | ✅ `bench` | ❌ **缺失** |
| 保存会话 | ❌ | ✅ `saveSession` | ❌ **缺失** |
| 加载会话 | ❌ | ✅ `loadSession` | ❌ **缺失** |
| 检查模型加载 | ❌ | ✅ `isModelLoaded` | ❌ **缺失** |
| 获取模型属性 | ❌ | ✅ `model` 属性 | ❌ **缺失** |

## 🚨 需要后端提供的方法

### 高优先级（核心功能）

1. **`gpuf_stop_generation(context)`**
   - 停止正在进行的文本生成
   - 参数：`llama_context* ctx`
   - 返回：`int` (0 = 成功)

2. **`gpuf_get_model_info(model_path)`**
   - 获取模型信息（不加载完整模型）
   - 参数：`const char* model_path`
   - 返回：`ModelInfo*` 或 JSON 字符串
   - 需要包含：文件类型、参数数量、上下文长度等

3. **`gpuf_release_context(context)`**
   - 释放上下文资源
   - 参数：`llama_context* ctx`
   - 返回：`int` (0 = 成功)

4. **`gpuf_is_model_loaded(context)`**
   - 检查模型是否已加载
   - 参数：`llama_context* ctx`
   - 返回：`int` (1 = 已加载, 0 = 未加载)

### 中优先级（重要功能）

5. **`gpuf_format_chat(context, messages, template)`**
   - 使用聊天模板格式化消息
   - 参数：
     - `llama_context* ctx`
     - `const char* messages` (JSON 格式)
     - `const char* template` (可选，Jinja2 模板)
   - 返回：`char*` (格式化后的字符串)

6. **`gpuf_get_model_metadata(context)`**
   - 获取模型元数据
   - 参数：`llama_context* ctx`
   - 返回：`char*` (JSON 格式，包含 size, nParams, desc 等)

### 低优先级（可选功能）

7. **`gpuf_init_multimodal(context, mmproj_path, use_gpu)`**
   - 初始化多模态支持
   - 参数：
     - `llama_context* ctx`
     - `const char* mmproj_path`
     - `int use_gpu`
   - 返回：`int` (1 = 成功, 0 = 失败)

8. **`gpuf_is_multimodal_enabled(context)`**
   - 检查多模态是否启用
   - 参数：`llama_context* ctx`
   - 返回：`int` (1 = 启用, 0 = 未启用)

9. **`gpuf_release_multimodal(context)`**
   - 释放多模态资源
   - 参数：`llama_context* ctx`
   - 返回：`int` (0 = 成功)

10. **`gpuf_save_session(context, path, size)`**
    - 保存会话缓存
    - 参数：
      - `llama_context* ctx`
      - `const char* path`
      - `int size` (-1 表示全部)
    - 返回：`int` (保存的 token 数量)

11. **`gpuf_load_session(context, path)`**
    - 加载会话缓存
    - 参数：
      - `llama_context* ctx`
      - `const char* path`
    - 返回：`int` (加载的 token 数量)

12. **`gpuf_bench(context, pp, tg, pl, nr)`**
    - 运行性能基准测试
    - 参数：
      - `llama_context* ctx`
      - `int pp` (prompt processing)
      - `int tg` (token generation)
      - `int pl` (prompt length)
      - `int nr` (number of runs)
    - 返回：`char*` (JSON 格式，包含 speedPp, speedTg)

## 🔧 需要增强的现有方法

### `gpuf_generate_with_sampling`

当前方法签名：
```c
int gpuf_generate_with_sampling(
    llama_model* model,
    llama_context* ctx,
    const char* prompt,
    int max_tokens,
    float temperature,
    int top_k,
    float top_p,
    float repeat_penalty,
    LlamaToken* token_buffer,
    int token_buffer_size,
    char* output,
    int output_len
);
```

**需要增强的功能：**

1. **流式输出支持**
   - 添加回调函数参数：`void (*on_token)(const char* token, void* user_data)`
   - 允许实时返回生成的 token

2. **更多采样参数**
   - `min_p` (最小概率)
   - `xtc_threshold` (XTC 阈值)
   - `xtc_probability` (XTC 概率)
   - `typical_p` (典型采样)
   - `penalty_last_n` (惩罚窗口)
   - `penalty_freq` (频率惩罚)
   - `penalty_present` (存在惩罚)
   - `mirostat` (Mirostat 采样)
   - `mirostat_tau` (Mirostat tau)
   - `mirostat_eta` (Mirostat eta)
   - `seed` (随机种子)

3. **停止词支持**
   - 添加参数：`const char** stop_words, int stop_words_count`

4. **结构化输出支持**
   - 添加参数：`const char* json_schema` (JSON Schema 字符串)

5. **消息格式支持**
   - 支持 `messages` 数组格式（不仅仅是 prompt 字符串）
   - 支持多模态消息（文本 + 图像）

6. **返回更多信息**
   - 返回结构体包含：`text`, `timings`, `tokens_generated` 等

**建议的新签名：**
```c
typedef struct {
    char* text;
    int tokens_generated;
    double time_to_first_token;
    double total_time;
} GenerationResult;

typedef void (*TokenCallback)(const char* token, void* user_data);

int gpuf_generate_with_sampling_v2(
    llama_context* ctx,
    const char* prompt_or_messages,  // JSON 格式
    GenerationParams* params,         // 包含所有采样参数
    const char** stop_words,
    int stop_words_count,
    const char* json_schema,          // 可选，用于结构化输出
    TokenCallback on_token,           // 可选，流式输出回调
    void* user_data,                  // 回调用户数据
    GenerationResult* result           // 输出结果
);
```

## 📝 总结

### 必须提供的方法（核心功能）
1. ✅ `gpuf_stop_generation` - 停止生成
2. ✅ `gpuf_get_model_info` - 获取模型信息
3. ✅ `gpuf_release_context` - 释放上下文
4. ✅ `gpuf_is_model_loaded` - 检查模型加载状态

### 建议提供的方法（重要功能）
5. ✅ `gpuf_format_chat` - 格式化聊天
6. ✅ `gpuf_get_model_metadata` - 获取模型元数据

### 可选提供的方法（增强功能）
7. ✅ `gpuf_init_multimodal` - 多模态初始化
8. ✅ `gpuf_is_multimodal_enabled` - 检查多模态
9. ✅ `gpuf_release_multimodal` - 释放多模态
10. ✅ `gpuf_save_session` - 保存会话
11. ✅ `gpuf_load_session` - 加载会话
12. ✅ `gpuf_bench` - 性能基准测试

### 需要增强的现有方法
- ⚠️ `gpuf_generate_with_sampling` - 需要支持流式输出、更多参数、消息格式等

