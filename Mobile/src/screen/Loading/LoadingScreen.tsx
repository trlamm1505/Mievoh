import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface LoadingScreenProps {
  onFinished: () => void;
}

export default function LoadingScreen({ onFinished }: LoadingScreenProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language } = useLanguage();
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress value from 0 to 100 over 2.5 seconds
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Listen to animated value to update state
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgress(Math.round(value));
      if (value >= 100) {
        onFinished();
      }
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [onFinished]);

  const getStatusText = () => {
    if (progress < 40) {
      return language === 'vi' ? 'Đang kết nối máy chủ...' : 'Connecting to server...';
    } else if (progress < 80) {
      return language === 'vi' ? 'Đang chuẩn bị nội dung...' : 'Preparing content...';
    } else {
      return language === 'vi' ? 'Sẵn sàng để bắt đầu' : 'Ready to start';
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background radial gradient nebula-like layout */}
      <LinearGradient
        colors={['#05030B', '#110D2C', '#05030B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 0.9 }}
      />
      
      {/* Glowing light effect in background */}
      <View style={styles.glowOverlay} />

      <View style={styles.content}>
        {/* Logo box */}
        <View style={styles.logoBox}>
          <Image
            source={require('../../../assets/images/mievoh/mievoh_logo.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {language === 'vi' ? 'CHÀO MỪNG TRỞ LẠI' : 'WELCOME BACK'}
        </Text>

        {/* Main Title */}
        <Text style={styles.mainTitle}>
          {language === 'vi' ? 'Trải nghiệm đặt vé phim ' : 'Perfect movie '}
          <Text style={{ color: '#C084FC' }}>
            {language === 'vi' ? 'hoàn hảo' : 'booking'}
          </Text>
          {language === 'vi' ? ' đang đợi bạn' : ' experience awaits you'}
        </Text>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#A855F7', '#7B61FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* Progress Labels */}
          <View style={styles.progressLabels}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.percentText}>{progress}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  glowOverlay: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7B61FF',
    opacity: 0.12,
    top: '40%',
    left: '20%',
    transform: [{ scale: 1.5 }],
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },
  logoBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(30, 27, 75, 0.45)',
    borderColor: 'rgba(123, 97, 255, 0.2)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  logoIcon: {
    width: 140,
    height: 140,
    borderRadius: 70, // Perfect circular logo filling the container beautifully
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 5,
    marginBottom: 16,
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 64,
    paddingHorizontal: 8,
  },
  progressSection: {
    width: '100%',
    paddingHorizontal: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
