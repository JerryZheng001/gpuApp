import React, {useContext, useState, useCallback, useEffect} from 'react';
import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import {observer} from 'mobx-react';
import {Text, Switch} from 'react-native-paper';
import * as RNFS from '@dr.pogodin/react-native-fs';

import {styles} from './styles';
import {chatSessionStore, modelStore} from '../../store';
import {L10nContext} from '../../utils';
import {mobileAuthService, deviceService, remoteWorkerService} from '../../services';
import GpufModule from '../../services/GpufModule';
import {Model, ModelOrigin} from '../../utils/types';
import {ChevronDownIcon, ShareIcon} from '../../assets/icons';
import {useTheme} from '../../hooks';
import Config from 'react-native-config';
import {Menu} from '../Menu';

export const ChatHeaderTitle: React.FC = observer(() => {
  const l10n = useContext(L10nContext);
  const theme = useTheme();
  const apiHost = React.useMemo(() => {
    const raw = Config.API_BASE_URL;
    if (!raw) {
      return 'agent.gpunexus.com';
    }
    try {
      const u = new URL(raw);
      return u.hostname || 'agent.gpunexus.com';
    } catch {
      return (
        raw
          .replace(/^http?:\/\//, '')
          .split('/')[0]
          .split(':')[0] || 'agent.gpunexus.com'
      );
    }
  }, []);
  const activeSessionId = chatSessionStore.activeSessionId;
  const activeSession = chatSessionStore.sessions.find(
    session => session.id === activeSessionId,
  );
  const activeModel = modelStore.activeModel;
  const [isSharing, setIsSharing] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [modelMenuVisible, setModelMenuVisible] = useState(false);

  const openModelMenu = useCallback(() => setModelMenuVisible(true), []);
  const closeModelMenu = useCallback(() => setModelMenuVisible(false), []);

  const isShared = !!(activeModel?.id && modelStore.sharedModelId === activeModel.id);
  const isRemoteModel = activeModel?.origin === ModelOrigin.REMOTE;
  const canShare =
    !!activeModel?.isDownloaded &&
    !isRemoteModel &&
    mobileAuthService.isAuthenticated &&
    deviceService.isDeviceBound;
  const disabledColor =
    (theme.colors as any).onSurfaceDisabled || theme.colors.onSurfaceVariant;

  const freeBadgeStyle = {
    backgroundColor: '#e8fef4',
    color: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden' as const,
  };

  const models = modelStore.availableModels
    .slice()
    .sort((a, b) => {
      const isFreeA =
        typeof (a as any)?.currentClientIsFree === 'boolean'
          ? (a as any).currentClientIsFree
          : ((((a as any)?.enableGroups as string[] | undefined) || []).includes(
              'free',
            ) ||
              a.name.startsWith('免费 '));
      const isFreeB =
        typeof (b as any)?.currentClientIsFree === 'boolean'
          ? (b as any).currentClientIsFree
          : ((((b as any)?.enableGroups as string[] | undefined) || []).includes(
              'free',
            ) ||
              b.name.startsWith('免费 '));

      const freeA = isFreeA ? 0 : 1;
      const freeB = isFreeB ? 0 : 1;
      if (freeA !== freeB) {
        return freeA - freeB;
      }
      return a.name.localeCompare(b.name);
    });

  const localModels = models.filter(m => m.origin !== ModelOrigin.REMOTE);
  const remoteModels = models.filter(m => m.origin === ModelOrigin.REMOTE);

  const onSelectModel = useCallback(
    (model: Model) => {
      modelStore.initContext(model);
      closeModelMenu();
    },
    [closeModelMenu],
  );

  // 同步 isShared 状态到 switchValue
  useEffect(() => {
    setSwitchValue(isShared);
  }, [isShared]);

  const handleShareToggle = useCallback(async (enabled: boolean) => {
    if (!activeModel) {
      return;
    }

    console.log('=== ChatHeaderTitle handleShareToggle 被调用 ===');
    console.log('Model ID:', activeModel.id);
    console.log('Enabled:', enabled);
    console.log('IsShared:', isShared);
    console.log('当前 switchValue:', switchValue);

    // 不立即改变 switch 状态，先设置 loading
    setIsSharing(true);

    // 检查是否已登录
    if (!mobileAuthService.isAuthenticated) {
      console.log('用户未登录');
      setIsSharing(false);
      return;
    }

    // 检查是否已绑定设备
    if (!deviceService.isDeviceBound) {
      console.log('设备未绑定');
      setIsSharing(false);
      return;
    }

    // 检查当前模型是否已分享
    const isCurrentModelShared = modelStore.sharedModelId === activeModel.id;
    // 检查是否有其他模型正在分享
    const hasOtherModelSharing = modelStore.sharedModelId && modelStore.sharedModelId !== activeModel.id;

    console.log('当前模型是否已分享:', isCurrentModelShared);
    console.log('是否有其他模型在分享:', hasOtherModelSharing, '分享的模型ID:', modelStore.sharedModelId);

    // 如果当前模型已分享，直接停止
    if (isCurrentModelShared && !enabled) {
      console.log('当前模型已分享，准备停止远程工作器...');
      try {
        const stopResult = await Promise.race([
          GpufModule.stopRemoteWorker(),
          new Promise<number>((_, reject) => {
            setTimeout(() => reject(new Error('停止操作超时')), 10000);
          }),
        ]);
        console.log('stopRemoteWorker 返回结果:', stopResult);

        // 无论结果如何，都清除分享状态
        modelStore.clearSharedModel();
        console.log('已清除分享状态，当前 sharedModelId:', modelStore.sharedModelId);
        // 成功后更新 switch 状态
        setSwitchValue(false);
      } catch (error) {
        console.error('停止分享失败:', error);
        // 即使出错，也清除分享状态
        modelStore.clearSharedModel();
        // 失败时也更新 switch 状态
        setSwitchValue(false);
      } finally {
        setIsSharing(false);
      }
      console.log('停止分享流程结束');
      return;
    }

    // 如果开启分享
    if (enabled && !isCurrentModelShared) {
      if (!activeModel.isDownloaded) {
        console.log('模型未下载，无法分享');
        setIsSharing(false);
        return;
      }

      const isSwitchingModel = hasOtherModelSharing;

      try {
        // 如果有其他模型正在分享，必须先停止它
        if (hasOtherModelSharing) {
          console.log('⚠️ 检测到有其他模型正在分享，必须先停止当前分享...');
          console.log('当前分享的模型ID:', modelStore.sharedModelId);
          console.log('新模型ID:', activeModel.id);

          let stopResult: number;
          try {
            stopResult = await Promise.race([
              GpufModule.stopRemoteWorker(),
              new Promise<number>((_, reject) => {
                setTimeout(() => reject(new Error('停止分享超时（10秒）')), 10000);
              }),
            ]);
            console.log('stopRemoteWorker 返回结果:', stopResult);
          } catch (error) {
            console.error('❌ 停止之前分享时出错:', error);
            setIsSharing(false);
            // 失败时恢复 switch 状态
            setSwitchValue(false);
            return;
          }

          if (stopResult === 0) {
            console.log('✅ 已成功停止之前的分享');
            modelStore.clearSharedModel();
            console.log('已清除分享状态，准备开始新的分享流程');
          } else {
            console.warn('❌ 停止之前分享失败（返回码:', stopResult, '）');
            setIsSharing(false);
            // 失败时恢复 switch 状态
            setSwitchValue(false);
            return;
          }

          // 等待一段时间，确保停止操作完全完成
          console.log('等待工作器完全停止...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 1: 构建模型路径
        console.log('Step 1: 构建模型路径...');
        console.log('模型信息:', {
          id: activeModel?.id,
          origin: activeModel?.origin,
          filename: activeModel?.filename,
          author: activeModel?.author,
          fullPath: activeModel?.fullPath,
          isDownloaded: activeModel?.isDownloaded,
        });
        
        let modelPath: string;
        try {
          // 检查 activeModel 是否存在
          if (!activeModel) {
            throw new Error('activeModel 不存在');
          }

          // 检查 DocumentDirectoryPath 是否可用
          const docPath = RNFS.DocumentDirectoryPath;
          if (!docPath) {
            throw new Error('DocumentDirectoryPath 不可用');
          }
          console.log('DocumentDirectoryPath:', docPath);

          // 优先使用 fullPath（本地模型）
          if (activeModel.fullPath) {
            modelPath = activeModel.fullPath;
            console.log('使用本地模型路径 (fullPath):', modelPath);
          } 
          // 使用 origin 和 filename 构建路径
          else if (activeModel.origin !== undefined && activeModel.filename) {
            const author = activeModel.author || 'unknown';
            
            if (activeModel.origin === ModelOrigin.PRESET) {
              modelPath = `${docPath}/models/preset/${author}/${activeModel.filename}`;
              console.log('使用预设模型路径:', modelPath);
            } else if (activeModel.origin === ModelOrigin.HF) {
              modelPath = `${docPath}/models/hf/${author}/${activeModel.filename}`;
              console.log('使用HF模型路径:', modelPath);
            } else {
              throw new Error(`不支持的模型来源: ${String(activeModel.origin)}`);
            }
          } else {
            const errorDetails = {
              origin: activeModel.origin,
              filename: activeModel.filename,
              fullPath: activeModel.fullPath,
            };
            console.error('模型路径构建失败 - 详细信息:', errorDetails);
            throw new Error(`无法构建模型路径：缺少必要信息。origin: ${String(activeModel.origin)}, filename: ${String(activeModel.filename)}, fullPath: ${String(activeModel.fullPath)}`);
          }

          if (!modelPath) {
            throw new Error('模型路径为空');
          }
        } catch (error) {
          console.error('❌ 构建模型路径失败:', error);
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          console.error('错误详情:', errorMessage);
          if (error instanceof Error) {
            console.error('错误堆栈:', error.stack);
          }
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }

        // Step 2: 设置模型
        console.log('Step 2: 准备调用 setRemoteWorkerModel...');
        console.log('模型路径:', modelPath);
        let setModelResult: number;
        const setModelStartTime = Date.now();
        try {
          setModelResult = await Promise.race([
            GpufModule.setRemoteWorkerModel(modelPath),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('setRemoteWorkerModel 超时（20秒）')), 20000);
            }),
          ]);
          const setModelDuration = Date.now() - setModelStartTime;
          console.log(`setRemoteWorkerModel 返回结果: ${setModelResult}，耗时: ${setModelDuration}ms`);
        } catch (error) {
          const setModelDuration = Date.now() - setModelStartTime;
          console.error(`❌ setRemoteWorkerModel 调用失败（耗时: ${setModelDuration}ms）:`, error);
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }

        if (setModelResult !== 0) {
          console.error('❌ setRemoteWorkerModel 失败，返回码:', setModelResult);
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }
        console.log('✅ Step 2 完成: 模型设置成功');

        // Step 3: 启动远程工作器
        console.log(`Step 3: 调用 startRemoteWorker${isSwitchingModel ? '（切换模型）' : '（首次初始化）'}...`);
        const clientId = deviceService.clientId || '';
        console.log('使用 client_id:', clientId);

        let startWorkerResult: number;
        try {
          startWorkerResult = await Promise.race([
            GpufModule.startRemoteWorker(
              // 'agent.gpunexus.com',
              apiHost,
              17000,
              17001,
              'TCP',
              clientId
            ),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('startRemoteWorker 超时')), 20000);
            }),
          ]);
          console.log('startRemoteWorker 返回结果:', startWorkerResult);
        } catch (error) {
          console.error('❌ startRemoteWorker 调用失败:', error);
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }

        if (startWorkerResult !== 0) {
          // 检查是否工作器已经在运行
          try {
            const status = await GpufModule.getRemoteWorkerStatus();
            console.log('工作器状态:', status);

            if (!(status && status.includes('running'))) {
              console.error('❌ startRemoteWorker 失败');
              setIsSharing(false);
              // 失败时恢复 switch 状态
              setSwitchValue(false);
              return;
            }
            console.log('工作器已在运行，继续下一步...');
          } catch (error) {
            console.error('❌ 获取工作器状态失败:', error);
            setIsSharing(false);
            // 失败时恢复 switch 状态
            setSwitchValue(false);
            return;
          }
        }
        console.log('✅ Step 3 完成: 远程工作器已启动');

        // Step 4: 确保 emitter 已注册
        console.log('Step 4: 确保 emitter 已注册...');
        try {
          await remoteWorkerService.registerEmitter();
          console.log('✅ emitter 已注册');
        } catch (error) {
          console.warn('⚠️ 注册 emitter 失败，将使用无回调模式:', error);
        }

        // Step 5: 启动任务
        console.log('Step 5: 调用 startRemoteWorkerTasks...');
        let startTasksResult: number;
        try {
          startTasksResult = await Promise.race([
            GpufModule.startRemoteWorkerTasks(),
            new Promise<number>((_, reject) => {
              setTimeout(() => reject(new Error('startRemoteWorkerTasks 超时')), 15000);
            }),
          ]);
          console.log('startRemoteWorkerTasks 返回结果:', startTasksResult);
        } catch (error) {
          console.error('❌ startRemoteWorkerTasks 调用失败:', error);
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }

        if (startTasksResult !== 0) {
          console.error('❌ startRemoteWorkerTasks 失败，返回码:', startTasksResult);
          setIsSharing(false);
          // 失败时恢复 switch 状态
          setSwitchValue(false);
          return;
        }
        console.log('✅ Step 5 完成: 任务已启动');

        // 所有步骤成功，设置新的分享状态
        console.log('🎉 分享流程全部成功！');
        modelStore.setSharedModel(activeModel.id);
        console.log('当前分享的模型ID:', modelStore.sharedModelId);
        // 成功后更新 switch 状态
        setSwitchValue(true);
        console.log('=== handleShareToggle 函数执行完成 ===');
      } catch (error) {
        console.error('❌ Error in handleShareToggle:', error);
        console.error('错误详情:', error instanceof Error ? error.stack : error);
        // 失败时恢复 switch 状态
        setSwitchValue(false);
      } finally {
        setIsSharing(false);
      }
    }
  }, [activeModel, isShared, switchValue]);

  return (
    <View style={styles.container}>
      <Text numberOfLines={1} variant="titleSmall">
        {activeSession?.title || l10n.components.chatHeaderTitle.defaultTitle}
      </Text>
      {activeModel?.name && (
        <View style={styles.modelRow}>
          <Menu
            visible={modelMenuVisible}
            onDismiss={closeModelMenu}
            selectable
            anchorPosition="bottom"
            anchor={
              <TouchableOpacity
                onPress={openModelMenu}
                style={styles.modelSelectorButton}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Text
                  numberOfLines={1}
                  variant="bodySmall"
                  style={styles.modelName}>
                  {activeModel.name}
                </Text>
                <ChevronDownIcon
                  width={14}
                  height={14}
                  stroke={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            }>
            {localModels.length > 0 && (
              <Menu.Item label="本地模型" disabled isGroupLabel />
            )}
            {localModels.map(model => {
              const isFree =
                ((((model as any)?.enableGroups as string[] | undefined) || []).includes(
                  'free',
                ) ||
                  model.name.startsWith('免费 '));

              const modelNameWithoutFreePrefix = model.name.replace(
                /^免费\s*/,
                '',
              );

              return (
                <Menu.Item
                  key={model.id}
                  label={
                    isFree ? (
                      <>
                        <Text style={freeBadgeStyle}>免费</Text>{' '}
                        {modelNameWithoutFreePrefix}
                      </>
                    ) : (
                      model.name
                    )
                  }
                  onPress={() => onSelectModel(model)}
                  selected={model.id === modelStore.activeModelId}
                />
              );
            })}
            {localModels.length > 0 && remoteModels.length > 0 && (
              <Menu.Separator />
            )}
            {remoteModels.length > 0 && (
              <Menu.Item label="远程模型" disabled isGroupLabel />
            )}
            {remoteModels.map(model => {
              const isFree =
                ((((model as any)?.enableGroups as string[] | undefined) || []).includes(
                  'free',
                ) ||
                  model.name.startsWith('免费 '));

              const modelNameWithoutFreePrefix = model.name.replace(
                /^免费\s*/,
                '',
              );

              return (
                <Menu.Item
                  key={model.id}
                  label={
                    isFree ? (
                      <>
                        <Text style={freeBadgeStyle}>免费</Text>{' '}
                        {modelNameWithoutFreePrefix}
                      </>
                    ) : (
                      model.name
                    )
                  }
                  onPress={() => onSelectModel(model)}
                  selected={model.id === modelStore.activeModelId}
                />
              );
            })}
          </Menu>
          {!isRemoteModel && (
            <View style={styles.shareContainer}>
              <ShareIcon
                width={14}
                height={14}
                stroke={
                  canShare
                    ? switchValue
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                    : disabledColor
                }
                style={styles.shareIcon}
              />
              <View style={styles.switchWrapper}>
                <Switch
                  value={canShare ? switchValue : false}
                  onValueChange={handleShareToggle}
                  disabled={!canShare || isSharing}
                  style={styles.shareSwitch}
                />
                {isSharing && (
                  <View style={styles.switchLoadingOverlay}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
      {!activeModel?.name && (
        <Text numberOfLines={1} variant="bodySmall" style={styles.emptyModelText}>
          {l10n.chat.modelNotLoaded}
        </Text>
      )}
    </View>
  );
});
