import React, {useState, useContext} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Image,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import Clipboard from '@react-native-clipboard/clipboard';
import {Text, Button, SegmentedButtons} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {BuildInfo} from 'llama.rn';

import {submitFeedback} from '../../api/feedback';

import {
  CopyIcon,
  GithubIcon,
  ChevronRightIcon,
  HeartIcon,
} from '../../assets/icons';

import {Sheet, TextInput} from '../../components';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';

const GithubButtonIcon = ({color}: {color: string}) => (
  <GithubIcon stroke={color} />
);

const ChevronRightButtonIcon = ({color}: {color: string}) => (
  <ChevronRightIcon stroke={color} />
);

export const AboutScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);
  const [showFeedback, setShowFeedback] = useState(false);

  const [appInfo, setAppInfo] = React.useState({
    version: '',
    build: '',
  });

  const [useCase, setUseCase] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [usageFrequency, setUsageFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const version = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    setAppInfo({
      version,
      build: buildNumber,
    });
  }, []);

  const copyVersionToClipboard = () => {
    const versionString = `Version ${appInfo.version} (${appInfo.build})`;
    Clipboard.setString(versionString);
    Alert.alert(
      l10n.about.versionCopiedTitle,
      l10n.about.versionCopiedDescription,
    );
  };

  const handleSubmit = async () => {
    if (!useCase && !featureRequests && !generalFeedback) {
      Alert.alert(l10n.feedback.validation.required);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        useCase,
        featureRequests,
        generalFeedback,
        usageFrequency,
      });
      Alert.alert('Success', l10n.feedback.success);
      setShowFeedback(false);
      // Clear form
      setUseCase('');
      setFeatureRequests('');
      setGeneralFeedback('');
      setUsageFrequency('');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : l10n.feedback.error.general;
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 菜单项
  const menuItems = [
    {
      key: 'features',
      label: '功能介绍',
      onPress: () => {
        Alert.alert('功能介绍', l10n.about.description);
      },
    },
    {
      key: 'update',
      label: '版本更新',
      onPress: () => {
        Alert.alert('版本更新', `当前版本: v${appInfo.version} (${appInfo.build})`);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo 和版本信息区域 */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/pocketpal-dark1-v2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={styles.appName}>
            GPUNexus
          </Text>
          <Text variant="bodyMedium" style={styles.versionText}>
            Version {appInfo.version}
          </Text>
        </View>

        {/* 菜单项 */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}>
              <Text variant="bodyLarge" style={styles.menuLabel}>
                {item.label}
              </Text>
              <ChevronRightIcon
                width={20}
                height={20}
                stroke={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 版权信息 */}
        {/* <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            GPUNexus 版权所有
          </Text>
          <Text style={styles.copyrightText}>
            Copyright © 2025 GPUNexus. All Rights Reserved.
          </Text>
        </View> */}
      </ScrollView>

      <Sheet
        title={l10n.feedback.title}
        isVisible={showFeedback}
        displayFullHeight
        onClose={() => setShowFeedback(false)}>
        <Sheet.ScrollView contentContainerStyle={styles.feedbackForm}>
          <View style={styles.field}>
            <Text style={styles.label}>{l10n.feedback.useCase.label}</Text>
            <TextInput
              defaultValue={useCase}
              onChangeText={setUseCase}
              placeholder={l10n.feedback.useCase.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.featureRequests.label}
            </Text>
            <TextInput
              defaultValue={featureRequests}
              onChangeText={setFeatureRequests}
              placeholder={l10n.feedback.featureRequests.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.generalFeedback.label}
            </Text>
            <TextInput
              defaultValue={generalFeedback}
              onChangeText={setGeneralFeedback}
              placeholder={l10n.feedback.generalFeedback.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.usageFrequency.label}
            </Text>
            <SegmentedButtons
              value={usageFrequency}
              onValueChange={setUsageFrequency}
              buttons={[
                {
                  value: 'daily',
                  label: l10n.feedback.usageFrequency.options.daily,
                },
                {
                  value: 'weekly',
                  label: l10n.feedback.usageFrequency.options.weekly,
                },
                {
                  value: 'monthly',
                  label: l10n.feedback.usageFrequency.options.monthly,
                },
                {
                  value: 'rarely',
                  label: l10n.feedback.usageFrequency.options.rarely,
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Sheet.ScrollView>
        <Sheet.Actions>
          <View style={styles.secondaryButtons}>
            <Button mode="text" onPress={() => setShowFeedback(false)}>
              {l10n.common.cancel}
            </Button>
          </View>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}>
            {l10n.feedback.submit}
          </Button>
        </Sheet.Actions>
      </Sheet>
    </SafeAreaView>
  );
};
