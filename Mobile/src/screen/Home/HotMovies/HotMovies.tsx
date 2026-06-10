import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { GradientText, GradientIcon } from '../../../components/GradientComponents/GradientComponents';
import { getNowShowingMoviesApi } from '../../../axios/movie';
import { useAppNavigation } from '../../../navigation/navigation';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.42;

const GENRE_TRANSLATIONS: Record<string, string> = {
  'Action': 'Hành động',
  'Sci-Fi': 'Viễn tưởng',
  'Romance': 'Lãng mạn',
  'Music': 'Ca nhạc',
  'Mystery': 'Bí ẩn',
  'Thriller': 'Giật gân',
  'Comedy': 'Hài hước',
  'Family': 'Gia đình',
  'Adventure': 'Phiêu lưu',
  'Animation': 'Hoạt hình',
  'Horror': 'Kinh dị',
  'Sports': 'Thể thao',
  'Documentary': 'Tài liệu',
  'Nature': 'Thiên nhiên',
  'Genre': 'Thể loại',
};

interface HotMoviesProps {
  onSeeAll?: () => void;
}

export default function HotMovies({ onSeeAll }: HotMoviesProps) {
  const navigation = useAppNavigation();
  const [displayMovies, setDisplayMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await getNowShowingMoviesApi({ page: 1, pageSize: 50 });
        const moviesList = response.data || [];
        if (moviesList && moviesList.length > 0) {
          // Sort by average rating descending
          const sortedList = [...moviesList].sort((a, b) => {
            const rA = a.averageRating ?? 0;
            const rB = b.averageRating ?? 0;
            return rB - rA;
          });
          const mapped = sortedList.map((m: any) => {
            let genresArr: string[] = [];
            if (Array.isArray(m.genres)) {
              genresArr = m.genres;
            } else if (typeof m.genres === 'string') {
              genresArr = m.genres.split(',').map((g: string) => g.trim());
            }

            return {
              id: m.movieId,
              title_vi: m.title_vi || m.title_en || 'Movie',
              title_en: m.title_en || m.title_vi || 'Movie',
              image: m.imageUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
              rating: m.averageRating !== null && m.averageRating !== undefined ? m.averageRating : 4.5,
              genres: genresArr,
              status: 'now_showing'
            };
          });
          // Display exactly 4 hot movies
          setDisplayMovies(mapped.slice(0, 4));
        } else {
          setDisplayMovies([]);
        }
      } catch (error) {
        console.error('Error fetching now showing movies:', error);
        setDisplayMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const translateGenre = (genre: string) => {
    if (language === 'en') return genre;
    return GENRE_TRANSLATIONS[genre] || genre;
  };

  return (
    <View className="py-3">
      {/* Title Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <GradientText className="text-xl font-bold">
          {t('trending_movies')}
        </GradientText>
        <TouchableOpacity onPress={onSeeAll}>
          <GradientIcon name="arrow-forward-outline" size={22} />
        </TouchableOpacity>
      </View>

      {/* Grid of exactly 4 movies */}
      {loading ? (
        <View className="flex-row items-center justify-center py-10 w-full" style={{ width: SCREEN_WIDTH - 32 }}>
          <ActivityIndicator size="small" color="#7B61FF" />
          <Text className="text-gray-400 text-xs ml-2">
            {language === 'vi' ? 'Đang tải danh sách phim...' : 'Loading movies list...'}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-4 px-4">
          {displayMovies.map((item) => (
            <TouchableOpacity 
              key={item.id.toString()} 
              onPress={() => navigation.goToMovieDetail(item.id.toString())}
              style={{ width: CARD_WIDTH }}
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
                className="rounded-3xl overflow-hidden shadow-sm relative"
              >
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Rating Badge (top right of poster) */}
                <View 
                  className="absolute top-2.5 right-2.5 bg-black/60 px-2 py-0.5 rounded-full flex-row items-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                >
                  <Text className="text-red-500 text-[10px] mr-0.5">★</Text>
                  <Text className="text-white text-[10px] font-bold">
                    {item.rating !== undefined && item.rating !== null ? Number(item.rating).toFixed(1) : '4.5'}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text 
                style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                className="text-sm font-bold mt-2.5 px-0.5" 
                numberOfLines={1}
              >
                {language === 'vi' ? item.title_vi : item.title_en}
              </Text>

              {/* Genres */}
              <Text 
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                className="text-[11px] font-medium mt-0.5 px-0.5" 
                numberOfLines={1}
              >
                {item.genres && item.genres.map((g: string) => translateGenre(g)).join(', ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
