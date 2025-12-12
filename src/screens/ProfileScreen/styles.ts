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
    profileCard: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 0,
    },
    profileCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryContainer,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      color: theme.colors.onSurface,
      marginBottom: 4,
      fontWeight: '600',
    },
    phone: {
      color: theme.colors.onSurfaceVariant,
    },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    editButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    menuContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIcon: {
      fontSize: 24,
      marginRight: 16,
      width: 32,
      textAlign: 'center',
    },
    menuLabel: {
      color: theme.colors.onSurface,
      flex: 1,
    },
  });

