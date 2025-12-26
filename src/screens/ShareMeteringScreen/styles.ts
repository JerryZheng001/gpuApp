import {StyleSheet} from 'react-native';
import {EdgeInsets} from 'react-native-safe-area-context';
import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: insets.bottom + 16,
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    filterButtonText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    tableCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 2, // 添加轻微阴影
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tableContent: {
      padding: 0,
    },
    tableWrapper: {
      minWidth: 600, // 增加最小宽度以适应更好的列宽分配
    },
    tableHeader: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 12,
      alignItems: 'flex-start', // 改为顶部对齐，避免多行文本时的居中问题
    },
    tableHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    tableDivider: {
      marginHorizontal: 16,
    },
    tableRow: {
      flexDirection: 'row',
      padding: 16,
      paddingVertical: 14, // 稍微增加垂直间距
      alignItems: 'flex-start', // 改为顶部对齐，让多行文本更紧凑
      minHeight: 48, // 设置最小行高确保一致性
      backgroundColor: theme.colors.surface,
      // 添加按压效果将在 TouchableOpacity 中处理
    },
    tableRowPressed: {
      backgroundColor: theme.colors.surfaceVariant, // 按压时的背景色
    },
    rowDivider: {
      marginLeft: 16,
      backgroundColor: theme.colors.outlineVariant, // 使用主题色
      opacity: 0.3, // 降低透明度让分隔线更柔和
    },
    tableCell: {
      fontSize: 14,
      color: theme.colors.onSurface,
      flexWrap: 'wrap', // 允许文本换行
      lineHeight: 20, // 添加行高提高可读性
      // 为数字列添加等宽字体
    },
    colDate: {
      width: 160, // 稍微减小日期列宽度
      paddingRight: 12,
    },
    colDevice: {
      width: 120, // 增加设备名称列宽度，减少换行
      paddingLeft: 12,
      paddingRight: 8,
    },
    colCompute: {
      width: 120, // 减小输入用量列宽度
      paddingLeft: 8,
      paddingRight: 12,
      textAlign: 'right',
      fontFamily: 'SF Mono', // 等宽字体让数字对齐更美观
    },
    colRevenue: {
      width: 120, // 减小输出用量列宽度
      paddingLeft: 12,
      textAlign: 'right',
      fontFamily: 'SF Mono', // 等宽字体让数字对齐更美观
    },
    revenueText: {
      color: theme.colors.primary,
      fontWeight: '600', // 增加字重
      fontFamily: 'SF Mono', // 保持等宽字体
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    summaryContent: {
      gap: 16,
      marginBottom: 16,
    },
    summaryItem: {
      gap: 4,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    exportButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
  });

