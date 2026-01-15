/**
 * RemoteChatService - 远程模型聊天服务
 * 基于gpunexus-web的聊天API实现远程模型推理
 */

import OpenAI from 'openai';
import Config from 'react-native-config';
import { mobileAuthService } from './mobile-auth';
import { MessageType } from '../utils/types';
import { CompletionParams, toApiCompletionParams } from '../utils/completionTypes';
import { assistant } from '../utils/chat';

// 扩展CompletionParams接口以包含OpenAI API需要的字段
interface ExtendedCompletionParams extends CompletionParams {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  group?: string; // 添加group字段
}

// 固定的Bearer Token（根据要求写死）
// const FIXED_BEARER_TOKEN = 'Bearer a5f6036890304096aef42f0aa3563cf20db920f8bfa12f93';
const FIXED_BEARER_TOKEN = 'Bearer sWmEu0iGFcauLAtnNtuthk0o6O7XudoIvEzi4jRIkncvfkFu';
void FIXED_BEARER_TOKEN;

// 流式响应回调类型
export interface StreamingCallback {
  (data: {
    content?: string;
    reasoning_content?: string;
    token?: string;
  }): void;
}

// 聊天消息类型 - 使用OpenAI的类型定义
type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

class RemoteChatService {
  private openai: OpenAI;
  private baseURL: string;

  private maskToken(token: string): string {
    if (!token) return '';
    if (token.length <= 10) return `${token.slice(0, 2)}***${token.slice(-2)}`;
    return `${token.slice(0, 4)}***${token.slice(-4)}`;
  }

  private getAuthorizationHeader(): string {
    const token = mobileAuthService.token;
    if (!token) {
      throw new Error('未登录或缺少token，请先登录');
    }
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  
  constructor() {
    this.baseURL = Config.REMOTE_API_BASE_URL || 'https://api.gpunexus.com';
    
    // 初始化OpenAI客户端。token 恢复是异步的，所以这里用占位 key，真正请求时再取 token。
    const token = mobileAuthService.token;
    const apiKey = token ? (token.startsWith('Bearer ') ? token.slice(7) : token) : 'default-key';
    console.log('RemoteChatService apiKey set:', {
      present: apiKey.length > 0,
      length: apiKey.length,
      masked: this.maskToken(apiKey),
    });
    this.openai = new OpenAI({
      apiKey, // 移除Bearer前缀，OpenAI库会自动添加
      baseURL: `${this.baseURL}`,
      dangerouslyAllowBrowser: true, // React Native环境需要
    });
  }

  /**
   * 更新认证token
   */
  updateAuthToken() {
    const token = mobileAuthService.token;
    this.openai.apiKey = token
      ? (token.startsWith('Bearer ') ? token.slice(7) : token)
      : 'default-key';
  }

  /**
   * 转换应用消息格式到OpenAI格式
   */
  private convertMessagesToOpenAIFormat(
    messages: MessageType.Any[],
    systemMessages: Array<{ role: 'system'; content: string }>
  ): ChatMessage[] {
    const openAIMessages: ChatMessage[] = [];
    
    // 添加系统消息
    systemMessages.forEach(msg => {
      openAIMessages.push({
        role: 'system',
        content: msg.content,
      });
    });

    const textMessages = messages.filter(
      (msg): msg is MessageType.Text => msg.type === 'text',
    );

    const hasTimestamps = textMessages.some(
      m => typeof m.createdAt === 'number' && Number.isFinite(m.createdAt),
    );

    const orderedTextMessages = [...textMessages]
      .filter(m => m.text && m.text.trim().length > 0)
      .sort((a, b) => {
        if (!hasTimestamps) return 0;
        const aTime = a.createdAt ?? 0;
        const bTime = b.createdAt ?? 0;
        return aTime - bTime;
      });

    // 转换聊天消息
    for (const msg of orderedTextMessages) {
      // 检查是否是assistant消息（通过ID判断，与convertToChatMessages保持一致）
      const isAssistant = msg.author?.id === assistant.id;

      // 处理文本消息（可能包含图片）
      if (msg.imageUris && msg.imageUris.length > 0 && !isAssistant) {
        // 多模态消息 - 仅用户消息可以有图片
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          {type: 'text', text: msg.text},
        ];

        // 添加图片
        msg.imageUris.forEach(uri => {
          content.push({
            type: 'image_url',
            image_url: {url: uri},
          });
        });

        openAIMessages.push({
          role: 'user',
          content,
        });
      } else {
        // 纯文本消息
        openAIMessages.push({
          role: isAssistant ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    return this.fixMessageAlternation(openAIMessages);
  }

  private fixMessageAlternation(messages: ChatMessage[]): ChatMessage[] {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(
      m => m.role === 'user' || m.role === 'assistant',
    );

    const result: ChatMessage[] = [...systemMessages];
    let lastRole: 'user' | 'assistant' | null = null;

    const mergeContent = (a: any, b: any): any => {
      if (Array.isArray(a) || Array.isArray(b)) {
        const aArr = Array.isArray(a) ? a : [{type: 'text', text: String(a ?? '')}];
        const bArr = Array.isArray(b) ? b : [{type: 'text', text: String(b ?? '')}];
        return [...aArr, ...bArr];
      }
      const aStr = String(a ?? '').trim();
      const bStr = String(b ?? '').trim();
      if (!aStr) return bStr;
      if (!bStr) return aStr;
      return `${aStr}\n${bStr}`;
    };

    for (const message of nonSystemMessages) {
      const currentRole = message.role as 'user' | 'assistant';

      if (lastRole === null) {
        if (currentRole === 'assistant') {
          continue;
        }
        result.push(message);
        lastRole = currentRole;
        continue;
      }

      if (currentRole === lastRole) {
        const last = result[result.length - 1] as any;
        last.content = mergeContent(last.content, (message as any).content);
        continue;
      }

      result.push(message);
      lastRole = currentRole;
    }

    while (result.length > 0 && result[result.length - 1].role === 'assistant') {
      result.pop();
    }

    return result;
  }

  private isReactNative(): boolean {
    try {
      return (
        typeof navigator !== 'undefined' &&
        (navigator as any)?.product === 'ReactNative'
      );
    } catch {
      return false;
    }
  }

  private streamChatCompletionWithXhr(
    url: string,
    body: string,
    onStream: StreamingCallback,
    signal?: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastIndex = 0;
      let buffer = '';
      let didEmit = false;
      let doneReceived = false;

      const abortHandler = () => {
        try {
          xhr.abort();
        } catch {
          resolve();
        }
      };

      if (signal) {
        if (signal.aborted) {
          resolve();
          return;
        }
        signal.addEventListener('abort', abortHandler);
      }

      const cleanup = () => {
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }
      };

      const processNewText = () => {
        const responseText = xhr.responseText || '';
        if (responseText.length <= lastIndex) {
          return;
        }
        const chunk = responseText.slice(lastIndex);
        lastIndex = responseText.length;
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') continue;
          if (trimmed === 'data: [DONE]' || trimmed === 'data:[DONE]') {
            doneReceived = true;
            continue;
          }
          if (!trimmed.startsWith('data:')) continue;

          try {
            const match = /^data:\s*(.*)$/.exec(trimmed);
            const payload = match?.[1];
            if (!payload || payload === '[DONE]') continue;
            const data = JSON.parse(payload);
            const choice = data.choices?.[0];
            const delta = choice?.delta;
            const message = choice?.message;

            const content = delta?.content ?? message?.content;
            const reasoningContent =
              delta?.reasoning_content ?? message?.reasoning_content;
            if (!content && !reasoningContent) continue;
            onStream({
              content: content || '',
              reasoning_content: reasoningContent || '',
              token: content || '',
            });
            didEmit = true;
          } catch (parseError) {
            console.warn('解析SSE数据失败:', parseError, '数据:', trimmed);
          }
        }
      };

      const tryEmitJsonFallback = () => {
        if (didEmit) return;
        const responseText = xhr.responseText || '';
        if (!responseText) return;
        const trimmed = responseText.trim();
        if (!trimmed) return;

        // If the server returned SSE-like text but we didn't parse it (e.g. formatting differences),
        // try to extract the last JSON payload from data: lines.
        if (trimmed.startsWith('data:')) {
          const candidates = trimmed
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('data:'))
            .map(l => {
              const match = /^data:\s*(.*)$/.exec(l);
              return match?.[1];
            })
            .filter((p): p is string => !!p && p !== '[DONE]');

          for (let i = candidates.length - 1; i >= 0; i--) {
            try {
              const data = JSON.parse(candidates[i]);
              const message = data?.choices?.[0]?.message;
              const delta = data?.choices?.[0]?.delta;
              const content = message?.content ?? delta?.content;
              const reasoningContent =
                message?.reasoning_content ?? delta?.reasoning_content;
              if (typeof content === 'string' || typeof reasoningContent === 'string') {
                onStream({
                  content: typeof content === 'string' ? content : '',
                  reasoning_content:
                    typeof reasoningContent === 'string' ? reasoningContent : '',
                  token: typeof content === 'string' ? content : '',
                });
                didEmit = true;
                return;
              }
            } catch {
              // keep trying older candidates
            }
          }

          console.warn('XHR fallback: received data: lines but no content could be parsed', {
            status: xhr.status,
            responseSnippet: trimmed.slice(0, 300),
          });
          return;
        }

        try {
          const data = JSON.parse(trimmed);
          const message = data?.choices?.[0]?.message;
          const delta = data?.choices?.[0]?.delta;
          const content = message?.content ?? delta?.content;
          const reasoningContent = message?.reasoning_content ?? delta?.reasoning_content;
          if (typeof content === 'string' || typeof reasoningContent === 'string') {
            onStream({
              content: typeof content === 'string' ? content : '',
              reasoning_content:
                typeof reasoningContent === 'string' ? reasoningContent : '',
              token: typeof content === 'string' ? content : '',
            });
            didEmit = true;
          } else {
            console.warn('XHR fallback: JSON parsed but no content fields found', {
              status: xhr.status,
              responseSnippet: trimmed.slice(0, 300),
            });
          }
        } catch {
          console.warn('XHR fallback: could not parse response as JSON', {
            status: xhr.status,
            responseSnippet: trimmed.slice(0, 300),
          });
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3) {
          processNewText();
        }
        if (xhr.readyState !== 4) return;

        processNewText();

        const status = xhr.status;
        if (status >= 200 && status < 300) {
          tryEmitJsonFallback();

          const finalText = (xhr.responseText || '').trim();
          if (!didEmit) {
            const contentType = String(
              xhr.getResponseHeader('content-type') || '',
            );
            const responseSnippet = finalText.slice(0, 500);

            console.warn('XHR completion produced no content', {
              status,
              contentType,
              doneReceived,
              responseSnippet,
            });

            cleanup();
            reject(new Error(`API返回空响应: status=${status}, content-type=${contentType}`));
            return;
          }

          cleanup();
          resolve();
          return;
        }

        if (signal?.aborted) {
          cleanup();
          resolve();
          return;
        }

        if (status === 0) {
          const contentType = String(xhr.getResponseHeader('content-type') || '');
          const responseText = (xhr.responseText || '').trim();
          console.warn('XHR completed with status=0 (network/blocked/closed connection)', {
            readyState: xhr.readyState,
            contentType,
            responseSnippet: responseText.slice(0, 500),
          });
          cleanup();
          reject(new Error('网络请求失败或连接被中断（status=0）'));
          return;
        }

        const errorText = xhr.responseText || '';
        cleanup();
        reject(new Error(`API错误 (${status}): ${errorText}`));
      };

      xhr.onprogress = () => {
        processNewText();
      };

      xhr.onerror = () => {
        if (signal?.aborted) {
          cleanup();
          resolve();
          return;
        }
        cleanup();
        reject(new Error('网络请求失败，请检查网络连接'));
      };

      xhr.onabort = () => {
        cleanup();
        resolve();
      };

      xhr.timeout = 60000;
      xhr.ontimeout = () => {
        if (signal?.aborted) {
          cleanup();
          resolve();
          return;
        }
        const responseText = (xhr.responseText || '').trim();
        console.warn('XHR request timeout', {
          url,
          responseSnippet: responseText.slice(0, 500),
        });
        cleanup();
        reject(new Error('网络请求超时'));
      };

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream, application/json');
      xhr.setRequestHeader('Client-Type', 'app');
      xhr.setRequestHeader('New-Api-User', String(mobileAuthService.user?.id ?? ''));
      xhr.setRequestHeader('Authorization', this.getAuthorizationHeader());

      console.log('XHR sending request body:', body);
      xhr.send(body);
    });
  }

  /**
   * 流式聊天完成
   */
  async streamChatCompletion(
    messages: MessageType.Any[],
    systemMessages: Array<{ role: 'system'; content: string }>,
    completionParams: ExtendedCompletionParams,
    onStream: StreamingCallback,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      // 转换消息格式
      const openAIMessages = this.convertMessagesToOpenAIFormat(messages, systemMessages);

      // 转换参数格式 - 使用原始参数，因为OpenAI需要更多字段
      const apiParams = toApiCompletionParams(completionParams);
      
      // 构建OpenAI API参数，包含所有必要字段
      const openAIParams: any = {
        model: completionParams.model || 'gpt-4o',
        messages: openAIMessages,
        temperature: completionParams.temperature,
        max_tokens: completionParams.max_tokens,
        top_p: completionParams.top_p,
        frequency_penalty: completionParams.frequency_penalty,
        presence_penalty: completionParams.presence_penalty,
        stream: true,
        stream_options: { include_usage: true },
      };
      
      // 只有当 group 有值时才添加
      if (completionParams.group !== undefined) {
        openAIParams.group = completionParams.group;
      }

      console.log('Remote chat request:', {
        url: `${this.baseURL}/v1/chat/completions`,
        params: openAIParams,
      });
      console.log('Group parameter being sent:', openAIParams.group);

      if (this.isReactNative()) {
        await this.streamChatCompletionWithXhr(
          `${this.baseURL}/v1/chat/completions`,
          JSON.stringify(openAIParams),
          onStream,
          signal,
        );
        return;
      }

      // 直接使用fetch调用API，参考demo的实现
      const authHeader = this.getAuthorizationHeader();
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'New-Api-User': String(mobileAuthService.user?.id ?? ''),
          'Authorization': authHeader,
        },
        body: JSON.stringify(openAIParams),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remote chat API error:', response.status, errorText);
        throw new Error(`API错误 (${response.status}): ${errorText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        const result = await this.chatCompletion(
          messages,
          systemMessages,
          completionParams,
        );
        onStream({
          content: result.content,
          reasoning_content: result.reasoning_content,
          token: result.content,
        });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          if (signal?.aborted) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个不完整的行

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') continue;
            if (trimmed === 'data: [DONE]') {
              return; // 流结束
            }
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const delta = data.choices?.[0]?.delta;
                
                if (delta) {
                  onStream({
                    content: delta.content || '',
                    reasoning_content: delta.reasoning_content || '',
                    token: delta.content || '',
                  });
                }
              } catch (parseError) {
                console.warn('解析SSE数据失败:', parseError, '数据:', trimmed);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('远程模型流式聊天失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 非流式聊天完成
   */
  async chatCompletion(
    messages: MessageType.Any[],
    systemMessages: Array<{ role: 'system'; content: string }>,
    completionParams: ExtendedCompletionParams
  ): Promise<{
    content: string;
    reasoning_content?: string;
  }> {
    try {
      // 转换消息格式
      const openAIMessages = this.convertMessagesToOpenAIFormat(messages, systemMessages);

      // 构建OpenAI API参数
      const openAIParams: any = {
        model: completionParams.model || 'gpt-4o',
        messages: openAIMessages,
        temperature: completionParams.temperature,
        max_tokens: completionParams.max_tokens,
        top_p: completionParams.top_p,
        frequency_penalty: completionParams.frequency_penalty,
        presence_penalty: completionParams.presence_penalty,
        stream: false,
      };
      
      // 只有当 group 有值时才添加
      if (completionParams.group !== undefined) {
        openAIParams.group = completionParams.group;
      }

      console.log('Remote chat request (non-stream):', {
        url: `${this.baseURL}/v1/chat/completions`,
        params: openAIParams,
      });

      // 直接使用fetch调用API
      const authHeader = this.getAuthorizationHeader();
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'New-Api-User': String(mobileAuthService.user?.id ?? ''),
          'Authorization': authHeader,
        },
        body: JSON.stringify(openAIParams),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remote chat API error:', response.status, errorText);
        throw new Error(`API错误 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.choices?.[0]) {
        const choice = data.choices[0];
        return {
          content: choice.message?.content || '',
          reasoning_content: choice.message?.reasoning_content || '',
        };
      }

      throw new Error('API响应格式不正确');
    } catch (error) {
      console.error('远程模型聊天失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 停止生成
   */
  stopCompletion(): void {
    // OpenAI客户端的流式响应可以通过AbortController停止
    // 具体实现由调用方控制AbortSignal
  }

  /**
   * 统一错误处理
   */
  private handleError(error: any): Error {
    if (error.response) {
      // API响应错误
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.data?.message || 'API错误';
      
      // 检查特定错误类型
      if (status === 401) {
        return new Error('认证失败，请重新登录');
      } else if (status === 403) {
        return new Error('权限不足或余额不足');
      } else if (status === 429) {
        return new Error('请求过于频繁，请稍后再试');
      } else if (status >= 500) {
        return new Error('服务器内部错误，请稍后再试');
      }
      
      return new Error(`API错误 (${status}): ${message}`);
    } else if (error.request) {
      // 网络请求错误
      return new Error('网络请求失败，请检查网络连接');
    } else {
      // 其他错误
      return new Error(error.message || '未知错误');
    }
  }

  /**
   * 检查模型是否支持流式响应
   */
  supportsStreaming(modelName: string): boolean {
    // 大多数现代模型都支持流式响应
    return true;
  }

  /**
   * 获取模型信息
   */
  async getModelInfo(modelName: string): Promise<{
    supportsStreaming: boolean;
    supportsThinking: boolean;
    maxTokens: number;
  }> {
    try {
      // 这里可以调用模型信息API，暂时返回默认值
      return {
        supportsStreaming: true,
        supportsThinking: modelName.toLowerCase().includes('o1') || modelName.toLowerCase().includes('think'),
        maxTokens: 4096,
      };
    } catch (error) {
      console.error('获取模型信息失败:', error);
      return {
        supportsStreaming: true,
        supportsThinking: false,
        maxTokens: 4096,
      };
    }
  }
}

export const remoteChatService = new RemoteChatService();
