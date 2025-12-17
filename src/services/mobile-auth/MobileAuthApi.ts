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
    console.log('发送验证码请求:', phoneNumber);
    const response = await fetch(`${API_BASE_URL}/api/sms/sendverifyCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: phoneNumber,
      }),
    });

    const data = await response.json();
    console.log('发送验证码响应:', data);
    return data;
  } catch (error) {
    console.error('发送验证码失败:', error);
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

