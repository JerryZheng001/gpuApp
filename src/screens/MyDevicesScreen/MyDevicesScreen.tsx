import React, {useContext, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {Text, Card, Button, SegmentedButtons} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {DeviceCard} from './components/DeviceCard';
import {DeviceMonitoringTab} from './components/DeviceMonitoringTab';
import {DeviceHistoryTab} from './components/DeviceHistoryTab';

// Mock device data
const mockCurrentDevice = {
  id: '1',
  name: '我的iPhone 14',
  model: 'iPhone 14 Pro',
  status: 'running', // running, paused, offline
  currentCompute: '8核16G',
  cumulativeDuration: '128小时',
  cumulativeRevenue: '¥28.50',
};

const mockHistoryDevices = [
  {
    id: '2',
    name: '家用安卓平板',
    model: 'Samsung Galaxy Tab S8',
    status: 'offline',
    currentCompute: '4核8G',
    cumulativeDuration: '45小时',
    cumulativeRevenue: '¥12.30',
  },
  {
    id: '3',
    name: 'MacBook Pro',
    model: 'MacBook Pro 16"',
    status: 'paused',
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

  const handleDeviceDetails = (deviceId: string) => {
    // TODO: Navigate to device details
    console.log('Device details:', deviceId);
  };

  const handlePauseSharing = (deviceId: string) => {
    // TODO: Implement pause sharing
    console.log('Pause sharing:', deviceId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Device Card */}
        <DeviceCard
          device={mockCurrentDevice}
          onDetailsPress={() => handleDeviceDetails(mockCurrentDevice.id)}
          onPausePress={() => handlePauseSharing(mockCurrentDevice.id)}
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
          <DeviceMonitoringTab device={mockCurrentDevice} />
        ) : (
          <DeviceHistoryTab devices={mockHistoryDevices} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
});




