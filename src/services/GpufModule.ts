import {NativeModules, NativeEventEmitter} from 'react-native';

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
  registerEmitter(): Promise<number>;
  startRemoteWorkerTasks(): Promise<number>;
  getRemoteWorkerStatus(): Promise<string>;
  stopRemoteWorker(): Promise<number>;
}

const {GpufModule} = NativeModules;

// 创建事件发射器用于监听 RemoteWorkerEvent
export const gpufEventEmitter = new NativeEventEmitter(GpufModule);

export default GpufModule as GpufModuleInterface;