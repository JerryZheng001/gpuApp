import {NativeModules} from 'react-native';

export interface GpufModuleInterface {
  init(): Promise<number>;
  getVersion(): Promise<string>;
  llmInit(modelPath: string, ctxSize: number, gpuLayers: number): Promise<number>;
  llmGenerate(prompt: string, maxTokens: number): Promise<string>;
  getLastError(): Promise<string>;
  setRemoteWorkerModel(modelPath: string): Promise<number>;
  startRemoteWorker(
    serverAddr: string,
    controlPort: number,
    proxyPort: number,
    workerType: string,
    clientId: string,
  ): Promise<number>;
  startRemoteWorkerTasks(): Promise<number>;
  getRemoteWorkerStatus(): Promise<string>;
  stopRemoteWorker(): Promise<number>;
}

const {GpufModule} = NativeModules;

export default GpufModule as GpufModuleInterface;