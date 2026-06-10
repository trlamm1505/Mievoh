import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { GradientText } from '../../../components/GradientComponents/GradientComponents';
import { getMyRecommendationsApi, PersonalRecommendation } from '../../../axios/profile';
import { useAppNavigation } from '../../../navigation/navigation';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 2 * GAP) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

export default function PersonalRecommendations() {
  const navigation = useAppNavigation();
  const { isLoggedIn } = useAuth();
  const [recommendations, setRecommendations] = useState<PersonalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const response = await getMyRecommendationsApi();
        // Since backend might wrap it or return array directly:
        const list = response.data || (Array.isArray(response) ? response : []);
        setRecommendations(list);
      } catch (error) {
        console.log('Error fetching personal recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isLoggedIn]);

  // Only display if we have recommendations
  if (!isLoggedIn || loading || recommendations.length === 0) {
    return null;
  }

  return (
    <View className="py-3">
      {/* Title Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <GradientText className="text-xl font-bold">
          {t('personal_recommendations')}
        </GradientText>
      </View>

      {/* Horizontal FlatList */}
      <FlatList
        data={recommendations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.recommendationId || item.movieId}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item, index }) => {
          const movie = item.Movie || {};
          const title = movie.title_vi || 'Movie';
          const image = movie.imageUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80';
          const rating = movie.averageRating && movie.averageRating > 0 ? movie.averageRating : 4.5;
          const matchScore = item.matchScore ? Math.round(item.matchScore) : 80;

          return (
            <TouchableOpacity 
              key={item.recommendationId || item.movieId} 
              onPress={() => navigation.goToMovieDetail(item.movieId)}
              style={{ 
                width: CARD_WIDTH, 
                marginRight: index === recommendations.length - 1 ? 0 : GAP 
              }}
            >
              {/* Movie Poster */}
              <View 
                style={{ 
                  width: CARD_WIDTH, 
                  height: CARD_HEIGHT,
                  borderColor: isDark ? '#2E2856' : '#F3F4F6',
                  borderWidth: 1,
                  backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                }} 
                className="rounded-3xl overflow-hidden shadow-sm"
              >
                <Image
                  source={{ uri: image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                
                {/* Match Score Badge (Netflix style) */}
                <View className="absolute top-2 left-2 bg-[#10B981] px-1.5 py-0.5 rounded-md">
                  <Text className="text-white text-[9px] font-bold">
                    {matchScore}% Match
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text 
                style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                className="text-sm font-bold mt-2.5 px-0.5" 
                numberOfLines={1}
              >
                {title}
              </Text>

              {/* Rating / Match Score */}
              <View className="flex-row items-center mt-0.5 px-0.5">
                <Text className="text-yellow-500 text-[11px] mr-1">⭐</Text>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                  className="text-[12px] font-medium"
                >
                  {rating.toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
