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
  isLoading: boolean = false;
  isAuthenticated: boolean = false;
  error: string | null = null;
  codeSending: boolean = false;
  codeSent: boolean = false;
  countdown: number = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'MobileAuthService',
      properties: ['user', 'isAuthenticated'],
      storage: AsyncStorage,
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
          console.log('登录成功:', response.data);
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

