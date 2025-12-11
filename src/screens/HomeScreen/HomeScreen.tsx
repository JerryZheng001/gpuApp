import React, {useContext} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {observer} from 'mobx-react-lite';
import {
  Card,
  Text,
  Button,
  useTheme,
} from 'react-native-paper';

import {useTheme as useAppTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {RootDrawerParamList} from '../../utils/types';
import {ROUTES} from '../../utils/navigationConstants';
import {
  CpuChipIcon,
  ChatIcon,
  ShareIcon,
  ModelIcon,
} from '../../assets/icons';

type HomeScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList>;

export const HomeScreen: React.FC = observer(() => {
  const l10n = useContext(L10nContext);
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleComputeShare = () => {
    navigation.navigate(ROUTES.MODELS);
  };

  const handleModelChat = () => {
    navigation.navigate(ROUTES.CHAT);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* App Title */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
          GPUNexus
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            本地AI助手，让智能触手可及
          </Text>
        </View>

        {/* Main Modules */}
        <View style={styles.modulesContainer}>
          {/* Compute Share Module */}
          <Card style={styles.moduleCard} elevation={2}>
            <Card.Content style={styles.moduleContent}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIconContainer}>
                  <CpuChipIcon
                    width={32}
                    height={32}
                    stroke={theme.colors.primary}
                  />
                </View>
                <View style={styles.moduleTextContainer}>
                  <Text variant="titleLarge" style={styles.moduleTitle}>
                    算力分享
                  </Text>
                  <Text variant="bodyMedium" style={styles.moduleDescription}>
                    管理和分享您的AI模型算力资源
                  </Text>
                </View>
              </View>
              
              <Button
                mode="contained"
                onPress={handleComputeShare}
                style={styles.moduleButton}
                contentStyle={styles.moduleButtonContent}
                icon={() => (
                  <ShareIcon
                    width={20}
                    height={20}
                    stroke={theme.colors.onPrimary}
                  />
                )}>
                进入算力分享
              </Button>
            </Card.Content>
          </Card>

          {/* Model Chat Module */}
          <Card style={styles.moduleCard} elevation={2}>
            <Card.Content style={styles.moduleContent}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIconContainer}>
                  <ChatIcon
                    width={32}
                    height={32}
                    stroke={theme.colors.tertiary}
                  />
                </View>
                <View style={styles.moduleTextContainer}>
                  <Text variant="titleLarge" style={styles.moduleTitle}>
                    模型对话
                  </Text>
                  <Text variant="bodyMedium" style={styles.moduleDescription}>
                    与AI模型进行智能对话交流
                  </Text>
                </View>
              </View>
              
              <Button
                mode="contained"
                onPress={handleModelChat}
                style={[styles.moduleButton, {backgroundColor: theme.colors.tertiary}]}
                contentStyle={styles.moduleButtonContent}
                icon={() => (
                  <ChatIcon
                    width={20}
                    height={20}
                    stroke={theme.colors.onTertiary}
                  />
                )}>
                开始模型对话
              </Button>
            </Card.Content>
          </Card>
        </View>

      </View>
    </ScrollView>
  );
});
