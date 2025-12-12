import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 2,
      backgroundColor: theme.colors.surface,
    },
    listContainer: {
      paddingBottom: 150,
    },
    tabContainer: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 4,
    },
    segmentedButtons: {
      backgroundColor: theme.colors.surface,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: 4,
      gap: 1,
      justifyContent: 'flex-end',
    },
    filterIcon: {
      borderRadius: 8,
      marginHorizontal: 2,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });
