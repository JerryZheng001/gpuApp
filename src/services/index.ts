// PalsHub Services
export {
  authService,
  palsHubService,
  syncService,
  PalsHubErrorHandler,
  RetryHandler,
  isAuthenticated,
  getCurrentUser,
} from './palshub';

// Mobile Auth Services (手机号验证码登录)
export {mobileAuthService} from './mobile-auth';
export type {
  MobileAuthState,
  MobileUserData,
  SendCodeResponse,
  MobileSignupResponse,
} from './mobile-auth';

// Device Services (设备绑定)
export {deviceService} from './device';
export type {DeviceInfo, BindDeviceResponse} from './device';

// Types
export type {AuthState, Profile} from './palshub/AuthService';
export type {ErrorInfo} from './palshub/ErrorHandler';
export type {SyncProgress} from './palshub/SyncService';
