/**
 * 手机号登录注册 API 服务
 * 后端地址: https://test.chengfangtech.com
 */

const API_BASE_URL = 'https://test.chengfangtech.com';

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

    const data = await response.json();
    console.log('手机号登录/注册响应:', data);
    return data;
  } catch (error) {
    console.error('手机号登录/注册失败:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : '网络请求失败，请检查网络连接',
    };
  }
}

