declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    AUTH_API_BASE_URL?: string;
    [key: string]: string | undefined;
  }

  const Config: NativeConfig;
  export default Config;
}
