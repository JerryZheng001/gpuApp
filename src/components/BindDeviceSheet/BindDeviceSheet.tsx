import React, {useState} from 'react';
import {View, Alert} from 'react-native';

import {observer} from 'mobx-react-lite';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text, Button, TextInput, ActivityIndicator} from 'react-native-paper';

import {useTheme} from '../../hooks';
import {Sheet} from '../Sheet';
import {createStyles} from './styles';
import {deviceService} from '../../services/device';
import {mobileAuthService} from '../../services/mobile-auth';

interface BindDeviceSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BindDeviceSheet: React.FC<BindDeviceSheetProps> = observer(
  ({isVisible, onClose, onSuccess}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme);

    const [deviceName, setDeviceName] = useState('');

    const handleBind = async () => {
      if (!deviceName.trim()) {
        Alert.alert('提示', '请输入设备名称');
        return;
      }

      // 获取用户 ID
      const userId = mobileAuthService.user?.id;
      if (!userId) {
        Alert.alert('错误', '请先登录');
        return;
      }

      const response = await deviceService.bindDevice(userId, deviceName.trim());

      if (response.success) {
        Alert.alert('成功', '设备绑定成功', [
          {
            text: '确定',
            onPress: () => {
              setDeviceName('');
              onClose();
              onSuccess?.();
            },
          },
        ]);
      } else {
        Alert.alert('绑定失败', response.message || '请稍后重试');
      }
    };

    const handleClose = () => {
      setDeviceName('');
      deviceService.clearError();
      onClose();
    };

    return (
      <Sheet
        title="绑定设备"
        isVisible={isVisible}
        onClose={handleClose}
        snapPoints={['50%']}>
        <Sheet.ScrollView
          contentContainerStyle={[
            styles.container,
            {paddingBottom: insets.bottom + 16},
          ]}>
          {/* 加载指示器 */}
          {deviceService.isBinding && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>绑定中...</Text>
            </View>
          )}

          {/* 错误信息 */}
          {deviceService.error && (
            <Text style={styles.errorText}>{deviceService.error}</Text>
          )}

          {/* 表单 */}
          <View style={styles.form}>
            <Text style={styles.description}>
              首次分享需要绑定设备，请为您的设备起一个名称，方便识别管理。
            </Text>

            <TextInput
              label="设备名称"
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="如：我的手机、工作机等"
              style={styles.input}
              mode="outlined"
              disabled={deviceService.isBinding}
              maxLength={20}
            />

            <Button
              mode="contained"
              onPress={handleBind}
              loading={deviceService.isBinding}
              disabled={deviceService.isBinding || !deviceName.trim()}
              style={styles.bindButton}
              contentStyle={styles.buttonContent}>
              确认绑定
            </Button>
          </View>
        </Sheet.ScrollView>
      </Sheet>
    );
  },
);

