import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, Dimensions, TouchableOpacity, Animated} from 'react-native';
import {Text, Card, Button, Menu} from 'react-native-paper';
import {useTheme} from '../../../hooks';
import {Theme} from '../../../utils/types';
import {
  ChevronDownIcon,
} from '../../../assets/icons';
import {deviceService, ClientMonitorData} from '../../../services/device/DeviceService';

interface Device {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'paused' | 'offline';
  currentCompute: string;
  cumulativeDuration: string;
  cumulativeRevenue: string;
}

interface DeviceMonitoringTabProps {
  device: Device;
  // 可选的 API 原始数据，用于显示更详细的监控信息
  deviceApiData?: {
    cpu_usage: number;
    memory_usage: number;
    storage_usage: number;
    health: number;
    client_status: string;
  };
  // 所有设备列表，用于设备选择器
  allDevices?: Device[];
  // 设备切换回调
  onDeviceChange?: (device: Device) => void;
}

// 生成模拟的 CPU 趋势数据（如果 API 没有提供历史数据）
const generateMockCpuTrend = (currentCpuUsage: number): Array<{date: string; value: number}> => {
  const trend: Array<{date: string; value: number}> = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // 生成围绕当前 CPU 使用率的随机值
    const value = Math.max(0, Math.min(100, currentCpuUsage + (Math.random() - 0.5) * 20));
    trend.push({
      date: `${month}/${day}`,
      value: Math.round(value),
    });
  }
  return trend;
};

export const DeviceMonitoringTab: React.FC<DeviceMonitoringTabProps> = ({
  device,
  deviceApiData,
  allDevices = [],
  onDeviceChange,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [deviceMenuVisible, setDeviceMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  // 默认显示当前设备的名称（不显示"全部设备"）
  const [selectedDevice, setSelectedDevice] = useState(device?.name || '');
  const [selectedTime, setSelectedTime] = useState('今日');
  const [viewMode, setViewMode] = useState<'cpu' | 'memory'>('cpu');
  const [monitorData, setMonitorData] = useState<ClientMonitorData[]>([]);
  const [loading, setLoading] = useState(false);

  // 箭头旋转动画
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: deviceMenuVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [deviceMenuVisible, rotateAnim]);
  
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // 当 device 变化时更新 selectedDevice
  React.useEffect(() => {
    if (device?.name) {
      setSelectedDevice(device.name);
    }
  }, [device?.name]);

  // 获取监控数据
  const fetchMonitorData = useCallback(async () => {
    if (!deviceService.isDeviceBound || !deviceService.userId) {
      console.log('设备未绑定或用户ID未设置');
      return;
    }

    setLoading(true);
    try {
      const response = await deviceService.getClientMonitor(
        deviceService.userId || undefined,
        device?.id || undefined,
      );

      console.log('监控数据响应:', response);

      if (response.success && response.data) {
        console.log('设置监控数据:', response.data);
        setMonitorData(response.data);
      } else {
        console.warn('获取监控数据失败:', response.message);
      }
    } catch (error) {
      console.error('获取监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [device?.id]);

  // 组件挂载和设备变化时获取数据
  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  // 使用 API 数据或设备数据
  const cpuUsage = deviceApiData?.cpu_usage ?? 0;
  const memoryUsage = deviceApiData?.memory_usage ?? 0;
  
  // 判断在线状态：online = 正常，offline = 离线，其他 = 异常
  const getOnlineStatus = () => {
    const status = deviceApiData?.client_status;
    if (status === 'online') {
      return { text: '正常', isNormal: true };
    } else if (status === 'offline') {
      return { text: '离线', isNormal: false };
    } else {
      // 如果没有状态信息，根据设备状态判断
      if (device?.status === 'running') {
        return { text: '正常', isNormal: true };
      } else if (device?.status === 'offline') {
        return { text: '离线', isNormal: false };
      }
      return { text: '异常', isNormal: false };
    }
  };
  
  const onlineStatus = getOnlineStatus();
  
  // 将监控数据转换为图表格式
  const convertMonitorDataToTrend = (data: ClientMonitorData[], type: 'cpu' | 'memory'): Array<{date: string; value: number}> => {
    console.log('开始转换监控数据:', { 
      hasData: !!data, 
      dataLength: data?.length || 0, 
      type,
      monitorData: data,
      cpuUsage,
      memoryUsage
    });

    if (!data || data.length === 0) {
      console.log('⚠️ 没有监控数据，使用模拟数据');
      // 如果没有数据，使用模拟数据
      const currentValue = type === 'cpu' ? cpuUsage : memoryUsage;
      console.log('使用当前值生成模拟数据:', { currentValue, type, cpuUsage, memoryUsage });
      if (currentValue === 0) {
        console.warn('⚠️ 当前值为0，可能数据未正确获取');
      }
      return generateMockCpuTrend(currentValue);
    }

    console.log('使用真实监控数据，数据项数量:', data.length);

    const converted = data
      .filter(item => item.date != null && item.date !== '') // 过滤掉日期为空的数据
      .sort((a, b) => {
        // 确保日期正确排序
        const dateA = new Date(a.date + 'T00:00:00').getTime();
        const dateB = new Date(b.date + 'T00:00:00').getTime();
        return dateA - dateB;
      })
      .map(item => {
        // 解析日期字符串 (格式: "2025-12-22")
        // 添加安全检查，确保 date 不为 null
        if (!item.date || typeof item.date !== 'string') {
          console.warn('⚠️ 日期数据无效:', item);
          return null;
        }
        const dateParts = item.date.split('-');
        if (dateParts.length !== 3) {
          console.warn('⚠️ 日期格式不正确:', item.date);
          return null;
        }
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const day = parseInt(dateParts[2], 10);
        
        const rawValue = type === 'cpu' 
          ? item.avg_cpu_usage 
          : item.avg_memory_usage;
        const value = Math.round(rawValue || 0);
        
        console.log('转换数据项:', { 
          originalDate: item.date, 
          month,
          day, 
          formattedDate: `${month}/${day}`,
          rawValue: rawValue,
          roundedValue: value,
          type,
          avg_cpu_usage: item.avg_cpu_usage,
          avg_memory_usage: item.avg_memory_usage
        });
        
        return {
          date: `${month}/${day}`,
          value: value,
        };
      })
      .filter((item): item is {date: string; value: number} => item !== null); // 过滤掉 null 值

    console.log('转换后的数据:', converted);
    return converted;
  };

  const cpuTrend = convertMonitorDataToTrend(monitorData, 'cpu');
  const memoryTrend = convertMonitorDataToTrend(monitorData, 'memory');
  
  console.log('最终趋势数据:', { 
    cpuTrend, 
    memoryTrend, 
    monitorDataLength: monitorData.length,
    currentViewMode: viewMode 
  });

  // Simple line chart rendering (simplified version)
  const renderChart = () => {
    const {width} = Dimensions.get('window');
    const chartWidth = width - 96; // padding and y-axis
    const chartHeight = 200;
    const maxValue = 100;
    const data = viewMode === 'cpu' ? cpuTrend : memoryTrend;

    console.log('渲染图表:', { 
      viewMode, 
      dataLength: data.length, 
      dataPoints: data,
      firstPoint: data[0],
      lastPoint: data[data.length - 1]
    });

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * chartWidth;
      const y = chartHeight - (item.value / maxValue) * chartHeight;
      console.log(`数据点 ${index}:`, { 
        date: item.date, 
        value: item.value, 
        x, 
        y,
        calculatedY: chartHeight - (item.value / maxValue) * chartHeight
      });
      return {x, y, value: item.value, date: item.date};
    });

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[100, 80, 60, 40, 20, 0].map(value => (
            <Text key={value} style={styles.yAxisLabel}>
              {value}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[100, 80, 60, 40, 20, 0].map((value) => (
            <View
              key={value}
              style={[
                styles.gridLine,
                {
                  top: chartHeight - (value / maxValue) * chartHeight,
                },
              ]}
            />
          ))}

          {/* Line path - simplified rendering */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              const dx = point.x - prevPoint.x;
              const dy = point.y - prevPoint.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              
              return (
                <View key={index}>
                  <View
                    style={[
                      styles.lineSegment,
                      {
                        left: prevPoint.x,
                        top: prevPoint.y,
                        width: length,
                        transform: [{rotate: `${angle}deg`}],
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        left: point.x - 4,
                        top: point.y - 4,
                      },
                    ]}
                  />
                </View>
              );
            })}
            {/* First point */}
            {points.length > 0 && (
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: points[0].x - 4,
                    top: points[0].y - 4,
                  },
                ]}
              />
            )}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {data.map((item, index) => (
              <Text key={index} style={styles.xAxisLabel}>
                {item.date}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <Menu
          visible={deviceMenuVisible}
          onDismiss={() => setDeviceMenuVisible(false)}
          anchorPosition="bottom"
          anchor={
            <TouchableOpacity
              onPress={() => setDeviceMenuVisible(true)}
              style={[
                styles.deviceSelectorButton,
                deviceMenuVisible && styles.deviceSelectorButtonActive,
              ]}
              activeOpacity={0.7}>
              <View style={styles.deviceSelectorContent}>
                <Text 
                  style={styles.deviceSelectorText} 
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {selectedDevice || device?.name || '选择设备'}
                </Text>
                <Animated.View
                  style={[
                    styles.chevronContainer,
                    { transform: [{ rotate: rotateInterpolate }] },
                  ]}>
                  <ChevronDownIcon
                    width={10}
                    height={18}
                    stroke={deviceMenuVisible ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
          style={styles.menu}>
          {allDevices.map((dev, index) => (
            <Menu.Item
              key={dev.id}
              onPress={() => {
                setSelectedDevice(dev.name);
                setDeviceMenuVisible(false);
                // 通知父组件切换设备
                if (onDeviceChange) {
                  onDeviceChange(dev);
                }
              }}
              title={dev.name}
              titleStyle={[
                styles.menuItemText,
                selectedDevice === dev.name && styles.menuItemSelected,
              ]}
              style={[
                styles.menuItemContainer,
                selectedDevice === dev.name && styles.menuItemActive,
              ]}
            />
          ))}
        </Menu>

        {/* <Menu
          visible={timeMenuVisible}
          onDismiss={() => setTimeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setTimeMenuVisible(true)}
              style={styles.filterButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={styles.filterButtonLabel}>
              {selectedTime}
              <ChevronDownIcon
                width={16}
                height={16}
                stroke={theme.colors.onSurface}
              />
            </Button>
          }>
          <Menu.Item
            onPress={() => {
              setSelectedTime('今日');
              setTimeMenuVisible(false);
            }}
            title="今日"
          />
          <Menu.Item
            onPress={() => {
              setSelectedTime('本周');
              setTimeMenuVisible(false);
            }}
            title="本周"
          />
          <Menu.Item
            onPress={() => {
              setSelectedTime('本月');
              setTimeMenuVisible(false);
            }}
            title="本月"
          />
        </Menu> */}
      </View>

      {/* Summary Metrics Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>在线状态</Text>
              <Text style={[styles.summaryValue, onlineStatus.isNormal ? styles.statusNormal : styles.statusError]}>
                {onlineStatus.text}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CPU使用率</Text>
              <Text style={styles.summaryValue}>
                {cpuUsage}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>内存使用率</Text>
              <Text style={styles.summaryValue}>
                {memoryUsage}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>健康度</Text>
              <Text style={[styles.summaryValue, styles.statusNormal]}>
                {deviceApiData?.health ?? 0}%
              </Text>
            </View>
            {/* <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>网络延迟</Text>
              <Text style={styles.summaryValue}>
                {mockMonitoringData.networkLatency}ms
              </Text>
            </View> */}
          </View>
        </Card.Content>
      </Card>

      {/* CPU Usage Trend Card */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {viewMode === 'cpu' ? 'CPU' : '内存'}使用率趋势
            </Text>
            <Button
              mode="text"
              onPress={() =>
                setViewMode(viewMode === 'cpu' ? 'memory' : 'cpu')
              }
              textColor={theme.colors.primary}
              style={styles.switchButton}>
              {viewMode === 'cpu' ? '切换至内存' : '切换至CPU'}
            </Button>
          </View>
          {renderChart()}
        </Card.Content>
      </Card>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    filterContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
      alignItems: 'flex-start',
    },
    filterButton: {
      flex: 1,
    },
    filterButtonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterButtonLabel: {
      fontSize: 14,
    },
    deviceSelectorButton: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      minHeight: 44,
      overflow: 'hidden',
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    deviceSelectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    deviceSelectorText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginRight: 12,
      maxWidth: 200,
    },
    deviceSelectorButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer + '15',
    },
    chevronContainer: {
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    menu: {
      marginTop: 8,
      borderRadius: 0,
      elevation: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      backgroundColor: 'transparent',
    },
    menuContent: {
      borderRadius: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
      minWidth: 160,
      maxWidth: 300,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    menuItemText: {
      fontSize: 15,
      fontWeight: '400',
      color: theme.colors.onSurface,
    },
    menuItemSelected: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    menuItemActive: {
      backgroundColor: theme.colors.primaryContainer + '30',
    },
    menuItemContainer: {
      backgroundColor: 'transparent',
      borderRadius: 4,
      marginHorizontal: 4,
      marginVertical: 2,
    },
    summaryCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    summaryItem: {
      width: '48%',
      gap: 8,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusNormal: {
      color: '#4CAF50',
    },
    statusError: {
      color: '#F44336',
    },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    switchButton: {
      margin: 0,
    },
    chartContainer: {
      flexDirection: 'row',
      height: 240,
    },
    yAxis: {
      width: 30,
      justifyContent: 'space-between',
      paddingRight: 8,
    },
    yAxisLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    chartArea: {
      flex: 1,
      position: 'relative',
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outlineVariant,
      opacity: 0.3,
    },
    lineContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 30,
    },
    dataPoint: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    lineSegment: {
      position: 'absolute',
      backgroundColor: theme.colors.primary,
    },
    xAxis: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    xAxisLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
  });

