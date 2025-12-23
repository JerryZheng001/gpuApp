import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Text, Card, Divider} from 'react-native-paper';
import {useTheme} from '../../../hooks';
import {Theme} from '../../../utils/types';
import {ChevronRightIcon} from '../../../assets/icons';

interface Device {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'paused' | 'offline';
  currentCompute: string;
  cumulativeDuration: string;
  cumulativeRevenue: string;
}

interface DeviceHistoryTabProps {
  devices: Device[];
}

export const DeviceHistoryTab: React.FC<DeviceHistoryTabProps> = ({
  devices,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4CAF50';
      case 'paused':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'paused':
        return '已暂停';
      case 'offline':
        return '离线';
      default:
        return '未知';
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        {devices.map((device, index) => (
          <View key={device.id}>
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => {
                // TODO: Navigate to device details
                console.log('Device details:', device.id);
              }}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceHeader}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: getStatusColor(device.status) + '20'},
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getStatusColor(device.status)},
                      ]}>
                      {getStatusText(device.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.deviceModel}>型号: {device.model}</Text>
                <View style={styles.deviceMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>内存占用</Text>
                    <Text style={styles.metricValue}>
                      {device.currentCompute}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>累计时长</Text>
                    <Text style={styles.metricValue}>
                      {device.cumulativeDuration}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>健康状态</Text>
                    <Text style={[styles.metricValue, styles.revenueValue]}>
                      {device.cumulativeRevenue}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRightIcon
                width={20}
                height={20}
                stroke={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            {index < devices.length - 1 && (
              <Divider style={styles.divider} />
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    content: {
      padding: 0,
    },
    deviceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginLeft: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '500',
    },
    deviceModel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    deviceMetrics: {
      flexDirection: 'row',
      gap: 16,
    },
    metricItem: {
      gap: 4,
    },
    metricLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    revenueValue: {
      color: theme.colors.primary,
    },
    divider: {
      marginLeft: 16,
    },
  });





