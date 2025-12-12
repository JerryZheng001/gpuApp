# Generate 函数位置和说明

## 📍 函数位置

### 1. **`generate` 函数（用于结构化输出）**

**文件位置：** `src/hooks/useStructuredOutput.ts`

**函数签名：**
```typescript
const generate = useCallback(
  async (
    prompt: string,
    schema: object,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      repeat_penalty?: number;
    },
  ) => {
    // ... 实现
  },
  [l10n.generation],
);
```

**是否异步：** ✅ **是的，是异步函数** (`async`)

**用途：** 生成结构化输出（JSON），用于系统提示生成等功能

**使用示例：**
```typescript
import {useStructuredOutput} from '../hooks/useStructuredOutput';

const {generate, isGenerating, stop} = useStructuredOutput();

// 使用
const result = await generate(prompt, schema, options);
```

### 2. **核心文本生成函数：`completion`**

**实际执行文本生成的是：** `modelStore.context.completion()`

**类型：** `LlamaContext` 的方法（来自 `@pocketpalai/llama.rn` 包）

**是否异步：** ✅ **是的，是异步函数** (返回 `Promise`)

**函数签名：**
```typescript
// 在 LlamaContext 中
completion(
  params: CompletionParams,
  onToken?: (data: TokenData) => void
): Promise<CompletionResult>
```

**主要使用位置：**

1. **聊天会话中：** `src/hooks/useChatSession.ts:360`
   ```typescript
   const result = await context.completion(cleanCompletionParams, data => {
     if (data.token && currentMessageInfo.current) {
       // 处理每个 token
       queueToken(data.token, ...);
     }
   });
   ```

2. **结构化输出中：** `src/hooks/useStructuredOutput.ts:47`
   ```typescript
   const result = await modelStore.context.completion({
     messages: [{role: 'user', content: prompt}],
     response_format: {
       type: 'json_schema',
       json_schema: { strict: true, schema },
     },
     // ... 其他参数
   });
   ```

3. **ModelStore 中：** `src/store/ModelStore.ts:2168`
   ```typescript
   const result = await this.context.completion(
     cleanCompletionParams,
     data => {
       if (data.token) {
         params.onToken?.(data.token);
       }
     },
   );
   ```

## 🔍 调用链

```
用户调用
  ↓
generate() [useStructuredOutput.ts]
  ↓ (异步)
modelStore.context.completion() [LlamaContext from @pocketpalai/llama.rn]
  ↓ (异步)
底层 llama.cpp 推理引擎
  ↓
返回生成的文本
```

## 📝 关键代码位置

### `generate` 函数完整实现

**文件：** `src/hooks/useStructuredOutput.ts`

```typescript
const generate = useCallback(
  async (
    prompt: string,
    schema: object,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      repeat_penalty?: number;
    },
  ) => {
    if (!modelStore.context) {
      throw new Error(l10n.generation.modelNotInitialized);
    }

    setIsGenerating(true);
    setError(null);
    const stopWords = toJS(modelStore.activeModel?.stopWords);

    try {
      // Store the stop function for later use
      stopRef.current = () => modelStore.context?.stopCompletion();

      // 调用核心的 completion 函数
      const result = await modelStore.context.completion({
        messages: [{role: 'user', content: prompt}],
        response_format: {
          type: 'json_schema',
          json_schema: {
            strict: true,
            schema,
          },
        },
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p ?? 0.9,
        top_k: options?.top_k ?? 40,
        n_predict: 2000,
        stop: stopWords,
      });

      stopRef.current = null;
      // Parse the completion text as JSON
      return safeParseJSON(result.text);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : l10n.generation.failedToGenerate;
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
      stopRef.current = null;
    }
  },
  [l10n.generation],
);
```

## ✅ 总结

1. **`generate` 函数位置：** `src/hooks/useStructuredOutput.ts`
2. **是否异步：** ✅ **是的，是异步函数**
3. **核心实现：** 内部调用 `modelStore.context.completion()`，这也是异步的
4. **返回类型：** `Promise<object>` (解析后的 JSON 对象)
5. **用途：** 主要用于生成结构化输出（如系统提示生成）

## 🔗 相关文件

- **Hook 定义：** `src/hooks/useStructuredOutput.ts`
- **使用示例：** `src/components/PalsSheets/SystemPromptSection.tsx:222`
- **核心 completion：** `src/store/ModelStore.ts:2168`
- **聊天中的 completion：** `src/hooks/useChatSession.ts:360`
- **类型定义：** `src/utils/completionTypes.ts`

