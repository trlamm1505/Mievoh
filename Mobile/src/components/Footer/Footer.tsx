import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    <View className="absolute bottom-5 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 rounded-[24px] shadow-lg border border-gray-100/50 dark:border-zinc-800 px-2.5 py-1.5 flex-row items-center justify-between z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconColor = isActive ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#4B5563');

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            className={`flex-1 items-center justify-center py-1.5 rounded-[18px] transition-all duration-200 ${
              isActive ? 'bg-[#7B61FF]' : 'bg-transparent'
            }`}
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
              className={`text-[9px] mt-0.5 font-medium ${
                isActive 
                  ? 'text-white font-bold' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {getTranslatedLabel(tab.key)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
