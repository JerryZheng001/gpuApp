/**
 * 设备服务 - 管理 client_id 和设备绑定
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://8.140.251.142:18081';

// 设备信息
export interface DeviceInfo {
    clientId: string;
    name: string;
    userId: string;
    osType: string;
    createdAt: string;
}

// 绑定设备响应
export interface BindDeviceResponse {
    success: boolean;
    message?: string;
}

class DeviceService {
    clientId: string | null = null;
    deviceName: string | null = null;
    userId: string | null = null;
    isBinding: boolean = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'DeviceService',
            properties: ['clientId', 'deviceName', 'userId'],
            storage: AsyncStorage,
        });

        console.log('DeviceService: 初始化完成');
    }

    /**
     * 检查是否已绑定设备
     */
    get isDeviceBound(): boolean {
        return !!this.clientId;
    }

    /**
     * 生成新的 client_id
     */
    generateClientId(): string {
        // 生成 UUID 并移除连字符
        return uuidv4().replace(/-/g, '');
    }

    /**
     * 获取操作系统类型
     */
    getOsType(): string {
        return Platform.OS === 'ios' ? 'ios' : 'android';
    }

    /**
     * 绑定设备
     * @param userId 用户 ID（从登录接口获取）
     * @param name 设备名称（用户输入）
     */
    async bindDevice(
        userId: number | string,
        name: string,
    ): Promise<BindDeviceResponse> {
        try {
            runInAction(() => {
                this.isBinding = true;
                this.error = null;
            });

            // 生成 client_id
            const newClientId = this.generateClientId();
            //   const osType = this.getOsType();
            const osType = 'linux'
            const userIdStr = String(userId);

            const requestBody = {
                user_id: userIdStr,
                client_id: newClientId,
                os_type: osType,
                name: name,
                client_status: 'active', // 设备状态：active 表示激活
            };

            console.log('绑定设备请求:', requestBody);

            const response = await fetch(`${API_BASE_URL}/api/user/insert_client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            // 先获取原始文本响应
            const responseText = await response.text();
            console.log('绑定设备响应状态:', response.status);
            console.log('绑定设备响应内容:', responseText);

            // 尝试解析 JSON
            let data: any = null;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON 解析失败，原始响应:', responseText);
                // 如果响应不是 JSON，但状态码是 200，认为成功
                if (response.ok) {
                    runInAction(() => {
                        this.clientId = newClientId;
                        this.deviceName = name;
                        this.userId = userIdStr;
                        this.isBinding = false;
                    });
                    return { success: true };
                }
                // 否则返回原始文本作为错误信息
                runInAction(() => {
                    this.error = responseText || `服务器错误 (${response.status})`;
                    this.isBinding = false;
                });
                return {
                    success: false,
                    message: responseText || `服务器错误 (${response.status})`,
                };
            }

            console.log('绑定设备解析响应:', data);

            if (response.ok) {
                runInAction(() => {
                    this.clientId = newClientId;
                    this.deviceName = name;
                    this.userId = userIdStr;
                    this.isBinding = false;
                });

                return { success: true };
            } else {
                runInAction(() => {
                    this.error = data?.message || '绑定设备失败';
                    this.isBinding = false;
                });

                return {
                    success: false,
                    message: data?.message || '绑定设备失败',
                };
            }
        } catch (error) {
            console.error('绑定设备失败:', error);
            const errorMessage =
                error instanceof Error ? error.message : '网络请求失败';

            runInAction(() => {
                this.error = errorMessage;
                this.isBinding = false;
            });

            return {
                success: false,
                message: errorMessage,
            };
        }
    }

    /**
     * 清除设备绑定
     */
    clearDevice() {
        runInAction(() => {
            this.clientId = null;
            this.deviceName = null;
            this.userId = null;
            this.error = null;
        });
    }

    /**
     * 清除错误
     */
    clearError() {
        runInAction(() => {
            this.error = null;
        });
    }
}

export const deviceService = new DeviceService();

