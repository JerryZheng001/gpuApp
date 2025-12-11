import React, {useContext, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Text, Card, Button, Menu, Divider} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {
  ChevronDownIcon,
  DownloadIcon,
} from '../../assets/icons';

// Mock data
const mockData = [
  {
    date: '2024-05-20',
    deviceName: '我的iPhone 14',
    shareDuration: '8:30',
    computeOccupancy: '128 GB·小时',
    revenue: '¥2.80',
  },
  {
    date: '2024-05-20',
    deviceName: '家用安卓平板',
    shareDuration: '0:00',
    computeOccupancy: '0 GB·小时',
    revenue: '¥0.00',
  },
  {
    date: '2024-05-19',
    deviceName: '我的iPhone 14',
    shareDuration: '10:15',
    computeOccupancy: '156 GB·小时',
    revenue: '¥3.50',
  },
];

export const ShareMeteringScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);

  const [deviceMenuVisible, setDeviceMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('全部设备');
  const [selectedTime, setSelectedTime] = useState('今日');

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  // Calculate summary
  const totalShareDuration = '8:30';
  const totalComputeOccupancy = '128 GB·小时';
  const totalRevenue = '¥2.80';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <Menu
            visible={deviceMenuVisible}
            onDismiss={() => setDeviceMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setDeviceMenuVisible(true)}>
                <Text style={styles.filterButtonText}>{selectedDevice}</Text>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  stroke={theme.colors.onSurface}
                />
              </TouchableOpacity>
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
                setSelectedDevice('我的iPhone 14');
                setDeviceMenuVisible(false);
              }}
              title="我的iPhone 14"
            />
            <Menu.Item
              onPress={() => {
                setSelectedDevice('家用安卓平板');
                setDeviceMenuVisible(false);
              }}
              title="家用安卓平板"
            />
          </Menu>

          <Menu
            visible={timeMenuVisible}
            onDismiss={() => setTimeMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setTimeMenuVisible(true)}>
                <Text style={styles.filterButtonText}>{selectedTime}</Text>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  stroke={theme.colors.onSurface}
                />
              </TouchableOpacity>
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

        {/* Data Table */}
        <Card style={styles.tableCard}>
          <Card.Content style={styles.tableContent}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text
                style={[styles.tableHeaderText, styles.colDate]}
                numberOfLines={1}
                ellipsizeMode="tail">
                日期
              </Text>
              <Text
                style={[styles.tableHeaderText, styles.colDevice]}
                numberOfLines={1}
                ellipsizeMode="tail">
                设备名称
              </Text>
              <Text
                style={[styles.tableHeaderText, styles.colDuration]}
                numberOfLines={1}
                ellipsizeMode="tail">
                分享时长
              </Text>
              <Text
                style={[styles.tableHeaderText, styles.colCompute]}
                numberOfLines={1}
                ellipsizeMode="tail">
                算力占用
              </Text>
              <Text
                style={[styles.tableHeaderText, styles.colRevenue]}
                numberOfLines={1}
                ellipsizeMode="tail">
                收益
              </Text>
            </View>

            <Divider style={styles.tableDivider} />

            {/* Table Rows */}
            {mockData.map((row, index) => (
              <View key={index}>
                <View style={styles.tableRow}>
                  <Text
                    style={[styles.tableCell, styles.colDate]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.date}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colDevice]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.deviceName}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colDuration]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.shareDuration}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCompute]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.computeOccupancy}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colRevenue,
                      styles.revenueText,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.revenue}
                  </Text>
                </View>
                {index < mockData.length - 1 && (
                  <Divider style={styles.rowDivider} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>数据汇总 ({selectedTime})</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>总分享时长</Text>
                <Text style={styles.summaryValue}>{totalShareDuration}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>总算力占用</Text>
                <Text style={styles.summaryValue}>
                  {totalComputeOccupancy}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>总收益</Text>
                <Text style={[styles.summaryValue, styles.revenueText]}>
                  {totalRevenue}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}>
              <DownloadIcon
                width={16}
                height={16}
                stroke={theme.colors.primary}
              />
              <Text style={styles.exportButtonText}>导出数据</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
});

