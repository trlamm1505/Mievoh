import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';

type TabKey = 'home' | 'rap' | 'phim' | 'uudai' | 'profile';

interface FooterProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
}

export default function Footer({ activeTab: propActiveTab, onTabChange }: FooterProps) {
  const [localActiveTab, setLocalActiveTab] = useState<TabKey>('home');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;

  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isDark = theme === 'dark';

  const handleTabPress = (tab: TabKey) => {
    if (propActiveTab === undefined) {
      setLocalActiveTab(tab);
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const getTranslatedLabel = (key: TabKey) => {
    switch (key) {
      case 'home':
        return language === 'vi' ? 'Trang chủ' : 'Home';
      case 'rap':
        return t('nav_cinemas');
      case 'phim':
        return t('nav_movies');
      case 'uudai':
        return language === 'vi' ? 'Ưu đãi' : 'Offers';
      case 'profile':
        return language === 'vi' ? 'Cá nhân' : 'Profile';
      default:
        return '';
    }
  };

  const tabs = [
    {
      key: 'home' as TabKey,
      iconType: 'ionicons' as const,
      activeIcon: 'home' as const,
      inactiveIcon: 'home-outline' as const,
    },
    {
      key: 'rap' as TabKey,
      iconType: 'material' as const,
      activeIcon: 'filmstrip' as const,
      inactiveIcon: 'filmstrip' as const,
    },
    {
      key: 'phim' as TabKey,
      iconType: 'material' as const,
      activeIcon: 'movie-open' as const,
      inactiveIcon: 'movie-open-outline' as const,
    },
    {
      key: 'uudai' as TabKey,
      iconType: 'ionicons' as const,
      activeIcon: 'pricetag' as const,
      inactiveIcon: 'pricetag-outline' as const,
    },
    {
      key: 'profile' as TabKey,
      iconType: 'ionicons' as const,
      activeIcon: 'person' as const,
      inactiveIcon: 'person-outline' as const,
    },
  ];


  return (
    <View style={[
      footerStyles.container,
      isDark ? footerStyles.containerDark : footerStyles.containerLight,
    ]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconColor = isActive ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#4B5563');

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            style={[
              footerStyles.tabBtn,
              isActive && footerStyles.tabBtnActive,
            ]}
          >
            {tab.iconType === 'ionicons' ? (
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                size={20}
                color={iconColor}
              />
            ) : (
              <MaterialCommunityIcons
                name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                size={20}
                color={iconColor}
              />
            )}
            <Text
              numberOfLines={1}
              style={[
                footerStyles.tabLabel,
                isActive
                  ? footerStyles.tabLabelActive
                  : isDark ? footerStyles.tabLabelDark : footerStyles.tabLabelLight,
              ]}
            >
              {getTranslatedLabel(tab.key)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 24,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
  },
  containerLight: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderColor: 'rgba(209,213,219,0.5)',
  },
  containerDark: {
    backgroundColor: 'rgba(24,24,27,0.97)',
    borderColor: 'rgba(63,63,70,0.8)',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabBtnActive: {
    backgroundColor: '#7B61FF',
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabLabelLight: {
    color: '#6B7280',
  },
  tabLabelDark: {
    color: '#9CA3AF',
  },
});
