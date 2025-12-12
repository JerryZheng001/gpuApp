import React, {useContext, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Text, Card, Button, Menu} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {
  ChevronDownIcon,
} from '../../assets/icons';

// Mock data
const mockBills = [
  {
    period: '2024-05-01 至 2024-05-15',
    deviceName: '我的iPhone 14',
    revenue: '¥25.70',
    status: '已结算',
    statusColor: '#4CAF50',
  },
  {
    period: '2024-05-16 至 2024-05-20',
    deviceName: '我的iPhone 14',
    revenue: '¥2.80',
    status: '待结算',
    statusColor: '#FFC107',
  },
  {
    period: '2024-04-01 至 2024-04-30',
    deviceName: '我的iPhone 14',
    revenue: '¥99.00',
    status: '已结算',
    statusColor: '#4CAF50',
  },
];

export const RevenueBillScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);

  const [deviceMenuVisible, setDeviceMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('全部设备');
  const [selectedTime, setSelectedTime] = useState('本月');
  const [selectedStatus, setSelectedStatus] = useState('全部');

  const handleWithdraw = () => {
    // TODO: Implement withdraw functionality
    console.log('Withdraw');
  };

  const withdrawableAmount = '¥119.80';
  const cumulativeIncome = '¥128.50';
  const monthlyIncome = '¥36.20';
  const pendingIncome = '¥8.70';

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
                setSelectedTime('本月');
                setTimeMenuVisible(false);
              }}
              title="本月"
            />
            <Menu.Item
              onPress={() => {
                setSelectedTime('上月');
                setTimeMenuVisible(false);
              }}
              title="上月"
            />
            <Menu.Item
              onPress={() => {
                setSelectedTime('全部');
                setTimeMenuVisible(false);
              }}
              title="全部"
            />
          </Menu>

          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setStatusMenuVisible(true)}>
                <Text style={styles.filterButtonText}>{selectedStatus}</Text>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  stroke={theme.colors.onSurface}
                />
              </TouchableOpacity>
            }>
            <Menu.Item
              onPress={() => {
                setSelectedStatus('全部');
                setStatusMenuVisible(false);
              }}
              title="全部"
            />
            <Menu.Item
              onPress={() => {
                setSelectedStatus('已结算');
                setStatusMenuVisible(false);
              }}
              title="已结算"
            />
            <Menu.Item
              onPress={() => {
                setSelectedStatus('待结算');
                setStatusMenuVisible(false);
              }}
              title="待结算"
            />
          </Menu>
        </View>

        {/* Withdrawable Amount Card */}
        <Card style={styles.withdrawCard}>
          <Card.Content style={styles.withdrawContent}>
            <View style={styles.withdrawLeft}>
              <Text style={styles.withdrawLabel}>可提现金额</Text>
              <Text style={styles.withdrawAmount}>{withdrawableAmount}</Text>
            </View>
            <Button
              mode="contained"
              onPress={handleWithdraw}
              style={styles.withdrawButton}
              buttonColor="#FF9800"
              textColor="#FFFFFF">
              立即提现
            </Button>
          </Card.Content>
        </Card>

        {/* Statistics */}
        <View style={styles.statisticsContainer}>
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>累计收益</Text>
            <Text style={styles.statisticValue}>{cumulativeIncome}</Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>本月收益</Text>
            <Text style={styles.statisticValue}>{monthlyIncome}</Text>
          </View>
          <View style={styles.statisticItem}>
            <Text style={styles.statisticLabel}>待结算收益</Text>
            <Text style={styles.statisticValue}>{pendingIncome}</Text>
          </View>
        </View>

        {/* Bill List */}
        <Card style={styles.billListCard}>
          <Card.Content style={styles.billListContent}>
            {/* Table Header */}
            <View style={styles.billHeader}>
              <Text
                style={[styles.billHeaderText, styles.billColPeriod]}
                numberOfLines={1}
                ellipsizeMode="tail">
                账单周期
              </Text>
              <Text
                style={[styles.billHeaderText, styles.billColDevice]}
                numberOfLines={1}
                ellipsizeMode="tail">
                设备名称
              </Text>
              <Text
                style={[styles.billHeaderText, styles.billColRevenue]}
                numberOfLines={1}
                ellipsizeMode="tail">
                收益
              </Text>
              <Text
                style={[styles.billHeaderText, styles.billColStatus]}
                numberOfLines={1}
                ellipsizeMode="tail">
                状态
              </Text>
            </View>

            {/* Bill Rows */}
            {mockBills.map((bill, index) => (
              <View key={index} style={styles.billRow}>
                <Text
                  style={[styles.billCell, styles.billColPeriod]}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {bill.period}
                </Text>
                <Text
                  style={[styles.billCell, styles.billColDevice]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {bill.deviceName}
                </Text>
                <Text
                  style={[
                    styles.billCell,
                    styles.billColRevenue,
                    styles.revenueText,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {bill.revenue}
                </Text>
                <View style={styles.billColStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: bill.statusColor + '20'},
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: bill.statusColor},
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {bill.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
});

