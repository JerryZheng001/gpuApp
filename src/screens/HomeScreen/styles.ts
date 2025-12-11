import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      paddingTop: 48,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      color: theme.colors.onBackground,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    modulesContainer: {
      gap: 24,
      marginBottom: 32,
    },
    moduleCard: {
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    moduleContent: {
      padding: 24,
    },
    moduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    moduleIconContainer: {
      marginRight: 16,
      padding: 12,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 16,
    },
    moduleTextContainer: {
      flex: 1,
    },
    moduleTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: 4,
    },
    moduleDescription: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    moduleButton: {
      borderRadius: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
    },
    moduleButtonContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceVariant,
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
    },
  });




