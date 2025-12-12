import React, {useState} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, Card, Button, Menu} from 'react-native-paper';
import {useTheme} from '../../../hooks';
import {Theme} from '../../../utils/types';
import {
  ChevronDownIcon,
} from '../../../assets/icons';

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
}

// Mock monitoring data
const mockMonitoringData = {
  onlineStatus: '正常',
  currentConnections: 3,
  cpuUsage: 78,
  networkLatency: 18,
  cpuTrend: [
    {date: '5/14', value: 65},
    {date: '5/15', value: 72},
    {date: '5/16', value: 58},
    {date: '5/17', value: 80},
    {date: '5/18', value: 75},
    {date: '5/19', value: 68},
    {date: '5/20', value: 78},
  ],
};

export const DeviceMonitoringTab: React.FC<DeviceMonitoringTabProps> = ({
  device,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [deviceMenuVisible, setDeviceMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('全部设备');
  const [selectedTime, setSelectedTime] = useState('今日');
  const [viewMode, setViewMode] = useState<'cpu' | 'memory'>('cpu');

  // Simple line chart rendering (simplified version)
  const renderChart = () => {
    const {width} = Dimensions.get('window');
    const chartWidth = width - 96; // padding and y-axis
    const chartHeight = 200;
    const maxValue = 100;
    const data = mockMonitoringData.cpuTrend;

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * chartWidth;
      const y = chartHeight - (item.value / maxValue) * chartHeight;
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
                  top: (value / maxValue) * chartHeight,
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
          anchor={
            <Button
              mode="outlined"
              onPress={() => setDeviceMenuVisible(true)}
              style={styles.filterButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={styles.filterButtonLabel}>
              {selectedDevice}
              <ChevronDownIcon
                width={16}
                height={16}
                stroke={theme.colors.onSurface}
              />
            </Button>
          }>
          <Menu.Item
            onPress={() => {
              setSelectedDevice('全部设备');
              setDeviceMenuVisible(false);
            }}
            title="全部设备"
          />
          <Menu.Item
            onPress={() => {
              setSelectedDevice(device.name);
              setDeviceMenuVisible(false);
            }}
            title={device.name}
          />
        </Menu>

        <Menu
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
        </Menu>
      </View>

      {/* Summary Metrics Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>在线状态</Text>
              <Text style={[styles.summaryValue, styles.statusNormal]}>
                {mockMonitoringData.onlineStatus}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>当前连接数</Text>
              <Text style={styles.summaryValue}>
                {mockMonitoringData.currentConnections}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CPU使用率</Text>
              <Text style={styles.summaryValue}>
                {mockMonitoringData.cpuUsage}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>网络延迟</Text>
              <Text style={styles.summaryValue}>
                {mockMonitoringData.networkLatency}ms
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* CPU Usage Trend Card */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {selectedTime}CPU使用率趋势
            </Text>
            <Button
              mode="text"
              onPress={() =>
                setViewMode(viewMode === 'cpu' ? 'memory' : 'cpu')
              }
              textColor={theme.colors.primary}
              style={styles.switchButton}>
              切换至内存
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

