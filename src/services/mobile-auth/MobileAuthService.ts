/**
 * 手机号认证服务
 * 使用 MobX 管理状态
 */

import {makeAutoObservable, runInAction} from 'mobx';
import {makePersistable} from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sendVerifyCode,
  mobileSignup,
  MobileUserData,
  SendCodeResponse,
  MobileSignupResponse,
} from './MobileAuthApi';

// 认证状态
export interface MobileAuthState {
  user: MobileUserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  codeSending: boolean;
  codeSent: boolean;
  countdown: number;
}

class MobileAuthService {
  user: MobileUserData | null = null;
  session: string | null = null; // 保存登录后的 session
  isLoading: boolean = false;
  isAuthenticated: boolean = false;
  error: string | null = null;
  codeSending: boolean = false;
  codeSent: boolean = false;
  countdown: number = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private persistStore: any = null; // 保存 persistStore 引用

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'MobileAuthService',
      properties: ['user', 'isAuthenticated', 'session'],
      storage: AsyncStorage,
    }).then(store => {
      this.persistStore = store;
      console.log('MobileAuthService: 持久化初始化完成');
      console.log('恢复的 session:', this.session);
      console.log('恢复的 user:', this.user);
      console.log('恢复的 isAuthenticated:', this.isAuthenticated);
    });

    console.log('MobileAuthService: 初始化完成');
  }

  /**
   * 发送验证码
   */
  async sendCode(phoneNumber: string): Promise<SendCodeResponse> {
    try {
      runInAction(() => {
        this.codeSending = true;
        this.error = null;
      });

      const response = await sendVerifyCode(phoneNumber);

      runInAction(() => {
        this.codeSending = false;
        if (response.success) {
          this.codeSent = true;
          this.startCountdown();
        } else {
          this.error = response.message;
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.codeSending = false;
        this.error =
          error instanceof Error ? error.message : '发送验证码失败';
      });
      return {
        success: false,
        message: this.error || '发送验证码失败',
      };
    }
  }

  /**
   * 开始倒计时
   */
  private startCountdown() {
    this.countdown = 60;

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    this.countdownTimer = setInterval(() => {
      runInAction(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          this.codeSent = false;
          if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }
      });
    }, 1000);
  }

  /**
   * 手机号登录/注册
   */
  async signInWithPhone(
    phoneNumber: string,
    code: string,
    affCode?: string,
  ): Promise<MobileSignupResponse> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const response = await mobileSignup(phoneNumber, code, affCode);

      runInAction(() => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.user = response.data;
          this.isAuthenticated = true;
          // 保存 session
          if (response.session) {
            this.session = response.session;
            console.log('✅ Session 已保存到内存:', response.session);
            console.log('当前 MobileAuthService 状态:', {
              session: this.session,
              user: this.user,
              isAuthenticated: this.isAuthenticated,
            });
            
            // makePersistable 会自动保存，但我们可以验证一下
            // 延迟一小段时间后验证持久化是否成功
            setTimeout(async () => {
              try {
                const stored = await AsyncStorage.getItem('MobileAuthService');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  console.log('验证持久化的数据:', {
                    session: parsed.session,
                    user: parsed.user,
                    isAuthenticated: parsed.isAuthenticated,
                  });
                  if (parsed.session !== this.session) {
                    console.error('❌ Session 持久化不一致！内存:', this.session, '存储:', parsed.session);
                  } else {
                    console.log('✅ Session 持久化验证成功');
                  }
                } else {
                  console.warn('⚠️ 未找到持久化数据');
                }
              } catch (err) {
                console.error('验证持久化数据失败:', err);
              }
            }, 200);
          } else {
            console.warn('⚠️ 未获取到 session');
          }
          console.log('登录成功:', response.data);
          
          // 登录成功后，尝试恢复设备信息
          // 使用动态导入避免循环依赖
          import('../device').then(({deviceService}) => {
            const userId = response.data?.id;
            if (userId) {
              const restored = deviceService.restoreDeviceByUserId(userId);
              if (restored) {
                console.log(`✅ 为 user_id ${userId} 恢复了设备信息`);
              } else {
                console.log(`ℹ️ user_id ${userId} 没有缓存的设备信息，需要绑定设备`);
              }
            }
          }).catch(err => {
            console.error('恢复设备信息失败:', err);
          });
        } else {
          this.error = response.message;
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = error instanceof Error ? error.message : '登录失败';
      });
      return {
        success: false,
        message: this.error || '登录失败',
      };
    }
  }

  /**
   * 退出登录
   */
  signOut() {
    runInAction(() => {
      this.user = null;
      this.session = null; // 清除 session
      this.isAuthenticated = false;
      this.error = null;
      this.codeSent = false;
      this.countdown = 0;
    });

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    console.log('已退出登录');
    
    // 清除设备服务中的用户信息，但保留 client_id
    // 这样下次登录时可以直接复用已有的 client_id
    // 使用动态导入避免循环依赖
    import('../device').then(({deviceService}) => {
      deviceService.clearUserInfo();
    }).catch(err => {
      console.error('清除设备用户信息失败:', err);
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

  /**
   * 获取认证状态
   */
  get authState(): MobileAuthState {
    return {
      user: this.user,
      isLoading: this.isLoading,
      isAuthenticated: this.isAuthenticated,
      error: this.error,
      codeSending: this.codeSending,
      codeSent: this.codeSent,
      countdown: this.countdown,
    };
  }
}

export const mobileAuthService = new MobileAuthService();

