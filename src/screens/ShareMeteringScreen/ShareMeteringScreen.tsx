import React, {useContext, useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Text, Card, Button, Menu, Divider} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {observer} from 'mobx-react';
import {useFocusEffect} from '@react-navigation/native';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {
  ChevronDownIcon,
} from '../../assets/icons';
import {mobileAuthService} from '../../services/mobile-auth';
import {getQuotaRecords, QuotaRecord} from '../../services/mobile-auth/MobileAuthApi';

export const ShareMeteringScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);

  const [deviceMenuVisible, setDeviceMenuVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('全部设备');
  const [quotaRecords, setQuotaRecords] = useState<QuotaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // 获取配额记录
  const fetchQuotaRecords = useCallback(async () => {
    console.log('=== 分享计量页面：检查登录状态 ===');
    console.log('isAuthenticated:', mobileAuthService.isAuthenticated);
    console.log('user:', mobileAuthService.user);
    console.log('session:', mobileAuthService.session);
    console.log('user.id:', mobileAuthService.user?.id);

    // 检查是否已登录
    if (!mobileAuthService.isAuthenticated || !mobileAuthService.user) {
      console.log('❌ 未登录或用户信息不存在');
      setError('请先登录');
      setLoading(false);
      return;
    }

    // 检查 session，如果没有 session，尝试使用空字符串（可能 session 在 cookie 中）
    const session = mobileAuthService.session || '';
    if (!session) {
      console.warn('⚠️ Session 为空，将使用空字符串发送请求（可能 session 在 cookie 中）');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('开始获取配额记录...');
      const response = await getQuotaRecords(
        session,
        mobileAuthService.user.id,
        page,
        pageSize,
      );

      console.log('配额记录响应:', response);

      // 检查响应是否成功（code 200 或 success true）
      const isSuccess = response.code === 200 || response.success === true;
      
      if (isSuccess && response.data) {
        // 检查 results 是否为 null 或空数组
        const results = response.data.results;
        if (results === null || (Array.isArray(results) && results.length === 0)) {
          console.log('⚠️ API 返回 results 为 null 或空数组，显示空数据状态');
          setQuotaRecords([]);
        } else if (Array.isArray(results)) {
          setQuotaRecords(results);
          console.log('✅ 成功获取配额记录，数量:', results.length);
        } else {
          setQuotaRecords([]);
          console.log('⚠️ results 格式不正确，显示空数据状态');
        }
      } else {
        const errorMsg = response.message || '获取配额记录失败';
        console.error('❌ 获取配额记录失败:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('获取配额记录错误:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // 初始加载和页面获得焦点时刷新
  useEffect(() => {
    fetchQuotaRecords();
  }, [fetchQuotaRecords]);

  useFocusEffect(
    useCallback(() => {
      fetchQuotaRecords();
    }, [fetchQuotaRecords]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Filter Buttons */}
        {/* <View style={styles.filterContainer}>
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
        </View> */}

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
                输入用量
              </Text>
              <Text
                style={[styles.tableHeaderText, styles.colRevenue]}
                numberOfLines={1}
                ellipsizeMode="tail">
                输出用量
              </Text>
            </View>

            <Divider style={styles.tableDivider} />

            {/* Loading State */}
            {loading && (
              <View style={{padding: 20, alignItems: 'center'}}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{marginTop: 10, color: theme.colors.onSurfaceVariant}}>
                  正在加载数据...
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && !loading && (
              <View style={{padding: 20, alignItems: 'center'}}>
                <Text style={{color: theme.colors.error, marginBottom: 10}}>
                  {error}
                </Text>
                <Button mode="contained" onPress={fetchQuotaRecords}>
                  重试
                </Button>
              </View>
            )}

            {/* Table Rows - Empty State */}
            {!loading && !error && quotaRecords.length === 0 && (
              <View style={{padding: 40, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: theme.colors.onSurfaceVariant, fontSize: 16}}>
                  暂时没有数据～
                </Text>
              </View>
            )}

            {!loading && !error && quotaRecords.map((row, index) => (
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
                    {row.device_name}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colDuration]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.share_duration}
                  </Text>
                  <Text
                    style={[styles.tableCell, styles.colCompute]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.input_usage}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colRevenue,
                      styles.revenueText,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {row.output_usage}
                  </Text>
                </View>
                {index < quotaRecords.length - 1 && (
                  <Divider style={styles.rowDivider} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Summary Card - 已删除 */}
      </ScrollView>
    </SafeAreaView>
  );
});

