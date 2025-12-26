/**
 * 设备服务 - 管理 client_id 和设备绑定
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { makePersistable } from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

const API_BASE_URL = "http://agent.gpunexus.com";

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

// user_id 到 client_id 的映射类型
interface UserClientMapping {
    [userId: string]: {
        clientId: string;
        deviceName: string;
        osType: string;
        createdAt: string;
    };
}

class DeviceService {
    clientId: string | null = null;
    deviceName: string | null = null;
    userId: string | null = null;
    osType: string | null = null; // 操作系统类型
    createdAt: string | null = null; // 绑定时间
    isBinding: boolean = false;
    error: string | null = null;
    
    // user_id 到 client_id 的映射表
    private userClientMap: UserClientMapping = {};

    constructor() {
        makeAutoObservable(this);
        makePersistable(this, {
            name: 'DeviceService',
            properties: ['clientId', 'deviceName', 'userId', 'osType', 'createdAt', 'userClientMap' as keyof this],
            storage: AsyncStorage,
        }).then(() => {
            console.log('DeviceService: 持久化初始化完成，数据将自动保存到本地');
            console.log('DeviceService: 恢复的 userClientMap:', this.userClientMap);
        });

        console.log('DeviceService: 初始化完成');
    }

    /**
     * 检查是否已绑定设备（基于当前 userId）
     */
    get isDeviceBound(): boolean {
        if (!this.userId) {
            return false;
        }
        // 检查当前 user_id 是否有对应的 client_id
        return !!this.getClientIdByUserId(this.userId);
    }
    
    /**
     * 根据当前 user_id 恢复设备信息
     * 登录后调用此方法，从映射表中恢复对应的 client_id
     * @param userId 用户 ID
     */
    restoreDeviceByUserId(userId: string | number): boolean {
        const userIdStr = String(userId);
        const mapping = this.userClientMap[userIdStr];
        
        if (mapping && mapping.clientId) {
            console.log(`DeviceService: 为 user_id ${userIdStr} 恢复设备信息:`, mapping);
            runInAction(() => {
                this.clientId = mapping.clientId;
                this.deviceName = mapping.deviceName;
                this.userId = userIdStr;
                this.osType = mapping.osType;
                this.createdAt = mapping.createdAt;
            });
            return true;
        }
        
        console.log(`DeviceService: user_id ${userIdStr} 没有缓存的设备信息`);
        return false;
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
     * 根据 user_id 获取对应的 client_id
     * @param userId 用户 ID
     * @returns client_id 如果存在，否则返回 null
     */
    getClientIdByUserId(userId: string | number): string | null {
        const userIdStr = String(userId);
        const mapping = this.userClientMap[userIdStr];
        if (mapping && mapping.clientId) {
            console.log(`DeviceService: 找到 user_id ${userIdStr} 对应的 client_id:`, mapping.clientId);
            return mapping.clientId;
        }
        console.log(`DeviceService: user_id ${userIdStr} 没有对应的 client_id`);
        return null;
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

            const userIdStr = String(userId);
            
            // 先检查该 user_id 是否已有对应的 client_id
            let clientIdToUse: string | null = this.getClientIdByUserId(userIdStr);
            
            if (clientIdToUse) {
                // 如果已有 client_id，复用并更新设备名称
                console.log('DeviceService: 检测到 user_id 已有对应的 client_id，复用:', clientIdToUse);
                const existingMapping = this.userClientMap[userIdStr];
                
                // 更新当前状态
                runInAction(() => {
                    this.clientId = clientIdToUse;
                    this.deviceName = name;
                    this.userId = userIdStr;
                    this.osType = existingMapping?.osType || 'linux';
                    this.createdAt = existingMapping?.createdAt || new Date().toISOString();
                });
                
                // 更新映射表中的设备名称
                if (this.userClientMap[userIdStr]) {
                    this.userClientMap[userIdStr].deviceName = name;
                }
            } else {
                // 如果没有，生成新的 client_id
                clientIdToUse = this.generateClientId();
                console.log('DeviceService: 为 user_id 生成新的 client_id:', clientIdToUse);
            }
            
            //   const osType = this.getOsType();
            const osType = 'linux'

            const requestBody = {
                user_id: userIdStr,
                client_id: clientIdToUse,
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
                    const createdAt = this.createdAt || new Date().toISOString();
                    
                    // 保存到映射表
                    runInAction(() => {
                        this.userClientMap[userIdStr] = {
                            clientId: clientIdToUse!,
                            deviceName: name,
                            osType: osType,
                            createdAt: createdAt,
                        };
                        
                        this.clientId = clientIdToUse;
                        this.deviceName = name;
                        this.userId = userIdStr;
                        this.osType = osType;
                        this.createdAt = createdAt;
                        this.isBinding = false;
                    });

                    // makePersistable 会自动保存数据到 AsyncStorage
                    console.log('✅ 设备绑定成功，数据已更新（将自动保存到本地）:', {
                        clientId: clientIdToUse,
                        deviceName: name,
                        userId: userIdStr,
                        osType: osType,
                        createdAt: createdAt,
                        userClientMap: this.userClientMap,
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
                const createdAt = this.createdAt || new Date().toISOString();
                
                // 保存到映射表
                runInAction(() => {
                    this.userClientMap[userIdStr] = {
                        clientId: clientIdToUse!,
                        deviceName: name,
                        osType: osType,
                        createdAt: createdAt,
                    };
                    
                    this.clientId = clientIdToUse;
                    this.deviceName = name;
                    this.userId = userIdStr;
                    this.osType = osType;
                    this.createdAt = createdAt;
                    this.isBinding = false;
                });

                // makePersistable 会自动保存数据到 AsyncStorage
                // 添加日志确认数据已更新（数据会在下一个 tick 自动保存）
                console.log('✅ 设备绑定成功，数据已更新（将自动保存到本地）:', {
                    clientId: clientIdToUse,
                    deviceName: name,
                    userId: userIdStr,
                    osType: osType,
                    createdAt: createdAt,
                    userClientMap: this.userClientMap,
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
     * 清除设备绑定（完全清除，包括 client_id）
     */
    clearDevice() {
        runInAction(() => {
            this.clientId = null;
            this.deviceName = null;
            this.userId = null;
            this.osType = null;
            this.createdAt = null;
            this.error = null;
        });
    }

    /**
     * 清除用户信息（退出登录时调用）
     * 只清除当前 userId，但保留 userClientMap 中的所有映射关系
     */
    clearUserInfo() {
        runInAction(() => {
            this.userId = null;
            this.clientId = null;
            this.deviceName = null;
            this.osType = null;
            this.createdAt = null;
            this.error = null;
            // 保留 userClientMap，这样下次登录时可以根据 user_id 恢复
            console.log('DeviceService: 清除当前用户信息，保留 userClientMap:', this.userClientMap);
        });
    }

    /**
     * 清空本地存储的设备数据（包括 AsyncStorage）
     */
    async clearStoredDeviceData() {
        try {
            // 清除内存中的数据
            this.clearDevice();
            
            // 清除 AsyncStorage 中的持久化数据
            await AsyncStorage.removeItem('DeviceService');
            
            console.log('✅ 已清空本地存储的 deviceService 数据');
        } catch (error) {
            console.error('❌ 清空设备数据失败:', error);
            throw error;
        }
    }

    /**
     * 清除错误
     */
    clearError() {
        runInAction(() => {
            this.error = null;
        });
    }

    /**
     * 获取设备列表
     * @param userId 用户ID（可选，如果不提供则使用存储的userId）
     * @param clientId 设备ID（可选，用于过滤特定设备）
     */
    async getClientList(
        userId?: string,
        clientId?: string,
    ): Promise<ClientListResponse> {
        try {
            const targetUserId = userId || this.userId;

            if (!targetUserId) {
                throw new Error('用户ID未设置');
            }

            // 构建查询参数
            const params = new URLSearchParams({
                user_id: targetUserId,
            });

            const url = `${API_BASE_URL}/api/user/client_list?${params.toString()}`;
            
            console.log('获取设备列表请求:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const responseText = await response.text();
            console.log('设备列表响应状态:', response.status);
            console.log('设备列表响应内容:', responseText);

            let data: any = null;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON 解析失败:', parseError);
                throw new Error(`服务器响应格式错误: ${responseText}`);
            }

            if (response.ok && data.success) {
                return {
                    success: true,
                    message: data.message,
                    timestamp: data.timestamp,
                    data: data.data,
                };
            } else {
                const errorMessage = data?.message || `服务器错误 (${response.status})`;
                return {
                    success: false,
                    message: errorMessage,
                };
            }
        } catch (error) {
            console.error('获取设备列表失败:', error);
            const errorMessage =
                error instanceof Error ? error.message : '网络请求失败';
            return {
                success: false,
                message: errorMessage,
            };
        }
    }

    /**
     * 获取设备监控数据
     * @param userId 用户ID
     * @param clientId 设备ID（可选）
     */
    async getClientMonitor(
        userId?: string,
        clientId?: string,
    ): Promise<ClientMonitorResponse> {
        try {
            const targetUserId = userId || this.userId;

            if (!targetUserId) {
                throw new Error('用户ID未设置');
            }

            const params = new URLSearchParams({
                user_id: targetUserId,
            });

            if (clientId) {
                params.append('client_id', clientId);
            }

            const url = `${API_BASE_URL}/api/user/client_monitor?${params.toString()}`;
            
            console.log('获取设备监控数据请求:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const responseText = await response.text();
            console.log('设备监控数据响应状态:', response.status);
            console.log('设备监控数据响应内容:', responseText);

            let data: any = null;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON 解析失败:', parseError);
                throw new Error(`服务器响应格式错误: ${responseText}`);
            }

            if (response.ok && data.success) {
                return {
                    success: true,
                    message: data.message,
                    timestamp: data.timestamp,
                    data: data.data,
                };
            } else {
                const errorMessage = data?.message || `服务器错误 (${response.status})`;
                return {
                    success: false,
                    message: errorMessage,
                };
            }
        } catch (error) {
            console.error('获取设备监控数据失败:', error);
            const errorMessage =
                error instanceof Error ? error.message : '网络请求失败';
            return {
                success: false,
                message: errorMessage,
            };
        }
    }
}

// 导出接口
export interface ClientListResponse {
    success: boolean;
    message?: string;
    timestamp?: string;
    data?: {
        total: number;
        devices: Array<{
            client_id: string;
            client_name: string;
            os_type: string;
            client_status: string;
            health: number;
            tflops: number;
            cpu_usage: number;
            memory_usage: number;
            storage_usage: number;
            uptime_days: number;
            last_online: string;
            created_at: string;
        }>;
    };
}

export interface ClientMonitorData {
    client_id: string;
    client_name: string;
    created_at: string;
    updated_at: string;
    date: string;
    avg_cpu_usage: number;
    avg_memory_usage: number;
    avg_disk_usage: number;
    total_network_in_bytes: number;
    total_network_out_bytes: number;
    total_heartbeats: number;
    last_heartbeat: string;
    avg_network_in_bytes: number;
    avg_network_out_bytes: number;
}

export interface ClientMonitorResponse {
    success: boolean;
    message?: string;
    timestamp?: string;
    data?: ClientMonitorData[];
}

export const deviceService = new DeviceService();

