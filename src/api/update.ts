/**
 * 版本更新 API 服务
 */

const API_BASE_URL = 'http://agent.gpunexus.com';

// APK 版本信息接口
export interface ApkVersionInfo {
  id: number;
  package_name: string;
  version_name: string;
  version_code: number;
  download_url: string;
  channel: string;
  min_os_version: string | null;
  sha256: string;
  file_size_bytes: number;
  is_active: boolean;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApkListResponse {
  success: boolean;
  data: ApkVersionInfo[];
  message: string;
  timestamp: string;
}

/**
 * 获取 APK 版本列表
 */
export async function getApkVersionList(): Promise<ApkListResponse> {
  try {
    // 使用用户提供的 URL 格式
    const url = `${API_BASE_URL}/api/apk/list?true&limit=20`;
    
    console.log('=== 获取 APK 版本列表 ===');
    console.log('URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('=== APK 版本列表响应 ===');
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Response Data:', data);
    
    return data;
  } catch (error) {
    console.error('=== 获取 APK 版本列表失败 ===');
    console.error('Error:', error);
    throw error;
  }
}

