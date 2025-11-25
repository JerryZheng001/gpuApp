import {NativeModules} from 'react-native';

export interface GpufModuleInterface {
  init(): Promise<number>;
  getVersion(): Promise<string>;
  llmInit(modelPath: string, ctxSize: number, gpuLayers: number): Promise<number>;
  llmGenerate(prompt: string, maxTokens: number): Promise<string>;
  getLastError(): Promise<string>;
}

const {GpufModule} = NativeModules;

export default GpufModule as GpufModuleInterface;