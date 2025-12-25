import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  modelName: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '75%',
  },
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  shareIcon: {
    flexShrink: 0,
  },
  switchWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  shareSwitch: {
    flexShrink: 0,
  },
  switchLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
  },
  emptyModelText: {
    opacity: 0.6,
  },
});
