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
const FIXED_BEARER_TOKEN = 'Bearer a5f6036890304096aef42f0aa3563cf20db920f8bfa12f93';

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
  
  constructor() {
    this.baseURL = Config.REMOTE_API_BASE_URL || 'https://api.gpunexus.com';
    
    // 初始化OpenAI客户端，使用固定的Bearer Token
    this.openai = new OpenAI({
      apiKey: FIXED_BEARER_TOKEN.replace('Bearer ', ''), // 移除Bearer前缀，OpenAI库会自动添加
      baseURL: `${this.baseURL}`,
      dangerouslyAllowBrowser: true, // React Native环境需要
      defaultHeaders: {
        'Authorization': FIXED_BEARER_TOKEN,
      },
    });
  }

  /**
   * 更新认证token
   */
  updateAuthToken() {
    this.openai.apiKey = mobileAuthService.session || 'default-key';
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

    // 转换聊天消息
    messages.forEach(msg => {
      if (msg.type === 'text') {
        if (!msg.text || msg.text.trim().length === 0) {
          return;
        }
        // 检查是否是assistant消息（通过ID判断，与convertToChatMessages保持一致）
        const isAssistant = msg.author?.id === assistant.id;
        
        // 处理文本消息（可能包含图片）
        if (msg.imageUris && msg.imageUris.length > 0 && !isAssistant) {
          // 多模态消息 - 仅用户消息可以有图片
          const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: 'text', text: msg.text },
          ];
          
          // 添加图片
          msg.imageUris.forEach(uri => {
            content.push({
              type: 'image_url',
              image_url: { url: uri },
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
      // 忽略其他类型的消息
    });

    return openAIMessages;
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
          if (trimmed === 'data: [DONE]') {
            cleanup();
            resolve();
            return;
          }
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta;
            if (!delta) continue;
            onStream({
              content: delta.content || '',
              reasoning_content: delta.reasoning_content || '',
              token: delta.content || '',
            });
          } catch (parseError) {
            console.warn('解析SSE数据失败:', parseError, '数据:', trimmed);
          }
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
          cleanup();
          resolve();
          return;
        }

        if (signal?.aborted || status === 0) {
          cleanup();
          resolve();
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

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('New-Api-User', String(mobileAuthService.user?.id ?? ''));
      xhr.setRequestHeader('Authorization', FIXED_BEARER_TOKEN);

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
        group: completionParams.group || 'default', // 添加group参数
        messages: openAIMessages,
        temperature: completionParams.temperature,
        max_tokens: completionParams.max_tokens,
        top_p: completionParams.top_p,
        frequency_penalty: completionParams.frequency_penalty,
        presence_penalty: completionParams.presence_penalty,
        stream: true,
        stream_options: { include_usage: true },
      };

      console.log('Remote chat request:', {
        url: `${this.baseURL}/v1/chat/completions`,
        params: openAIParams,
      });

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
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'New-Api-User': String(mobileAuthService.user?.id ?? ''),
          'Authorization': FIXED_BEARER_TOKEN,
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
        group: completionParams.group || 'default',
        messages: openAIMessages,
        temperature: completionParams.temperature,
        max_tokens: completionParams.max_tokens,
        top_p: completionParams.top_p,
        frequency_penalty: completionParams.frequency_penalty,
        presence_penalty: completionParams.presence_penalty,
        stream: false,
      };

      console.log('Remote chat request (non-stream):', {
        url: `${this.baseURL}/v1/chat/completions`,
        params: openAIParams,
      });

      // 直接使用fetch调用API
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'New-Api-User': String(mobileAuthService.user?.id ?? ''),
          'Authorization': FIXED_BEARER_TOKEN,
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
