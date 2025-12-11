import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Text, Card} from 'react-native-paper';
import {Theme} from '../../../utils/types';
import {useTheme} from '../../../hooks';

interface Device {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'paused' | 'offline';
  currentCompute: string;
  cumulativeDuration: string;
  cumulativeRevenue: string;
}

interface DeviceCardProps {
  device: Device;
  onDetailsPress: () => void;
  onPausePress: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onDetailsPress,
  onPausePress,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const getStatusColor = () => {
    switch (device.status) {
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

  const getStatusText = () => {
    switch (device.status) {
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceModel}>型号: {device.model}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor() + '20'},
            ]}>
            <Text style={[styles.statusText, {color: getStatusColor()}]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>当前算力</Text>
            <Text style={styles.metricValue}>{device.currentCompute}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>累计时长</Text>
            <Text style={styles.metricValue}>{device.cumulativeDuration}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>累计收益</Text>
            <Text style={[styles.metricValue, styles.revenueValue]}>
              {device.cumulativeRevenue}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onDetailsPress}>
            <Text style={styles.detailsLink}>详情</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={onPausePress}>
            <Text style={styles.pauseButtonText}>暂停分享</Text>
          </TouchableOpacity>
        </View>
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
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    headerLeft: {
      flex: 1,
    },
    deviceName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    deviceModel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    metrics: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    metricItem: {
      flex: 1,
      gap: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    revenueValue: {
      color: theme.colors.primary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 16,
    },
    detailsLink: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    pauseButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    pauseButtonText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
  });





