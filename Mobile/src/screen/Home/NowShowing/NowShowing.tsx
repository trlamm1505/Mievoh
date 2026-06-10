import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNowShowingMoviesApi } from '../../../axios/movie';
import { useAppNavigation } from '../../../navigation/navigation';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

export default function NowShowing() {
  const navigation = useAppNavigation();
  const { language, t } = useLanguage();
  const [featuredMovie, setFeaturedMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const res = await getNowShowingMoviesApi({ page: 1, pageSize: 50 });
        const list = res?.data || [];
        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => {
            const rA = a.averageRating ?? 0;
            const rB = b.averageRating ?? 0;
            return rB - rA;
          });
          const bestMovie = sorted[0];

          setFeaturedMovie({
            id: bestMovie.movieId,
            title_vi: bestMovie.title_vi || bestMovie.title_en || '',
            title_en: bestMovie.title_en || bestMovie.title_vi || '',
            image: bestMovie.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
            description_vi: bestMovie.description_vi || bestMovie.description_en || '',
            description_en: bestMovie.description_en || bestMovie.description_vi || ''
          });
        } else {
          setFeaturedMovie(null);
        }
      } catch (err) {
        console.error('Error fetching now showing movies for featured card:', err);
        setFeaturedMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

  if (loading) {
    return (
      <View className="px-4 py-8 items-center justify-center">
        <ActivityIndicator size="small" color="#7B61FF" />
      </View>
    );
  }

  if (!featuredMovie) return null;

  const displayTitle = language === 'vi' ? featuredMovie.title_vi : featuredMovie.title_en;
  const displayDesc = language === 'vi' ? featuredMovie.description_vi : featuredMovie.description_en;

  return (
    <View className="px-4 py-3">
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.goToMovieDetail(featuredMovie.id)}
        className="w-full bg-[#030303] rounded-3xl p-5 border border-purple-950/40 flex-row items-center justify-between shadow-2xl"
        style={{
          shadowColor: '#A855F7',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* Left Side: Info & Description */}
        <View className="flex-1 pr-4 justify-between h-[155px]">
          <View>
            {/* Discover Badge */}
            <View className="bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-full self-start mb-2">
              <Text className="text-[8px] font-bold text-purple-300 tracking-widest uppercase">
                {t('explore_now')}
              </Text>
            </View>

            {/* Movie Title */}
            <Text 
              className="text-base font-extrabold text-[#A855F7] mb-2 leading-5"
              numberOfLines={2}
            >
              {displayTitle}
            </Text>

            {/* Description */}
            <Text 
              className="text-gray-400 text-[10px] leading-4"
              numberOfLines={3}
            >
              {displayDesc}
            </Text>
          </View>

          {/* More Info Button */}
          <TouchableOpacity 
            activeOpacity={0.8}
            className="flex-row items-center border border-white/20 px-3.5 py-1.5 rounded-full self-start"
            onPress={() => navigation.goToMovieDetail(featuredMovie.id)}
          >
            <Ionicons name="information-circle-outline" size={13} color="white" />
            <Text className="text-white text-[9px] font-bold ml-1.5">
              {t('more_info')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Side: Glowing Poster */}
        <View 
          className="rounded-2xl overflow-hidden border border-purple-500/50 bg-black"
          style={{
            shadowColor: '#A855F7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Image 
            source={{ uri: featuredMovie.image }} 
            className="w-[105px] h-[155px]"
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
