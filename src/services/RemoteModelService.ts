/**
 * RemoteModelService - 远程模型服务
 * 基于gpunexus-web的API接口实现远程模型功能
 */

import OpenAI from 'openai';
import Config from 'react-native-config';
import { Model, ModelOrigin } from '../utils/types';
import {chatTemplates} from '../utils/chat';
import {defaultCompletionParams} from '../utils/completionSettingsVersions';

// 固定的Bearer Token（根据要求写死）
const FIXED_BEARER_TOKEN = 'Bearer a5f6036890304096aef42f0aa3563cf20db920f8bfa12f93';

// 远程模型接口定义（基于gpunexus-web的/api/v1/pricing端点）
interface RemoteModelData {
  model_parameters: string;
  logo_url: string;
  context_length: string;
  input_modalities: string[];
  output_modalities: string[];
  completion_ratio: number;
  enable_groups: string[];
  model_ratio: number;
  model_price: number;
  description: string;
  model_name: string;
  provider: string[];
  quota_type: number;
  series: string[];
  supported_parameters: string[];
  supported_endpoint_types: string[];
  owner_by?: string;
}

interface RemoteModelsResponse {
  data: RemoteModelData[];
  group_ratio: {
    default: number;
    vip: number;
    [key: string]: number;
  };
  error?: string;
  message?: string;
  success: boolean;
  usable_group: {
    default: number;
    vip: number;
    [key: string]: number;
  };
}

class RemoteModelService {
  private openai: OpenAI;
  private baseURL: string;
  
  constructor() {
    this.baseURL = Config.REMOTE_API_BASE_URL || 'https://api.gpunexus.com';
    
    // 初始化OpenAI客户端
    this.openai = new OpenAI({
      apiKey: FIXED_BEARER_TOKEN.replace('Bearer ', ''),
      baseURL: `${this.baseURL}/v1`,
      dangerouslyAllowBrowser: true, // React Native环境需要
    });
  }

  /**
   * 获取远程模型列表
   */
  async getRemoteModels(): Promise<Model[]> {
    try {
      // demo/gpunexus-web 中通过后端 `${WURIGEN_APP_URL}/api/v1/pricing` 获取列表
      // 这里兼容两种部署：优先 /api/v1/pricing，若 404 再回退 /v1/pricing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const tryFetch = async (url: string) => {
        return fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': FIXED_BEARER_TOKEN,
          },
          signal: controller.signal,
        });
      };

      let response = await tryFetch(`${this.baseURL}/api/v1/pricing`);
      if (response.status === 404) {
        response = await tryFetch(`${this.baseURL}/v1/pricing`);
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RemoteModelsResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || result.message || '获取远程模型失败');
      }

      // 转换为应用内的Model格式
      return result.data.map((remoteModel: RemoteModelData, index: number) => ({
        id: `remote_${remoteModel.model_name}`, // 使用模型名称作为稳定的ID
        author: remoteModel.provider?.[0] || 'GPUNexus',
        name: remoteModel.model_name,
        type: remoteModel.model_parameters || 'llm',
        capabilities: [], // 可根据需要映射
        size: 0, // 远程模型不需要大小
        params: parseFloat(remoteModel.model_parameters) || 0,
        isDownloaded: true, // 远程模型无需下载
        downloadUrl: '',
        hfUrl: '',
        progress: 100,
        downloadSpeed: undefined,
        filename: '',
        fullPath: '',
        isLocal: false,
        origin: ModelOrigin.REMOTE, // 新增的远程模型类型
        modelType: undefined,
        supportsMultimodal: remoteModel.input_modalities.includes('image'),
        compatibleProjectionModels: [],
        defaultProjectionModel: undefined,
        visionEnabled: remoteModel.input_modalities.includes('image'),
        supportsThinking: false,
        // Model接口必需的属性
        defaultChatTemplate: {...chatTemplates.default},
        chatTemplate: chatTemplates.default,
        defaultStopWords: [],
        stopWords: [],
        description: remoteModel.description || '',
        defaultCompletionSettings: {...defaultCompletionParams},
        completionSettings: {...defaultCompletionParams},
        // 远程模型特有字段
        isRemote: true,
        remoteEndpoint: `${this.baseURL}/v1`,
        modelRatio: remoteModel.model_ratio,
        completionRatio: remoteModel.completion_ratio,
        quotaType: remoteModel.quota_type,
        enableGroups: remoteModel.enable_groups || ['default'], // 添加可用分组信息
        // API相关字段
        apiModel: remoteModel.model_name, // API使用的模型名称
        defaultGroup: remoteModel.enable_groups?.[0] || 'default', // 默认分组
        modelPrice: remoteModel.model_price,
        contextLength: remoteModel.context_length,
        inputModalities: remoteModel.input_modalities,
        outputModalities: remoteModel.output_modalities,
        series: remoteModel.series,
        provider: remoteModel.provider,
        logoUrl: remoteModel.logo_url,
      } as Model & {
        isRemote: boolean;
        remoteEndpoint: string;
        modelRatio: number;
        completionRatio: number;
        quotaType: number;
        modelPrice: number;
        contextLength: string;
        inputModalities: string[];
        outputModalities: string[];
        series: string[];
        provider: string[];
        logoUrl: string;
        enableGroups: string[];
        apiModel: string;
        defaultGroup: string;
      }));
    } catch (error) {
      console.error('获取远程模型失败:', error);
      throw this.handleError(error);
    }
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
}

export const remoteModelService = new RemoteModelService();
