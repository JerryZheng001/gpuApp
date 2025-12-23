/**
 * RemoteWorkerService - 全局管理 RemoteWorker 事件监听
 * 
 * 这个服务确保 emitter 只注册一次，事件监听器也只添加一次，
 * 避免多个组件重复注册导致事件重复触发的问题。
 */

import { NativeEventEmitter } from 'react-native';
import GpufModule, { gpufEventEmitter } from './GpufModule';

class RemoteWorkerService {
  private static instance: RemoteWorkerService | null = null;
  private isEmitterRegistered: boolean = false;
  private eventSubscription: any = null;
  private listeners: Array<(message: string) => void> = [];

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取单例实例
   */
  static getInstance(): RemoteWorkerService {
    if (!RemoteWorkerService.instance) {
      RemoteWorkerService.instance = new RemoteWorkerService();
    }
    return RemoteWorkerService.instance;
  }

  /**
   * 注册 emitter（只注册一次）
   */
  async registerEmitter(): Promise<void> {
    if (this.isEmitterRegistered) {
      console.log('RemoteWorkerService: emitter 已注册，跳过');
      return;
    }

    try {
      await GpufModule.registerEmitter();
      this.isEmitterRegistered = true;
      console.log('RemoteWorkerService: ✅ emitter 已注册');
    } catch (error) {
      console.error('RemoteWorkerService: ❌ 注册 emitter 失败', error);
      throw error;
    }
  }

  /**
   * 添加事件监听器
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  addListener(callback: (message: string) => void): () => void {
    // 如果还没有添加全局监听器，先添加
    if (!this.eventSubscription) {
      this.eventSubscription = gpufEventEmitter.addListener(
        'RemoteWorkerEvent',
        (event: { message: string }) => {
          const message = event.message || '';
          console.log('[RemoteWorkerEvent]', message);

          // 通知所有注册的回调
          this.listeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              console.error('RemoteWorkerService: 回调执行失败', error);
            }
          });
        },
      );
      console.log('RemoteWorkerService: ✅ 已添加全局事件监听器');
    }

    // 添加回调到列表
    this.listeners.push(callback);

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
        console.log('RemoteWorkerService: 已移除回调监听器');
      }

      // 如果没有监听器了，移除全局监听
      if (this.listeners.length === 0 && this.eventSubscription) {
        this.eventSubscription.remove();
        this.eventSubscription = null;
        console.log('RemoteWorkerService: 已移除全局事件监听器');
      }
    };
  }

  /**
   * 清理所有监听器
   */
  cleanup(): void {
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
    this.listeners = [];
    console.log('RemoteWorkerService: 已清理所有监听器');
  }
}

export const remoteWorkerService = RemoteWorkerService.getInstance();

