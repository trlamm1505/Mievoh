import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientText, GradientIcon } from '../../../components/GradientComponents/GradientComponents';
import { getCinemaComplexesApi } from '../../../axios/cinemas';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

interface CinemaWithChain {
  id: string | number;
  name: string;
  address: string;
  chainLogo: string;
  chainName: string;
  image: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 2 * GAP) / 3;

interface TopCinemasProps {
  onSeeAll?: () => void;
}

export default function TopCinemas({ onSeeAll }: TopCinemasProps) {
  const [cinemas, setCinemas] = useState<CinemaWithChain[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const complexes = await getCinemaComplexesApi();
        if (complexes && complexes.length > 0) {
          const mapped = complexes.map(c => ({
            id: c.cinemaComplexId,
            name: c.name || '',
            address: c.address || '',
            chainLogo: c.CinemaSystem?.logo || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80',
            chainName: c.CinemaSystem?.name || '',
            image: c.CinemaSystem?.logo || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80'
          }));
          
          const first3 = mapped.slice(0, 3);
          setCinemas(first3);
        } else {
          setCinemas([]);
        }
      } catch (error) {
        console.error('Error fetching cinemas from API:', error);
        setCinemas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, []);

  return (
    <View className="py-3 mb-6">
      {/* Title Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <GradientText className="text-xl font-bold">
          {t('featured_cinemas')}
        </GradientText>
        <TouchableOpacity onPress={onSeeAll}>
          <GradientIcon name="arrow-forward-outline" size={22} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll List of Cinema Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {loading ? (
          <View className="flex-row items-center justify-center py-10 w-full" style={{ width: SCREEN_WIDTH - 32 }}>
            <ActivityIndicator size="small" color="#7B61FF" />
            <Text className="text-gray-400 text-xs ml-2">
              {language === 'vi' ? 'Đang tải danh sách rạp...' : 'Loading cinemas list...'}
            </Text>
          </View>
        ) : (
          cinemas.map((cinema, index) => (
            <View 
              key={cinema.id.toString()}
              style={{ 
                width: CARD_WIDTH, 
                height: 130,
                marginRight: index === cinemas.length - 1 ? 0 : GAP,
                backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                borderColor: isDark ? '#2E2856' : '#F3F4F6',
                borderWidth: 1,
              }}
              className="p-3 rounded-[22px] shadow-sm items-center justify-center"
            >

              {/* Circular Logo Image with border frame */}
              <View 
                style={{ borderColor: isDark ? '#2E2856' : '#E5E7EB' }}
                className="w-12 h-12 rounded-full overflow-hidden border bg-white justify-center items-center mb-2 shadow-sm"
              >
                <Image
                  source={{ uri: cinema.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              {/* Cinema Name */}
              <Text 
                style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                className="text-[11px] font-bold text-center mb-1 leading-4" 
                numberOfLines={1}
              >
                {cinema.name}
              </Text>

              {/* Address with Icon */}
              <View className="flex-row items-start justify-center px-0.5">
                <Ionicons name="location-outline" size={9} color="#9ca3af" style={{ marginTop: 1, marginRight: 1 }} />
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                  className="text-[9px] text-center flex-1 leading-3" 
                  numberOfLines={2}
                >
                  {cinema.address}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
