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
    emptyStateIconContainer: {
      marginBottom: 24,
      opacity: 0.6,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
      opacity: 0.7,
    },
    // Auth bar styles (consistent with Pals CompactAuthBar)
    authBar: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    authBarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    authBarInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    authBarText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
      lineHeight: 18,
    },
    authBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    authBarSignInButton: {
      borderRadius: 20,
      minWidth: 60,
    },
    authBarSignInLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    authBarDismissButton: {
      margin: 0,
    },
  });
