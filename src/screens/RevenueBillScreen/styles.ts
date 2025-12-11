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
      gap: 12,
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
    withdrawCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    withdrawContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    withdrawLeft: {
      flex: 1,
    },
    withdrawLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    withdrawAmount: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    withdrawButton: {
      borderRadius: 8,
    },
    statisticsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statisticItem: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    statisticLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    statisticValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    billListCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    billListContent: {
      padding: 0,
    },
    billHeader: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 12,
      gap: 8,
      alignItems: 'center',
    },
    billHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
    },
    billRow: {
      flexDirection: 'row',
      padding: 16,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.outlineVariant,
      gap: 8,
      alignItems: 'center',
    },
    billCell: {
      fontSize: 14,
      color: theme.colors.onSurface,
      flexShrink: 1,
    },
    billColPeriod: {
      flex: 1.5,
      minWidth: 120,
      maxWidth: 160,
    },
    billColDevice: {
      flex: 1.2,
      minWidth: 90,
    },
    billColRevenue: {
      flex: 0.9,
      minWidth: 60,
      maxWidth: 80,
      textAlign: 'right',
    },
    billColStatus: {
      flex: 0.9,
      minWidth: 65,
      maxWidth: 75,
      alignItems: 'flex-end',
    },
    revenueText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      maxWidth: '100%',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      flexShrink: 1,
    },
  });

