declare module 'react-native-bootsplash' {
  type HideOptions = {
    fade?: boolean;
  };

  const BootSplash: {
    hide(options?: HideOptions): Promise<void>;
    isVisible(): Promise<boolean>;
  };

  export default BootSplash;
}
