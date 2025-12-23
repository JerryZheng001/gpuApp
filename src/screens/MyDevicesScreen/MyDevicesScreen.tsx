import React, {useContext, useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {Text, Card, Button, SegmentedButtons} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {DeviceCard} from './components/DeviceCard';
import {DeviceMonitoringTab} from './components/DeviceMonitoringTab';
import {DeviceHistoryTab} from './components/DeviceHistoryTab';
import {deviceService, mobileAuthService} from '../../services';
import {BindDeviceSheet, MobileAuthSheet} from '../../components';
import {CompactAuthBar} from '../PalsScreen/components';

// 设备数据接口
interface Device {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'paused' | 'offline';
  currentCompute: string;
  cumulativeDuration: string;
  cumulativeRevenue: string;
  // 可选的 API 原始数据
  apiData?: {
    cpu_usage: number;
    memory_usage: number;
    storage_usage: number;
    health: number;
    client_status: string;
};
}

const mockHistoryDevices: Device[] = [
  {
    id: '2',
    name: '家用安卓平板',
    model: 'Samsung Galaxy Tab S8',
    status: 'offline' as const,
    currentCompute: '4核8G',
    cumulativeDuration: '45小时',
    cumulativeRevenue: '¥12.30',
  },
  {
    id: '3',
    name: 'MacBook Pro',
    model: 'MacBook Pro 16"',
    status: 'paused' as const,
    currentCompute: '10核32G',
    cumulativeDuration: '256小时',
    cumulativeRevenue: '¥58.90',
  },
];

export const MyDevicesScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);

  const [selectedTab, setSelectedTab] = useState('monitoring');
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]); // 所有设备列表
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAuthBar, setShowAuthBar] = useState(false);
  const [showBindDevice, setShowBindDevice] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const navigation = useNavigation();

  // 确保导航栏右侧没有加号按钮
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => null,
    });
  }, [navigation]);

  // 提取获取设备列表的函数，便于复用
  const fetchDeviceList = useCallback(async (showLoading = true) => {
    // 先检查是否已登录
    if (!mobileAuthService.isAuthenticated) {
      setError('请先登录');
      if (showLoading) {
        setLoading(false);
      }
      return;
    }

    // 再检查设备是否绑定
    if (!deviceService.isDeviceBound) {
      setError('设备未绑定，请先绑定设备');
      if (showLoading) {
        setLoading(false);
      }
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // 调用 API 获取设备列表，传入 user_id 和 client_id
      const response = await deviceService.getClientList(
        deviceService.userId || undefined,
        deviceService.clientId || undefined,
      );

      if (response.success && response.data && response.data.devices) {
        const devices = response.data.devices;

        // 映射所有设备数据，同时保存原始 API 数据
        const mappedDevices: Device[] = devices.map(deviceData => ({
          id: deviceData.client_id,
          name: deviceData.client_name || '未知设备',
          model: deviceData.os_type || '未知型号',
          status: deviceData.client_status === 'online' 
            ? 'running' 
            : deviceData.client_status === 'offline'
            ? 'offline'
            : 'paused',
          currentCompute: `${deviceData.memory_usage}%`,
          cumulativeDuration: `${deviceData.uptime_days} 天`,
          cumulativeRevenue: `健康度: ${deviceData.health}%`,
          // 保存原始 API 数据用于监控页面
          apiData: {
            cpu_usage: deviceData.cpu_usage,
            memory_usage: deviceData.memory_usage,
            storage_usage: deviceData.storage_usage,
            health: deviceData.health,
            client_status: deviceData.client_status,
          },
        }));

        // 保存所有设备
        setAllDevices(mappedDevices);

        // 默认使用列表第一个设备（而不是当前绑定的设备）
        if (mappedDevices.length > 0) {
          setCurrentDevice(mappedDevices[0]);
        } else {
          setError('设备列表为空');
        }
      } else {
        setError(response.message || '获取设备列表失败');
      }
    } catch (err) {
      console.error('获取设备列表错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 检测登录状态和设备绑定状态
  const checkAuthAndDevice = useCallback(() => {
    console.log('MyDevicesScreen: 检测登录和设备绑定状态', {
      isAuthenticated: mobileAuthService.isAuthenticated,
      isDeviceBound: deviceService.isDeviceBound,
      clientId: deviceService.clientId,
      userId: deviceService.userId,
      currentUserId: mobileAuthService.user?.id,
    });

    // 先检查是否已登录
    if (!mobileAuthService.isAuthenticated) {
      setShowAuthBar(true);
      setLoading(false);
      setError('请先登录');
      setCurrentDevice(null);
      setAllDevices([]);
      return;
    }

    // 如果已登录，尝试恢复设备信息
    const currentUserId = mobileAuthService.user?.id;
    if (currentUserId) {
      const restored = deviceService.restoreDeviceByUserId(currentUserId);
      if (restored) {
        console.log(`✅ 为 user_id ${currentUserId} 恢复了设备信息`);
      }
    }

    // 再检查设备是否绑定（检查 client_id）
    if (!deviceService.isDeviceBound || !deviceService.clientId) {
      setShowBindDevice(true);
      setLoading(false);
      setError('设备未绑定，请先绑定设备');
      setCurrentDevice(null);
      setAllDevices([]);
      return;
    }

    // 已登录且已绑定，获取设备列表
    fetchDeviceList(true);
  }, [fetchDeviceList]);

  // 初始加载 - 每次进入页面时检测
  useEffect(() => {
    setLoading(true);
    checkAuthAndDevice();
  }, [checkAuthAndDevice]);

  // 每次页面获得焦点时重新检测登录和设备绑定状态
  useFocusEffect(
    useCallback(() => {
      // 每次进入页面时重新检测登录和设备绑定状态
      checkAuthAndDevice();
    }, [checkAuthAndDevice]),
  );

  // 下拉刷新处理
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDeviceList(false);
    setRefreshing(false);
  }, [fetchDeviceList]);

  const handleDeviceDetails = (deviceId: string) => {
    // TODO: Navigate to device details
    console.log('Device details:', deviceId);
  };

  const handlePauseSharing = (deviceId: string) => {
    // TODO: Implement pause sharing
    console.log('Pause sharing:', deviceId);
  };

  // 处理重试按钮点击 - 重新检测登录和设备绑定状态
  const handleRetry = () => {
    setLoading(true);
    checkAuthAndDevice();
  };

  // 如果正在加载，显示加载指示器
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.scrollContent, {justifyContent: 'center', alignItems: 'center', flex: 1}]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{marginTop: 16, color: theme.colors.onSurfaceVariant}}>
            正在加载设备信息...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 如果出错或没有设备，显示错误信息
  if (error || !currentDevice) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 未登录提示 - 显示在顶部 */}
        {!mobileAuthService.isAuthenticated && showAuthBar && (
          <CompactAuthBar
            isAuthenticated={mobileAuthService.isAuthenticated}
            onSignInPress={() => {
              setShowAuthBar(false);
              setShowAuth(true);
            }}
            onProfilePress={() => {}}
            onDismiss={() => setShowAuthBar(false)}
            customMessage="登录并绑定设备后可访问设备信息"
          />
        )}
        <View style={[styles.scrollContent, {justifyContent: 'center', alignItems: 'center', flex: 1, padding: 20}]}>
          <Text style={{color: theme.colors.error, textAlign: 'center', marginBottom: 16}}>
            {error || '无法获取设备信息'}
          </Text>
          <Button
            mode="contained"
            onPress={handleRetry}>
            重试
          </Button>
        </View>
        {/* 绑定设备弹窗 */}
        <BindDeviceSheet
          isVisible={showBindDevice}
          onClose={() => setShowBindDevice(false)}
          onSuccess={() => {
            // 绑定成功后重新检测状态并获取设备列表
            setShowBindDevice(false);
            checkAuthAndDevice();
          }}
        />
        {/* 登录弹窗 */}
        <MobileAuthSheet
          isVisible={showAuth}
          onClose={() => {
            setShowAuth(false);
            // 关闭后重新检测状态
            setTimeout(() => {
              checkAuthAndDevice();
            }, 100);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 未登录提示 - 显示在顶部 */}
      {!mobileAuthService.isAuthenticated && showAuthBar && (
        <CompactAuthBar
          isAuthenticated={mobileAuthService.isAuthenticated}
          onSignInPress={() => {
            setShowAuthBar(false);
            setShowAuth(true);
          }}
          onProfilePress={() => {}}
          onDismiss={() => setShowAuthBar(false)}
          customMessage={l10n.palsScreen.signInAndBindDevice}
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        {/* Device Card */}
        <DeviceCard
          device={currentDevice}
          onDetailsPress={() => handleDeviceDetails(currentDevice.id)}
          onPausePress={() => handlePauseSharing(currentDevice.id)}
        />

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={setSelectedTab}
            buttons={[
              {
                value: 'monitoring',
                label: '设备监控',
              },
              {
                value: 'history',
                label: '历史设备',
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Tab Content */}
        {selectedTab === 'monitoring' ? (
          <DeviceMonitoringTab 
            device={currentDevice} 
            deviceApiData={currentDevice?.apiData}
            allDevices={allDevices}
            onDeviceChange={(newDevice) => {
              setCurrentDevice(newDevice);
            }}
          />
        ) : (
          <DeviceHistoryTab 
            devices={allDevices} 
          />
        )}
      </ScrollView>
      {/* 绑定设备弹窗 */}
      <BindDeviceSheet
        isVisible={showBindDevice}
        onClose={() => setShowBindDevice(false)}
        onSuccess={() => {
          // 绑定成功后重新获取设备列表
          setShowBindDevice(false);
          fetchDeviceList(true);
        }}
      />
      {/* 登录弹窗 */}
      <MobileAuthSheet
        isVisible={showAuth}
        onClose={() => setShowAuth(false)}
      />
    </SafeAreaView>
  );
});





