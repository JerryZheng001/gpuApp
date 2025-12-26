import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks';

const {width, height} = Dimensions.get('window');

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadingComplete,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 启动动画序列
    const startAnimations = () => {
      // 淡入和缩放动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();

    // 模拟加载过程，然后跳转到主应用
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onLoadingComplete();
      });
    }, 2000); // 2秒加载时间

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onLoadingComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* 主标题 */}
        <Text style={styles.mainTitle}>人人储算</Text>
        
        {/* 副标题 */}
        <Text style={styles.subtitle}>人人享算</Text>
        
        {/* 理念文字 */}
        <View style={styles.sloganContainer}>
          <Text style={styles.slogan}>人人平等</Text>
          <Text style={styles.slogan}>算算平权</Text>
        </View>

        {/* 加载指示器 */}
        <View style={styles.loadingIndicator}>
          <View style={[styles.dot, {backgroundColor: theme.colors.primary}]} />
          <View style={[styles.dot, {backgroundColor: theme.colors.primary}]} />
          <View style={[styles.dot, {backgroundColor: theme.colors.primary}]} />
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: Theme, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    mainTitle: {
      fontSize: 48,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: 2,
    },
    subtitle: {
      fontSize: 36,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 40,
      textAlign: 'center',
      letterSpacing: 1,
    },
    sloganContainer: {
      alignItems: 'center',
      marginBottom: 60,
    },
    slogan: {
      fontSize: 24,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 1,
    },
    loadingIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
  });