import {StyleSheet} from 'react-native';
import {Theme} from '../../utils';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
    },
    loadingContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    form: {
      gap: 16,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    bindButton: {
      height: 48,
      marginTop: 8,
    },
    buttonContent: {
      height: 48,
      justifyContent: 'center',
    },
  });

