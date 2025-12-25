import {StyleSheet} from 'react-native';
import {Theme} from '../../utils/types';

export const createStyles = ({theme}: {theme: Theme}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: theme.spacing.default,
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
      ...theme.fonts.titleMedium,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      ...theme.fonts.bodyMedium,
    },
    buttonContainer: {
      flexDirection: 'column',
      gap: 12,
      width: '100%',
      alignItems: 'center',
    },
    button: {
      minWidth: 200,
    },
    shareButton: {
      minWidth: 200,
    },
    logo: {
      width: 112,
      height: 112,
      borderRadius: 30,
    },
  });
