import React, { useCallback, useState, useEffect } from 'react';
import {
  Alert,
  Linking,
  View,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  Card,
  ProgressBar,
  Button,
  IconButton,
  Text,
  TouchableRipple,
  ActivityIndicator,
  Snackbar,
  Switch,
  HelperText,
} from 'react-native-paper';

import { ProjectionModelSelector } from '../../../components';

import { useTheme, useMemoryCheck, useStorageCheck } from '../../../hooks';

import { createStyles } from './styles';

import { uiStore, modelStore } from '../../../store';

import {
  Model,
  ModelOrigin,
  ModelType,
  RootDrawerParamList,
} from '../../../utils/types';
import {
  getModelSizeString,
  L10nContext,
  checkModelFileIntegrity,
  getModelSkills,
  formatNumber,
} from '../../../utils';
import GpufModule from '../../../services/GpufModule';
import { mobileAuthService, deviceService, remoteWorkerService } from '../../../services';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {
  LinkExternalIcon,
  TrashIcon,
  SettingsIcon,
  CpuChipIcon,
  EyeIcon,
  ChatIcon,
  XIcon,
  ChevronSelectorVerticalIcon,
  ChevronSelectorExpandedVerticalIcon,
  ShareIcon,
} from '../../../assets/icons';

type ChatScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList>;

interface ModelCardProps {
  model: Model;
  activeModelId?: string;
  onFocus?: () => void;
  onOpenSettings?: () => void;
  onNeedBindDevice?: () => void;
}

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ModelCard: React.FC<ModelCardProps> = observer(
  ({ model, activeModelId, onOpenSettings, onNeedBindDevice }) => {
    const l10n = React.useContext(L10nContext);
    const theme = useTheme();
    const styles = createStyles(theme);

    const navigation = useNavigation<ChatScreenNavigationProp>();

    const [snackbarVisible, setSnackbarVisible] = useState(false); // Snackbar visibility
    const [snackbarMessage, setSnackbarMessage] = useState<string>(''); // Snackbar message
    const [integrityError, setIntegrityError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const { memoryWarning, shortMemoryWarning, multimodalWarning } =
      useMemoryCheck(model.size, model.supportsMultimodal);
    const { isOk: storageOk, message: storageNOkMessage } = useStorageCheck(
      model,
      {
        enablePeriodicCheck: true,
        checkInterval: 10000,
      },
    );

    const isActiveModel = activeModelId === model.id;
    const isDownloaded = model.isDownloaded;
    const isDownloading = modelStore.isDownloading(model.id);
    const isHfModel = model.origin === ModelOrigin.HF;

    // Check projection model status for downloaded vision models
    const projectionModelStatus = modelStore.getProjectionModelStatus(model);
    const hasProjectionModelWarning =
      isDownloaded &&
      model.supportsMultimodal &&
      modelStore.getModelVisionPreference(model) && // Only show warning when vision is enabled
      projectionModelStatus.state === 'missing';

    // Check integrity when model is downloaded
    useEffect(() => {
      if (isDownloaded) {
        checkModelFileIntegrity(model).then(({ errorMessage }) => {
          setIntegrityError(errorMessage);
        });
      } else {
        setIntegrityError(null);
      }
    }, [isDownloaded, model]);

    const handleDelete = useCallback(() => {
      if (model.isDownloaded) {
        // Special handling for projection models
        if (model.modelType === ModelType.PROJECTION) {
          const canDeleteResult = modelStore.canDeleteProjectionModel(model.id);

          if (!canDeleteResult.canDelete) {
            // Show error dialog with specific reason
            let message =
              canDeleteResult.reason ||
              l10n.models.multimodal.cannotDeleteTitle;

            if (
              canDeleteResult.reason === 'Projection model is currently active'
            ) {
              message = l10n.models.multimodal.cannotDeleteActive;
            } else if (
              canDeleteResult.dependentModels &&
              canDeleteResult.dependentModels.length > 0
            ) {
              const modelNames = canDeleteResult.dependentModels
                .map(m => m.name)
                .join(', ');
              message = `${l10n.models.multimodal.cannotDeleteInUse}\n\n${l10n.models.multimodal.dependentModels} ${modelNames}`;
            }

            Alert.alert(l10n.models.multimodal.cannotDeleteTitle, message, [
              { text: l10n.common.ok, style: 'default' },
            ]);
            return;
          }

          // Show projection-specific confirmation dialog
          Alert.alert(
            l10n.models.multimodal.deleteProjectionTitle,
            l10n.models.multimodal.deleteProjectionMessage,
            [
              { text: l10n.common.cancel, style: 'cancel' },
              {
                text: l10n.common.delete,
                style: 'destructive',
                onPress: async () => {
                  try {
                    await modelStore.deleteModel(model);
                  } catch (error) {
                    console.error('Failed to delete projection model:', error);
                    Alert.alert(
                      l10n.models.multimodal.cannotDeleteTitle,
                      error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                      [{ text: l10n.common.ok, style: 'default' }],
                    );
                  }
                },
              },
            ],
          );
        } else {
          // Standard model deletion
          Alert.alert(
            l10n.models.modelCard.alerts.deleteTitle,
            l10n.models.modelCard.alerts.deleteMessage,
            [
              { text: l10n.common.cancel, style: 'cancel' },
              {
                text: l10n.common.delete,
                onPress: async () => {
                  await modelStore.deleteModel(model);
                },
              },
            ],
          );
        }
      }
    }, [model, l10n]);

    const openHuggingFaceUrl = useCallback(() => {
      if (model.hfUrl) {
        Linking.openURL(model.hfUrl).catch(err => {
          console.error('Failed to open URL:', err);
          setSnackbarVisible(true);
        });
      }
    }, [model.hfUrl]);

    const handleRemove = useCallback(() => {
      Alert.alert(
        l10n.models.modelCard.alerts.removeTitle,
        l10n.models.modelCard.alerts.removeMessage,
        [
          { text: l10n.common.cancel, style: 'cancel' },
          {
            text: l10n.models.modelCard.buttons.remove,
            style: 'destructive',
            onPress: () => modelStore.removeModelFromList(model),
          },
        ],
      );
    }, [model, l10n]);

    const handleWarningPress = () => {
      setSnackbarVisible(true);
    };

    const handleProjectionWarningPress = useCallback(() => {
      if (model.defaultProjectionModel) {
        // Try to download the missing projection model
        modelStore.checkSpaceAndDownload(model.defaultProjectionModel);
      }
      // Note: If no default projection model, user can manually select one in the vision controls
    }, [model.defaultProjectionModel]);

    const handleVisionToggle = useCallback(
      async (enabled: boolean) => {
        try {
          await modelStore.setModelVisionEnabled(model.id, enabled);
        } catch (error) {
          console.error('Failed to toggle vision setting:', error);
          // The error is already handled in setModelVisionEnabled (vision state is reverted)
        }
      },
      [model.id],
    );

    const handleProjectionModelSelect = useCallback(
      (projectionModelId: string) => {
        modelStore.setDefaultProjectionModel(model.id, projectionModelId);
      },
      [model.id],
    );

    // 分享加载状态
    const [isSharing, setIsSharing] = useState(false);

    // 使用全局服务监听 RemoteWorkerEvent（避免多个组件重复监听）
    useEffect(() => {
      // 确保 emitter 已注册
      remoteWorkerService.registerEmitter().catch(error => {
        console.error('注册 emitter 失败:', error);
      });

      // 添加事件监听器
      const removeListener = remoteWorkerService.addListener((message: string) => {
        // 根据消息类型处理
        if (message.includes('HEARTBEAT')) {
          console.log('💓 心跳:', message);
        } else if (message.includes('LOGIN_SUCCESS')) {
          console.log('✅ 登录成功:', message);
        } else if (message.includes('INFERENCE_START')) {
          console.log('🚀 开始推理:', message);
        } else if (message.includes('INFERENCE_SUCCESS')) {
          console.log('✅ 推理完成:', message);
        } else if (message.includes('COMMAND_RECEIVED')) {
          console.log('📨 收到任务:', message);
        } else {
          console.log('📢 状态更新:', message);
        }
      });

      // 清理函数：移除监听器
      return () => {
        removeListener();
      };
    }, []); // 空依赖数组，只在组件挂载时执行一次

    const handleShare = useCallback(async () => {
      console.log('=== handleShare 函数被调用 ===');
      console.log('Model ID:', model.id);
      console.log('Model isDownloaded:', model.isDownloaded);

      // 检查是否已登录
      if (!mobileAuthService.isAuthenticated) {
        console.log('用户未登录');
        setSnackbarMessage('请先登录后再分享');
        setSnackbarVisible(true);
        return;
      }

      // 检查是否已绑定设备
      if (!deviceService.isDeviceBound) {
        console.log('设备未绑定，需要先绑定设备');
        onNeedBindDevice?.();
        return;
      }

      console.log('已登录用户:', mobileAuthService.user?.phone_number);
      console.log('已绑定设备 client_id:', deviceService.clientId);

      // 检查当前模型是否已分享
      const isCurrentModelShared = modelStore.sharedModelId === model.id;
      // 检查是否有其他模型正在分享
      const hasOtherModelSharing = modelStore.sharedModelId && modelStore.sharedModelId !== model.id;

      console.log('当前模型是否已分享:', isCurrentModelShared);
      console.log('是否有其他模型在分享:', hasOtherModelSharing, '分享的模型ID:', modelStore.sharedModelId);

      // 如果当前模型已分享，直接停止（不需要加载状态）
      if (isCurrentModelShared) {
        console.log('当前模型已分享，准备停止远程工作器...');
        // 添加超时机制，避免卡住
        const stopWithTimeout = async (): Promise<number> => {
          return Promise.race([
            GpufModule.stopRemoteWorker(),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('停止操作超时')), 10000); // 10秒超时
            }),
          ]);
        };

        try {
          console.log('开始调用 GpufModule.stopRemoteWorker()...');
          const stopResult = await stopWithTimeout();
          console.log('stopRemoteWorker 返回结果:', stopResult);

          // 无论结果如何，都清除分享状态（因为用户已经点击了停止）
          modelStore.clearSharedModel();
          console.log('已清除分享状态，当前 sharedModelId:', modelStore.sharedModelId);

          if (stopResult === 0) {
            console.log('✅ Remote worker stopped successfully');
            setSnackbarMessage('已停止分享');
          } else {
            console.warn('❌ stopRemoteWorker 返回非0值:', stopResult);
            setSnackbarMessage('已停止分享');
          }
          setSnackbarVisible(true);
        } catch (error) {
          console.error('❌ Error stopping remote worker:', error);
          console.error('错误详情:', error instanceof Error ? error.stack : error);

          // 即使出错，也清除分享状态
          modelStore.clearSharedModel();
          console.log('出错后已清除分享状态');

          setSnackbarMessage('已停止分享');
          setSnackbarVisible(true);
        }
        console.log('停止分享流程结束');
        return; // 直接返回，不继续执行
      }

      // 开始加载状态（只有启动分享时才需要）
      setIsSharing(true);

      // 保存是否是切换模型的状态（在停止操作之前，因为停止后会清除 sharedModelId）
      const isSwitchingModel = hasOtherModelSharing;

      try {
        // 【重要】如果有其他模型正在分享，必须先停止它
        // 切换模型流程：stopRemoteWorker -> setRemoteWorkerModel -> startRemoteWorkerTasks（不调用 startRemoteWorker）
        if (hasOtherModelSharing) {
          console.log('⚠️ 检测到有其他模型正在分享，必须先停止当前分享...');
          console.log('当前分享的模型ID:', modelStore.sharedModelId);
          console.log('新模型ID:', model.id);

          let stopResult: number;
          try {
            // 添加超时机制，避免卡住
            stopResult = await Promise.race([
              GpufModule.stopRemoteWorker(),
              new Promise<number>((_, reject) => {
                setTimeout(() => reject(new Error('停止分享超时（10秒）')), 10000); // 10秒超时
              }),
            ]);
            console.log('stopRemoteWorker 返回结果:', stopResult);
          } catch (error) {
            console.error('❌ 停止之前分享时出错:', error);
            setSnackbarMessage(`停止之前的分享失败: ${error instanceof Error ? error.message : '未知错误'}`);
            setSnackbarVisible(true);
            return; // 停止失败，不继续新的分享流程
          }

          if (stopResult === 0) {
            console.log('✅ 已成功停止之前的分享');
            modelStore.clearSharedModel(); // 清除之前的分享状态
            console.log('已清除分享状态，准备开始新的分享流程');
          } else {
            console.warn('❌ 停止之前分享失败（返回码:', stopResult, '）');
            setSnackbarMessage(`停止之前的分享失败 (错误代码: ${stopResult})`);
            setSnackbarVisible(true);
            return; // 停止失败，不继续新的分享流程
          }

          // 等待一段时间，确保停止操作完全完成
          console.log('等待工作器完全停止...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        }

        // 启动分享流程（链式调用）
        if (!model.isDownloaded) {
          console.log('⚠️ 模型未下载，无法分享');
          setSnackbarMessage('模型未下载，无法分享');
          setSnackbarVisible(true);
          return;
        }

        // Step 1: 获取模型路径并设置模型
        // 优化：直接构建路径，跳过文件系统检查（因为模型已下载，路径格式固定）
        console.log('Step 1: 构建模型路径（跳过文件系统检查）...');
        let modelPath: string;
        try {
          // 直接根据模型类型构建路径，避免 RNFS.exists 在真机上可能很慢的问题
          if (model.origin === ModelOrigin.PRESET && model.filename) {
            const author = model.author || 'unknown';
            modelPath = `${RNFS.DocumentDirectoryPath}/models/preset/${author}/${model.filename}`;
            console.log('使用预设模型路径:', modelPath);
          } else if (model.origin === ModelOrigin.HF && model.filename) {
            const author = model.author || 'unknown';
            modelPath = `${RNFS.DocumentDirectoryPath}/models/hf/${author}/${model.filename}`;
            console.log('使用HF模型路径:', modelPath);
          } else if (model.fullPath) {
            modelPath = model.fullPath;
            console.log('使用本地模型路径:', modelPath);
          } else {
            throw new Error('无法构建模型路径：缺少必要信息');
          }
        } catch (error) {
          console.error('❌ 构建模型路径失败:', error);
          setSnackbarMessage(`获取模型路径失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setSnackbarVisible(true);
          return;
        }

        console.log('Step 1: 准备调用 setRemoteWorkerModel...');
        console.log('模型路径:', modelPath);

        // 调用 setRemoteWorkerModel 设置模型
        let setModelResult: number;
        const setModelStartTime = Date.now();
        try {
          console.log('开始调用 setRemoteWorkerModel（超时: 20秒）...');
          setModelResult = await Promise.race([
            GpufModule.setRemoteWorkerModel(modelPath),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('setRemoteWorkerModel 超时（20秒）')), 20000); // 20秒超时
            }),
          ]);
          const setModelDuration = Date.now() - setModelStartTime;
          console.log(`setRemoteWorkerModel 返回结果: ${setModelResult}，耗时: ${setModelDuration}ms`);
        } catch (error) {
          const setModelDuration = Date.now() - setModelStartTime;
          console.error(`❌ setRemoteWorkerModel 调用失败（耗时: ${setModelDuration}ms）:`, error);
          setSnackbarMessage(`设置模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setSnackbarVisible(true);
          return;
        }

        if (setModelResult !== 0) {
          console.error('❌ setRemoteWorkerModel 失败，返回码:', setModelResult);
          setSnackbarMessage(`设置模型失败 (错误代码: ${setModelResult})`);
          setSnackbarVisible(true);
          return;
        }
        console.log('✅ Step 1 完成: 模型设置成功');

        // Step 2: 启动远程工作器（首次初始化和切换模型都需要调用）
        console.log(`Step 2: 调用 startRemoteWorker${isSwitchingModel ? '（切换模型）' : '（首次初始化）'}...`);
        const clientId = deviceService.clientId || '';
        // const clientId = '50ef7b5e7b5b4c79991087bb9f62cef1';
        console.log('使用 client_id:', clientId);

        let startWorkerResult: number;
        try {
          startWorkerResult = await Promise.race([
            GpufModule.startRemoteWorker(
              // 'agent.gpunexus.com',  // 服务器地址
              '8.140.251.142',
              17000,            // 控制端口
              17001,            // 代理端口
              'TCP',            // 连接类型
              clientId          // 客户端ID
            ),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('startRemoteWorker 超时')), 20000); // 20秒超时
            }),
          ]);
          console.log('startRemoteWorker 返回结果:', startWorkerResult);
        } catch (error) {
          console.error('❌ startRemoteWorker 调用失败:', error);
          setSnackbarMessage(`连接服务器失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setSnackbarVisible(true);
          return;
        }

        if (startWorkerResult !== 0) {
          // 检查是否工作器已经在运行
          try {
            const status = await GpufModule.getRemoteWorkerStatus();
            console.log('工作器状态:', status);

            if (!(status && status.includes('running'))) {
              console.error('❌ startRemoteWorker 失败');
              setSnackbarMessage(`连接服务器失败 (错误代码: ${startWorkerResult})`);
              setSnackbarVisible(true);
              return;
            }
            console.log('工作器已在运行，继续下一步...');
          } catch (error) {
            console.error('❌ 获取工作器状态失败:', error);
            setSnackbarMessage(`连接服务器失败 (错误代码: ${startWorkerResult})`);
            setSnackbarVisible(true);
            return;
          }
        }
        console.log('✅ Step 2 完成: 远程工作器已启动');

        // Step 3: 确保 emitter 已注册（如果还没有注册）
        console.log('Step 3: 确保 emitter 已注册...');
        try {
          await remoteWorkerService.registerEmitter();
          console.log('✅ emitter 已注册');
        } catch (error) {
          console.warn('⚠️ 注册 emitter 失败，将使用无回调模式:', error);
          // 继续执行，使用无回调模式
        }

        // Step 4: 启动任务
        console.log('Step 4: 调用 startRemoteWorkerTasks...');
        let startTasksResult: number;
        try {
          startTasksResult = await Promise.race([
            GpufModule.startRemoteWorkerTasks(),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('startRemoteWorkerTasks 超时')), 15000); // 15秒超时
            }),
          ]);
          console.log('startRemoteWorkerTasks 返回结果:', startTasksResult);
        } catch (error) {
          console.error('❌ startRemoteWorkerTasks 调用失败:', error);
          setSnackbarMessage(`启动任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
          setSnackbarVisible(true);
          return;
        }

        if (startTasksResult !== 0) {
          console.error('❌ startRemoteWorkerTasks 失败，返回码:', startTasksResult);
          setSnackbarMessage(`启动任务失败 (错误代码: ${startTasksResult})`);
          setSnackbarVisible(true);
          return;
        }
        console.log('✅ Step 4 完成: 任务已启动');

        // 所有步骤成功，设置新的分享状态
        console.log('🎉 分享流程全部成功！');
        modelStore.setSharedModel(model.id);
        console.log('当前分享的模型ID:', modelStore.sharedModelId);
        setSnackbarMessage('分享成功！');
        setSnackbarVisible(true);

        console.log('=== handleShare 函数执行完成 ===');
      } catch (error) {
        console.error('❌ Error in handleShare:', error);
        console.error('错误详情:', error instanceof Error ? error.stack : error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setSnackbarMessage(`操作失败: ${errorMessage}`);
        setSnackbarVisible(true);
        console.log('=== handleShare 函数执行完成（有错误）===');
      } finally {
        // 结束加载状态
        setIsSharing(false);
      }
    }, [model.id, model.isDownloaded, onNeedBindDevice]);

    // Helper function to get model type icon - updated sizes
    const getModelTypeIcon = () => {
      if (model.supportsMultimodal) {
        return (
          <EyeIcon
            width={16}
            height={16}
            stroke={theme.colors.iconModelTypeVision}
          />
        );
      }
      // Default to chat icon for text models
      return (
        <ChatIcon
          width={16}
          height={16}
          stroke={theme.colors.iconModelTypeText}
        />
      );
    };

    // Helper function to get status dot
    const getStatusDot = () => {
      if (!isDownloaded) {
        return null;
      }
      return (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isActiveModel
                ? theme.colors.bgStatusActive
                : theme.colors.bgStatusIdle,
            },
          ]}
        />
      );
    };

    // Helper function to toggle expanded state with smooth LayoutAnimation
    const toggleExpanded = useCallback(() => {
      LayoutAnimation.configureNext({
        duration: 300,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.scaleXY,
        },
      });
      setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const renderActionButtons = () => {
      if (isDownloading) {
        // Downloading state - show cancel button
        return (
          <View style={styles.actionButtonsRow}>
            <Button
              testID="cancel-button"
              icon="close"
              mode="outlined"
              onPress={() => modelStore.cancelDownload(model.id)}
              style={[
                styles.primaryActionButton,
                {
                  backgroundColor: theme.colors.errorContainer,
                  borderColor: theme.colors.error,
                },
              ]}
              textColor={theme.colors.error}>
              {l10n.common.cancel}
            </Button>
          </View>
        );
      }

      if (!isDownloaded) {
        // Not downloaded state
        return (
          <View style={styles.actionButtonsRow}>
            <Button
              testID="download-button"
              icon="download"
              mode="outlined"
              onPress={() => modelStore.checkSpaceAndDownload(model.id)}
              disabled={!storageOk}
              style={[
                styles.primaryActionButton,
                storageOk
                  ? {
                    backgroundColor: theme.colors.btnDownloadBg,
                    borderColor: theme.colors.btnDownloadBorder,
                  }
                  : {
                    backgroundColor: theme.colors.surfaceDim,
                    borderColor: theme.colors.outline,
                  },
              ]}
              textColor={theme.colors.btnDownloadText}>
              {l10n.models.modelCard.buttons.download}
            </Button>

            <TouchableOpacity
              testID="settings-button"
              onPress={onOpenSettings}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={l10n.models.modelCard.buttons.settings}>
              <SettingsIcon
                width={16}
                height={16}
                stroke={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            {isHfModel && (
              <TouchableOpacity
                testID="remove-model-button"
                onPress={handleRemove}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={l10n.models.modelCard.buttons.remove}>
                <XIcon width={20} height={20} stroke={theme.colors.error} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              testID="expand-details-button"
              onPress={toggleExpanded}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={
                isExpanded
                  ? l10n.models.modelCard.accessibility.collapseDetails
                  : l10n.models.modelCard.accessibility.expandDetails
              }>
              {isExpanded ? (
                <ChevronSelectorExpandedVerticalIcon
                  width={16}
                  height={16}
                  stroke={theme.colors.onSurfaceVariant}
                />
              ) : (
                <ChevronSelectorVerticalIcon
                  width={16}
                  height={16}
                  stroke={theme.colors.onSurfaceVariant}
                />
              )}
            </TouchableOpacity>
          </View>
        );
      }

      // Downloaded state - soft blue styling
      return (
        <View style={styles.actionButtonsRow}>


          {/* Share Button - Device model sharing with status indication */}
          <Button
            testID="share-button"
            icon={isSharing ? undefined : () => (
              <ShareIcon
                width={16}
                height={16}
                stroke={modelStore.sharedModelId === model.id ? theme.colors.onPrimary : theme.colors.primary}
              />
            )}
            mode={modelStore.sharedModelId === model.id ? "contained" : "outlined"}
            onPress={handleShare}
            disabled={isSharing}
            loading={isSharing}
            style={[
              styles.shareButton,
              modelStore.sharedModelId === model.id
                ? {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                }
                : {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.primary,
                },
              isSharing && {
                opacity: 0.8,
              },
            ]}
            textColor={modelStore.sharedModelId === model.id ? theme.colors.onPrimary : theme.colors.primary}>
            {isSharing ? "连接中..." : (modelStore.sharedModelId === model.id ? "已分享" : "分享")}
          </Button>
          {renderModelLoadButton()}

          <TouchableOpacity
            testID="settings-button"
            onPress={onOpenSettings}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={l10n.models.modelCard.buttons.settings}>
            <SettingsIcon
              width={16}
              height={16}
              stroke={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity
            testID="delete-button"
            onPress={() => handleDelete()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={l10n.common.delete}>
            <TrashIcon width={16} height={16} stroke={theme.colors.error} />
          </TouchableOpacity>

          <TouchableOpacity
            testID="expand-details-button"
            onPress={toggleExpanded}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={
              isExpanded
                ? l10n.models.modelCard.accessibility.collapseDetails
                : l10n.models.modelCard.accessibility.expandDetails
            }>
            {isExpanded ? (
              <ChevronSelectorExpandedVerticalIcon
                width={16}
                height={16}
                stroke={theme.colors.onSurfaceVariant}
              />
            ) : (
              <ChevronSelectorVerticalIcon
                width={16}
                height={16}
                stroke={theme.colors.onSurfaceVariant}
              />
            )}
          </TouchableOpacity>
        </View>
      );
    };

    const renderModelLoadButton = () => {
      if (
        modelStore.isContextLoading &&
        modelStore.loadingModel?.id === model.id
      ) {
        return (
          <Button
            disabled={true}
            style={[
              styles.primaryActionButton,
              {
                backgroundColor: theme.colors.btnPrimaryBg,
                borderColor: theme.colors.btnPrimaryBorder,
              },
            ]}
            textColor={theme.colors.btnPrimaryText}>
            <ActivityIndicator
              testID="loading-indicator"
              animating={true}
              color={theme.colors.btnPrimaryText}
              size="small"
            />
          </Button>
        );
      }

      const handlePress = async () => {
        if (isActiveModel) {
          modelStore.manualReleaseContext();
        } else {
          try {
            await modelStore.initContext(model);
            if (uiStore.autoNavigatetoChat) {
              navigation.navigate('Chat');
            }
          } catch (e) {
            console.log(`Error: ${e}`);
          }
        }
      };

      const getButtonText = () => {
        if (isActiveModel) {
          return l10n.models.modelCard.buttons.offload;
        }
        return l10n.models.modelCard.buttons.load;
      };

      const getButtonStyle = () => {
        if (isActiveModel) {
          return {
            backgroundColor: theme.colors.btnReadyBg,
            borderColor: theme.colors.btnReadyBorder,
          };
        }
        return {
          backgroundColor: theme.colors.btnPrimaryBg,
          borderColor: theme.colors.btnPrimaryBorder,
        };
      };

      const getTextColor = () => {
        if (isActiveModel) {
          return theme.colors.btnReadyText;
        }
        return theme.colors.btnPrimaryText;
      };

      return (
        <Button
          testID={isActiveModel ? 'offload-button' : 'load-button'}
          icon={isActiveModel ? 'eject' : 'play-circle-outline'}
          //mode="contained-tonal"
          onPress={handlePress}
          style={[styles.primaryActionButton, getButtonStyle()]}
          textColor={getTextColor()}>
          {getButtonText()}
        </Button>
      );
    };

    return (
      <>
        <Card elevation={0} style={styles.card}>
          {/* Compact Header */}
          <View style={styles.compactHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.modelTypeIcon}>{getModelTypeIcon()}</View>
                <Text
                  variant="titleSmall"
                  style={styles.compactModelName}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  {model.name}
                </Text>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.sizeInfo}>
                  <CpuChipIcon
                    width={10}
                    height={10}
                    stroke={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.sizeInfoText}>
                    {getModelSizeString(model, isActiveModel, l10n)}
                  </Text>
                </View>
                {getStatusDot()}
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Storage Error Display */}
            {!storageOk && !isDownloaded && (
              <HelperText
                testID="storage-error-text"
                type="error"
                visible={!storageOk}
                padding="none"
                style={styles.storageErrorText}>
                {storageNOkMessage}
              </HelperText>
            )}

            {/* Display warnings */}
            {(shortMemoryWarning || multimodalWarning) && isDownloaded && (
              <TouchableRipple
                testID="memory-warning-button"
                onPress={handleWarningPress}
                style={styles.warningContainer}>
                <View style={styles.warningContent}>
                  <IconButton
                    icon="alert-circle-outline"
                    iconColor={theme.colors.error}
                    size={20}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.warningText}>
                    {shortMemoryWarning || multimodalWarning}
                  </Text>
                </View>
              </TouchableRipple>
            )}

            {integrityError && (
              <TouchableRipple
                testID="integrity-warning-button"
                style={styles.warningContainer}>
                <View style={styles.warningContent}>
                  <IconButton
                    icon="alert-circle-outline"
                    iconColor={theme.colors.error}
                    size={20}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.warningText}>{integrityError}</Text>
                </View>
              </TouchableRipple>
            )}

            {/* Download Progress */}
            {isDownloading && (
              <View style={styles.downloadProgressContainer}>
                <ProgressBar
                  testID="download-progress-bar"
                  progress={model.progress / 100}
                  color={theme.colors.tertiary}
                  style={styles.progressBar}
                />
                {model.downloadSpeed && (
                  <Text style={styles.downloadSpeed}>
                    {model.downloadSpeed}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons Section */}
            <View style={styles.actionButtonsContainer}>
              {renderActionButtons()}
            </View>

            {isExpanded && (
              <View style={styles.detailsContent}>
                {/* Full Model Name */}
                <View style={styles.fullModelNameContainer}>
                  <Text style={styles.fullModelNameLabel}>
                    {l10n.models.modelCard.labels.modelName}
                  </Text>
                  <Text style={styles.fullModelNameText} selectable={true}>
                    {model.name}
                  </Text>
                </View>

                {/* Description - matching updated React example */}
                {model.capabilities && model.capabilities.length > 0 && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>
                      {getModelSkills(model)
                        .map(
                          skill =>
                            l10n.models.modelCapabilities[
                            skill.labelKey as keyof typeof l10n.models.modelCapabilities
                            ] || skill.labelKey,
                        )
                        .join(', ')}{' '}
                      {l10n.models.modelCard.labels.capabilities}
                    </Text>
                  </View>
                )}

                {/* Vision Toggle for multimodal models */}
                {model.supportsMultimodal && (
                  <View style={styles.visionToggleContainer}>
                    <View
                      testID="vision-skill-touchable"
                      style={styles.visionToggleHeader}>
                      <View style={styles.visionToggleLeft}>
                        <EyeIcon
                          width={16}
                          height={16}
                          stroke={
                            modelStore.getModelVisionPreference(model)
                              ? theme.colors.tertiary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                        <Text style={styles.visionToggleLabel}>
                          {l10n.models.modelCard.labels.vision}
                        </Text>
                      </View>
                      <Switch
                        value={modelStore.getModelVisionPreference(model)}
                        onValueChange={handleVisionToggle}
                        disabled={
                          !projectionModelStatus.isAvailable &&
                          !modelStore.getModelVisionPreference(model) &&
                          model.isDownloaded
                        }
                      />
                    </View>
                    {!projectionModelStatus.isAvailable &&
                      !modelStore.getModelVisionPreference(model) &&
                      model.isDownloaded && (
                        <Text style={styles.visionHelpText}>
                          {l10n.models.modelCard.labels.requiresProjectionModel}
                        </Text>
                      )}
                  </View>
                )}

                {/* Projection Models Management for multimodal models */}
                {model.supportsMultimodal &&
                  modelStore.getModelVisionPreference(model) && (
                    <View style={styles.projectionModelsContainer}>
                      <ProjectionModelSelector
                        model={model}
                        onProjectionModelSelect={handleProjectionModelSelect}
                        showDownloadActions={model.isDownloaded}
                        initialExpanded={true}
                      />
                    </View>
                  )}

                {/* Technical Details Grid - 2x2 layout */}
                <View style={styles.technicalDetailsGrid}>
                  {/* Parameters */}
                  {model.params > 0 && (
                    <View style={styles.technicalDetailCard}>
                      <Text style={styles.technicalDetailLabel}>
                        {l10n.models.modelDescription.parameters}
                      </Text>
                      <Text style={styles.technicalDetailValue}>
                        {formatNumber(model.params, 2, true, false)}
                      </Text>
                    </View>
                  )}

                  {/* Context Length */}
                  {model.hfModel?.specs?.gguf?.context_length && (
                    <View style={styles.technicalDetailCard}>
                      <Text style={styles.technicalDetailLabel}>
                        {l10n.models.modelCard.labels.contextLength}
                      </Text>
                      <Text style={styles.technicalDetailValue}>
                        {model.hfModel.specs.gguf.context_length.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {/* Architecture */}
                  {model.hfModel?.specs?.gguf?.architecture && (
                    <View style={styles.technicalDetailCard}>
                      <Text style={styles.technicalDetailLabel}>
                        {l10n.models.modelCard.labels.architecture}
                      </Text>
                      <Text style={styles.technicalDetailValue}>
                        {model.hfModel.specs.gguf.architecture}
                      </Text>
                    </View>
                  )}

                  {/* Author */}
                  {model.author && (
                    <View style={styles.technicalDetailCard}>
                      <Text style={styles.technicalDetailLabel}>
                        {l10n.models.modelCard.labels.author}
                      </Text>
                      <Text style={styles.technicalDetailValue}>
                        {model.author}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Projection model warning */}
                {hasProjectionModelWarning && (
                  <TouchableOpacity
                    testID="projection-warning-badge"
                    onPress={handleProjectionWarningPress}
                    style={styles.warningButton}
                    activeOpacity={0.7}>
                    <Text style={styles.warningButtonText}>
                      {l10n.models.modelCard.labels.downloadProjectionModel}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* HuggingFace Link */}
                {model.hfUrl && (
                  <TouchableOpacity
                    testID="open-huggingface-url"
                    onPress={openHuggingFaceUrl}
                    style={styles.hfLinkButton}
                    activeOpacity={0.7}>
                    <View style={styles.hfLinkContent}>
                      <LinkExternalIcon
                        width={16}
                        height={16}
                        stroke={theme.colors.primary}
                      />
                      <Text style={styles.hfLinkText}>
                        {
                          l10n.models.modelCard.labels
                            .viewModelCardOnHuggingFace
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>
        {/* Snackbar to show sharing status and remote worker result */}
        <Snackbar
          testID="sharing-status-snackbar"
          visible={snackbarVisible}
          onDismiss={() => {
            setSnackbarVisible(false);
            setSnackbarMessage('');
          }}
          duration={Snackbar.DURATION_MEDIUM}
          action={{
            label: l10n.common.dismiss,
            onPress: () => {
              setSnackbarVisible(false);
              setSnackbarMessage('');
            },
          }}>
          {snackbarMessage ||
            (modelStore.sharedModelId === model.id
              ? "模型已设置为设备分享"
              : "模型分享已取消")}
        </Snackbar>
      </>
    );
  },
);
