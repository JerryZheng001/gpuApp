package com.gpuf.c

object RemoteWorker {
  init {
    System.loadLibrary("gpuf_c_sdk_v9")
  }

  /**
   * 设置或热切换 LLM 模型
   * @param modelPath GGUF 模型文件的完整路径
   * @return 0: 成功, -1: 失败
   */
  external fun setRemoteWorkerModel(modelPath: String): Int

  /**
   * 启动远程工作器并连接到 GPUFabric 服务器
   * @param serverAddr 服务器 IP 地址或主机名
   * @param controlPort 控制端口号
   * @param proxyPort 代理端口号
   * @param workerType 工作器类型 ("TCP" 或 "WS")
   * @param clientId 客户端唯一标识符（32位十六进制字符）
   * @return 0: 成功, -1: 失败
   */
  external fun startRemoteWorker(
    serverAddr: String,
    controlPort: Int,
    proxyPort: Int,
    workerType: String,
    clientId: String
  ): Int

  /**
   * 启动后台任务处理线程（支持回调通知）
   * @param callbackFunctionPtr 回调函数指针，0 表示不使用回调
   * @return 0: 成功, -1: 失败
   */
  external fun startRemoteWorkerTasks(callbackFunctionPtr: Long): Int

  /**
   * 获取远程工作器当前状态
   * @return 状态字符串，失败返回 null
   */
  external fun getRemoteWorkerStatus(): String?

  /**
   * 停止远程工作器并清理资源
   * @return 0: 成功, -1: 失败
   */
  external fun stopRemoteWorker(): Int
}


