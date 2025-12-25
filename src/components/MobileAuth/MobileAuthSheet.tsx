import React, {useState, useEffect} from 'react';
import {View, Alert} from 'react-native';

import {observer} from 'mobx-react-lite';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text, Button, TextInput, ActivityIndicator} from 'react-native-paper';

import {useTheme} from '../../hooks';
import {Sheet} from '../Sheet';
import {createStyles} from './styles';
import {mobileAuthService} from '../../services/mobile-auth';

interface MobileAuthSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export const MobileAuthSheet: React.FC<MobileAuthSheetProps> = observer(
  ({isVisible, onClose}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme);

    const [phoneNumber, setPhoneNumber] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [affCode, setAffCode] = useState('');
    const [showAffCode, setShowAffCode] = useState(false);

    const authState = mobileAuthService.authState;

    // 登录成功后自动关闭
    useEffect(() => {
      if (authState.isAuthenticated && isVisible) {
        Alert.alert('登录成功', '欢迎回来！', [{text: '确定', onPress: onClose}]);
      }
    }, [authState.isAuthenticated, isVisible, onClose]);

    // 发送验证码
    const handleSendCode = async () => {
      if (!phoneNumber.trim()) {
        Alert.alert('提示', '请输入手机号');
        return;
      }

      // 简单的手机号格式验证
      if (!/^1[3-9]\d{9}$/.test(phoneNumber.trim())) {
        Alert.alert('提示', '请输入正确的手机号格式');
        return;
      }

      const response = await mobileAuthService.sendCode(phoneNumber.trim());
      if (response.success) {
        Alert.alert('成功', '验证码已发送，请注意查收短信');
      } else {
        Alert.alert('发送失败', response.message);
      }
    };

    // 登录/注册
    const handleSignIn = async () => {
      if (!phoneNumber.trim()) {
        Alert.alert('提示', '请输入手机号');
        return;
      }

      if (!verifyCode.trim()) {
        Alert.alert('提示', '请输入验证码');
        return;
      }

      if (verifyCode.trim().length !== 6) {
        Alert.alert('提示', '验证码为6位数字');
        return;
      }

      mobileAuthService.clearError();
      const response = await mobileAuthService.signInWithPhone(
        phoneNumber.trim(),
        verifyCode.trim(),
        affCode.trim() || undefined,
      );

      if (!response.success) {
        Alert.alert('登录失败', response.message);
      }
    };

    // 重置表单
    const resetForm = () => {
      setPhoneNumber('');
      setVerifyCode('');
      setAffCode('');
      setShowAffCode(false);
      mobileAuthService.clearError();
    };

    const handleClose = () => {
      resetForm();
      onClose();
    };

    // 获取发送按钮文本
    const getSendButtonText = () => {
      if (authState.codeSending) {
        return '发送中...';
      }
      if (authState.countdown > 0) {
        return `${authState.countdown}s 后重发`;
      }
      return '获取验证码';
    };

    return (
      <Sheet
        title="手机号登录"
        isVisible={isVisible}
        onClose={handleClose}
        snapPoints={['70%']}>
        <Sheet.ScrollView
          contentContainerStyle={[
            styles.container,
            {paddingBottom: insets.bottom + 16},
          ]}>
          {/* 加载指示器 */}
          {authState.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>登录中...</Text>
            </View>
          )}

          {/* 错误信息 */}
          {authState.error && (
            <Text style={styles.errorText}>{authState.error}</Text>
          )}

          {/* 登录表单 */}
          <View style={styles.form}>
            {/* 手机号输入 */}
            <TextInput
              testID="phone-input"
              label="手机号"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={11}
              style={styles.input}
              mode="outlined"
              disabled={authState.isLoading}
              left={<TextInput.Affix text="+86" />}
            />

            {/* 验证码输入 + 发送按钮 */}
            <View style={styles.codeRow}>
              <TextInput
                testID="code-input"
                label="验证码"
                value={verifyCode}
                onChangeText={setVerifyCode}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.codeInput}
                mode="outlined"
                disabled={authState.isLoading}
              />
              <Button
                mode="outlined"
                onPress={handleSendCode}
                loading={authState.codeSending}
                disabled={
                  authState.isLoading ||
                  authState.codeSending ||
                  authState.countdown > 0
                }
                style={styles.sendCodeButton}
                contentStyle={styles.sendCodeButtonContent}
                labelStyle={styles.sendCodeButtonLabel}>
                {getSendButtonText()}
              </Button>
            </View>

            {/* 邀请码（可选） */}
            {/* {showAffCode ? (
              <TextInput
                testID="aff-code-input"
                label="邀请码（可选）"
                value={affCode}
                onChangeText={setAffCode}
                maxLength={4}
                autoCapitalize="characters"
                style={styles.input}
                mode="outlined"
                disabled={authState.isLoading}
              />
            ) : (
              <Button
                mode="text"
                onPress={() => setShowAffCode(true)}
                disabled={authState.isLoading}
                compact
                labelStyle={styles.toggleLink}>
                我有邀请码
              </Button>
            )} */}

            {/* 登录按钮 */}
            <Button
              mode="contained"
              onPress={handleSignIn}
              loading={authState.isLoading}
              disabled={authState.isLoading}
              style={styles.signInButton}
              contentStyle={styles.buttonContent}>
              登录 / 注册
            </Button>
          </View>

          {/* 提示信息 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              未注册的手机号将自动创建账号
            </Text>
            <Text style={styles.footerText}>
              验证码 5 分钟内有效
            </Text>
          </View>
        </Sheet.ScrollView>
      </Sheet>
    );
  },
);

