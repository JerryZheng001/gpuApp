import {StyleSheet} from 'react-native';

import {MD3Theme} from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    sidebarContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    divider: {
      marginHorizontal: 16,
      backgroundColor: theme.colors.onSurfaceVariant,
      height: 1,
      opacity: 0.1,
    },
    contentWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    sessionDrawerItem: {
      height: 40,
    },
    menuDrawerItem: {
      height: 44,
    },
    versionText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      fontSize: 12,
      fontWeight: '500',
    },
    drawerSection: {
      marginTop: 10,
    },
    dateLabel: {
      paddingLeft: 16,
      paddingVertical: 10,
    },
    scrollViewContent: {
      flexGrow: 1,
      minHeight: '100%',
    },
    mainContent: {
      flex: 1,
    },
    menu: {
      width: 170,
    },
    sessionItem: {
      position: 'relative',
    },
    sessionTouchable: {
      flex: 1,
    },
    bottomSection: {
      backgroundColor: 'transparent',
      paddingTop: 8,
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    usageInfoWrapper: {
      position: 'relative',
    },
    usageInfoChevron: {
      position: 'absolute',
      right: 18,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    usageInfoChildren: {
      marginTop: 0,
      marginBottom: 0,
    },
    usageInfoChildWrapper: {
      marginLeft: 24,
    },
    subMenuContainer: {
      marginLeft: 20,
      marginRight: 12,
      marginTop: 2,
      marginBottom: 10,
      paddingVertical: 4,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.onSurfaceVariant,
      borderRadius: 8,
      opacity: 0.9,
    },
    subMenuItem: {
      height: 38,
      marginLeft: 8,
      marginRight: 4,
      borderRadius: 8,
    },
    subMenuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginLeft: 8,
      marginRight: 4,
      borderRadius: 8,
    },
    subMenuIcon: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.onSurfaceVariant,
      marginLeft: 10,
      opacity: 0.7,
    },
    subMenuLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    usageInfoLabel: {
      fontWeight: '600',
    },
  });
