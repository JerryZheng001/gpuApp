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
    input: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    codeRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    codeInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
    },
    sendCodeButton: {
      height: 56,
      borderColor: theme.colors.primary,
      justifyContent: 'center',
    },
    sendCodeButtonContent: {
      height: 56,
      paddingHorizontal: 12,
    },
    sendCodeButtonLabel: {
      fontSize: 13,
    },
    toggleLink: {
      fontSize: 14,
      color: theme.colors.primary,
    },
    signInButton: {
      height: 48,
      marginTop: 8,
    },
    buttonContent: {
      height: 48,
      justifyContent: 'center',
    },
    footer: {
      marginTop: 24,
      alignItems: 'center',
      gap: 4,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });

