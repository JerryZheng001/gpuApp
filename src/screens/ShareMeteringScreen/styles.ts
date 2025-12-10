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
    tableCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    tableContent: {
      padding: 0,
    },
    tableHeader: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 12,
      gap: 8,
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
      paddingVertical: 12,
      gap: 8,
    },
    rowDivider: {
      marginLeft: 16,
    },
    tableCell: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    colDate: {
      flex: 1,
      minWidth: 80,
    },
    colDevice: {
      flex: 1.2,
      minWidth: 100,
    },
    colDuration: {
      flex: 1,
      minWidth: 80,
    },
    colCompute: {
      flex: 1.2,
      minWidth: 100,
    },
    colRevenue: {
      flex: 1,
      minWidth: 70,
      textAlign: 'right',
    },
    revenueText: {
      color: theme.colors.primary,
      fontWeight: '500',
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

