import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import Layout from '../../Layout/Layout';
import Search from '../../components/Search/Search';
import NowShowing from './NowShowing/NowShowing';
import PersonalRecommendations from './PersonalRecommendations/PersonalRecommendations';
import HotMovies from './HotMovies/HotMovies';
import TopCinemas from './TopCinemas/TopCinemas';
import Promotions from './Promotions/Promotions';
import Profile from '../Profile/Profile';
import MoviesScreen from '../Movies/Movies';
import CinemasScreen from '../Cinemas/Cinemas';
import HomeSearchResults from './HomeSearchResults/HomeSearchResults';
import PromotionsScreen from '../Promotions/PromotionsScreen';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { BookingRepository } from '../../SQLite/repositories/BookingRepository';

type TabKey = 'home' | 'rap' | 'phim' | 'uudai' | 'profile';

export default function Home() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ skipInitialLoading?: string }>();
  const skipInitialLoading = params.skipInitialLoading === 'true';
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (user?.email) {
      // Delay sync by 1.5 seconds to avoid competing with initial animations
      const timer = setTimeout(() => {
        BookingRepository.syncBookingsWithServer(user.email)
          .catch((err) => console.log('Background booking sync skipped/failed:', err.message || err));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user?.email]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            {searchQuery.trim() !== '' && isDropdownVisible && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setIsDropdownVisible(false)}
                className="absolute inset-0 bg-black/20 z-40"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  minHeight: 1500,
                }}
              />
            )}
            <View className="relative" style={{ zIndex: 100 }}>
              <Search 
                value={searchQuery} 
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim() !== '') {
                    setIsDropdownVisible(true);
                  }
                }} 
                placeholder={t('search_placeholder')} 
                onClear={() => {
                  setSearchQuery('');
                  setIsDropdownVisible(false);
                }}
                onFocus={() => {
                  if (searchQuery.trim() !== '') {
                    setIsDropdownVisible(true);
                  }
                }}
              />
              {searchQuery.trim() !== '' && isDropdownVisible && (
                <View 
                  className="absolute left-4 right-4 bg-white rounded-3xl p-4 border border-gray-100 z-50"
                  style={{
                    top: 56,
                    maxHeight: 380,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 15,
                    elevation: 10,
                  }}
                >
                  <HomeSearchResults query={searchQuery} />
                </View>
              )}
            </View>
            <NowShowing />
            <PersonalRecommendations />
            <HotMovies onSeeAll={() => setActiveTab('phim')} />
            <TopCinemas onSeeAll={() => setActiveTab('rap')} />
            <Promotions onSeeAll={() => setActiveTab('uudai')} />
          </>
        );
      case 'rap':
        return (
          <View className="pt-2">
            <CinemasScreen />
          </View>
        );
      case 'phim':
        return (
          <View className="pt-2">
            <MoviesScreen />
          </View>
        );
      case 'uudai':
        return (
          <View className="pt-2">
            <PromotionsScreen />
          </View>
        );
      case 'profile':
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} skipInitialLoading={skipInitialLoading}>
      {renderContent()}
    </Layout>
  );
}
