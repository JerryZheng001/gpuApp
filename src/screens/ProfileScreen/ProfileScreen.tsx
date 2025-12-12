import React, {useContext, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {Text, Card, Button} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {observer} from 'mobx-react';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {ROUTES} from '../../utils/navigationConstants';
import {RootDrawerParamList} from '../../utils/types';
import {
  UserCircleIcon,
  ChevronRightIcon,
  EditIcon,
} from '../../assets/icons';

type ProfileScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList>;

export const ProfileScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  // Mock user data - replace with actual user data from store
  const [userData] = useState({
    username: '算力用户123',
    phone: '138****1234',
    avatar: null, // Can be replaced with actual avatar URL
  });

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    const profile = (l10n as any).profile;
    Alert.alert(
      profile?.editProfile || 'Edit Profile',
      'Edit profile functionality coming soon',
    );
  };

  const handleMenuPress = (menuKey: string) => {
    if (menuKey === 'settings') {
      navigation.navigate(ROUTES.SETTINGS);
      return;
    }
    if (menuKey === 'about') {
      navigation.navigate(ROUTES.APP_INFO);
      return;
    }
    if (menuKey === 'appInfo') {
      navigation.navigate(ROUTES.APP_INFO);
      return;
    }
    // TODO: Navigate to respective screens for other menu items
    const profile = (l10n as any).profile;
    Alert.alert(
      profile?.menuItems?.[menuKey] || menuKey,
      'This feature is coming soon',
    );
  };

  const profile = (l10n as any).profile;
  const menuItems = [
    {
      key: 'membership',
      icon: '👑',
      label: profile?.menuItems?.membership || '会员中心',
    },
    // {
    //   key: 'devices',
    //   icon: '💾',
    //   label: profile?.menuItems?.devices || 'My Devices',
    // },
  
    {
      key: 'settings',
      icon: '⚙️',
      label: profile?.menuItems?.systemSettings || '系统设置',
    },
    {
      key: 'appInfo',
      icon: 'ℹ️',
      label: l10n.screenTitles?.appInfo || '应用信息',
    },
    {
      key: 'about',
      icon: '❓',
      label: profile?.menuItems?.aboutUs || '关于我们',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              {userData.avatar ? (
                <Image
                  source={{uri: userData.avatar}}
                  style={styles.avatar}
                />
              ) : (
                <UserCircleIcon
                  width={64}
                  height={64}
                  stroke={theme.colors.primary}
                />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text variant="titleMedium" style={styles.username}>
                {userData.username}
              </Text>
              <Text variant="bodyMedium" style={styles.phone}>
                {userData.phone}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editButton}>
              <Text style={styles.editButtonText}>
                {profile?.editProfile || 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleMenuPress(item.key)}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text variant="bodyLarge" style={styles.menuLabel}>
                  {item.label}
                </Text>
              </View>
              <ChevronRightIcon
                width={20}
                height={20}
                stroke={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

