/**
 * 手机号登录注册 API 服务
 * 后端地址: https://test.chengfangtech.com
 */

const API_BASE_URL = 'https://test.chengfangtech.com';

// 配额记录响应
export interface QuotaRecord {
  created_at: string; // ISO 8601 格式的日期时间字符串，如 "2025-12-25T15:03:44.227804+08:00"
  client_name: string; // 设备名称
  completion_tokens: number; // 输出用量（完成令牌数）
  prompt_tokens: number; // 输入用量（提示令牌数）
  // 兼容旧字段（可选）
  date?: string;
  device_name?: string;
  share_duration?: string;
  input_usage?: string;
  output_usage?: string;
}

export interface QuotaRecordsResponse {
  code?: number;
  success?: boolean;
  message?: string;
  data?: {
    results: QuotaRecord[] | null; // API 返回的是 results，可能为 null
    total: number;
    page: number;
    page_size: number;
  };
}

// 发送验证码响应
export interface SendCodeResponse {
  success: boolean;
  message: string;
}

// 用户信息
export interface MobileUserData {
  id: number;
  username: string;
  display_name: string;
  role: number;
  status: number;
  group: string;
  email: string;
  phone_number: string;
  phone_number_verified: boolean;
}

// 登录/注册响应
export interface MobileSignupResponse {
  success: boolean;
  message: string;
  data?: MobileUserData;
  session?: string; // 从响应头中提取的 session
}

/**
 * 发送短信验证码
 * @param phoneNumber 手机号
 */
export async function sendVerifyCode(
  phoneNumber: string,
): Promise<SendCodeResponse> {
  try {
    const url = `${API_BASE_URL}/api/sms/sendverifyCode`;
    const requestBody = {
      phone_num: phoneNumber,
    };
    
    // 详细的请求日志（可在 Chrome DevTools Network 标签中查看）
    console.log('=== 发送验证码请求 ===');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 响应日志
    console.log('=== 发送验证码响应 ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response Data:', data);
    return data;
  } catch (error) {
    console.error('=== 发送验证码失败 ===');
    console.error('Error:', error);
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      message:
        error instanceof Error ? error.message : '网络请求失败，请检查网络连接',
    };
  }
}

/**
 * 手机号登录/注册
 * @param phoneNumber 手机号
 * @param code 验证码
 * @param affCode 邀请码（可选）
 */
export async function mobileSignup(
  phoneNumber: string,
  code: string,
  affCode?: string,
): Promise<MobileSignupResponse> {
  try {
    console.log('手机号登录/注册请求:', phoneNumber);
    const body: {phone_number: string; code: string; aff_code?: string} = {
      phone_number: phoneNumber,
      code: code,
    };

    if (affCode) {
      body.aff_code = affCode;
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 从响应头中获取 session
    console.log('=== 登录接口响应头信息 ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    // 获取所有响应头
    const headers: {[key: string]: string} = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('所有响应头:', headers);
    
    // 尝试从常见的 header 中获取 session
    const setCookie = response.headers.get('set-cookie');
    const sessionId = response.headers.get('session-id') || response.headers.get('x-session-id') || response.headers.get('session');
    const authorization = response.headers.get('authorization');
    
    console.log('=== Session 相关信息 ===');
    if (setCookie) {
      console.log('Set-Cookie:', setCookie);
      // 尝试从 Set-Cookie 中提取 session
      const sessionMatch = setCookie.match(/session[^=]*=([^;]+)/i);
      if (sessionMatch) {
        console.log('从 Set-Cookie 中提取的 session:', sessionMatch[1]);
      }
    }
    if (sessionId) {
      console.log('Session-ID:', sessionId);
    }
    if (authorization) {
      console.log('Authorization:', authorization);
    }
    
    // 如果没有找到明确的 session，打印所有可能相关的 header
    if (!setCookie && !sessionId && !authorization) {
      console.log('⚠️ 未找到明确的 session 信息，请检查响应头中的其他字段');
      // 打印所有包含 'session'、'cookie'、'auth' 的 header
      Object.keys(headers).forEach(key => {
        if (key.toLowerCase().includes('session') || 
            key.toLowerCase().includes('cookie') || 
            key.toLowerCase().includes('auth')) {
          console.log(`可能的 session 相关 header [${key}]:`, headers[key]);
        }
      });
    }

    // 提取 session（优先使用 Set-Cookie 中的 session，其次是其他 header）
    let extractedSession: string | undefined;
    if (setCookie) {
      const sessionMatch = setCookie.match(/session[^=]*=([^;]+)/i);
      if (sessionMatch) {
        extractedSession = sessionMatch[1];
      }
    } else if (sessionId) {
      extractedSession = sessionId;
    } else if (authorization) {
      extractedSession = authorization;
    }

    const data = await response.json();
    console.log('手机号登录/注册响应数据:', data);
    
    // 将 session 添加到响应中
    return {
      ...data,
      session: extractedSession,
    };
  } catch (error) {
    console.error('手机号登录/注册失败:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : '网络请求失败，请检查网络连接',
    };
  }
}

/**
 * 获取配额记录
 * @param session 登录接口获取的 session
 * @param userId 登录接口返回的 user id
 * @param page 页码
 * @param pageSize 每页数量
 * @param clientID 设备ID（可选）
 */
export async function getQuotaRecords(
  session: string,
  userId: number | string,
  page: number = 1,
  pageSize: number = 10,
  clientID?: string,
): Promise<QuotaRecordsResponse> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    
    // 如果提供了 clientID，添加到查询参数中
    if (clientID) {
      params.append('clientID', clientID);
    }
    
    const url = `${API_BASE_URL}/api/user/supply/device/quota_records?${params.toString()}`;
    
    console.log('=== 获取配额记录请求 ===');
    console.log('URL:', url);
    console.log('Method: GET');
    console.log('Session:', session);
    console.log('User ID:', userId);
    console.log('Client ID:', clientID || '未提供');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=' + session,
        'New-Api-User': String(userId),
      },
    });

    console.log('=== 获取配额记录响应 ===');
    console.log('Status:', response.status);
    
    // 检查是否是 401 未授权错误
    if (response.status === 401) {
      console.log('❌ 检测到 401 未授权错误，执行退出登录流程...');
      
      // 停止模型分享
      try {
        // 动态导入 GpufModule 和 modelStore 避免循环依赖
        const GpufModule = (await import('../../services/GpufModule')).default;
        const {modelStore} = await import('../../store');
        console.log('正在停止模型分享...');
        const stopResult = await Promise.race([
          GpufModule.stopRemoteWorker(),
          new Promise<number>((_, reject) => {
            setTimeout(() => reject(new Error('停止分享超时')), 5000);
          }),
        ]);
        console.log('停止分享结果:', stopResult);
        // 清除分享状态
        modelStore.clearSharedModel();
        console.log('已清除分享状态');
      } catch (error) {
        console.error('停止模型分享失败:', error);
        // 即使停止失败，也尝试清除分享状态
        try {
          const {modelStore} = await import('../../store');
          modelStore.clearSharedModel();
        } catch (clearError) {
          console.error('清除分享状态失败:', clearError);
        }
      }
      
      // 退出登录
      try {
        // 动态导入 mobileAuthService 避免循环依赖
        const {mobileAuthService} = await import('./MobileAuthService');
        console.log('正在退出登录...');
        mobileAuthService.signOut();
        console.log('已退出登录');
      } catch (error) {
        console.error('退出登录失败:', error);
      }
      
      // 返回错误响应
      return {
        code: 401,
        success: false,
        message: '登录已过期，请重新登录',
      };
    }
    
    const data = await response.json();
    console.log('Response Data:', data);
    
    // 将 API 响应格式转换为统一的格式
    // API 返回格式: {code: 200, message: 'success', data: {results: null/[], ...}}
    return {
      code: data.code,
      success: data.code === 200,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    console.error('=== 获取配额记录失败 ===');
    console.error('Error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : '网络请求失败，请检查网络连接',
    };
  }
}

