import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNowShowingMoviesApi, getComingSoonMoviesApi, Movie } from '../../../axios/movie';
import Search from '../../../components/Search/Search';
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

export default function MovieList() {
  const navigation = useAppNavigation();
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        const [nowShowingRes, comingSoonRes] = await Promise.all([
          getNowShowingMoviesApi({ page: 1, pageSize: 50 }),
          getComingSoonMoviesApi({ page: 1, pageSize: 50 })
        ]);

        const nowShowing = nowShowingRes?.data || [];
        const comingSoon = comingSoonRes?.data || [];

        const mapMovie = (m: any, status: 'now_showing' | 'coming_soon') => {
          const originalGenres = m.genres || m.Genre?.split(',').map((g: string) => g.trim()) || [];
          return {
            id: m.movieId || m.id,
            title_vi: m.title || m.title_vi || 'Phim mới',
            title_en: m.title_en || m.title || 'New Movie',
            genres: originalGenres,
            rating: m.rating ? parseFloat(m.rating.toFixed(1)) : 4.5,
            rawReleaseDate: m.releaseDate,
            duration: m.duration || '120 phút',
            status,
            image: m.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
          };
        };

        const mappedNowShowing = nowShowing.map((m: any) => mapMovie(m, 'now_showing'));
        const mappedComingSoon = comingSoon.map((m: any) => mapMovie(m, 'coming_soon'));

        const combined = [...mappedNowShowing, ...mappedComingSoon];
        const uniqueMovies = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        setMoviesList(uniqueMovies);
      } catch (error) {
        console.error('Lỗi khi tải danh sách phim:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  const genresList = useMemo(() => {
    const set = new Set<string>();
    moviesList.forEach((movie) => {
      if (movie.genres) {
        movie.genres.forEach((genre: string) => set.add(genre));
      }
    });
    return Array.from(set);
  }, [moviesList]);

  const filteredMovies = useMemo(() => {
    return moviesList.filter((movie) => {
      const activeTitle = language === 'vi' ? movie.title_vi : movie.title_en;
      const matchesSearch = activeTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === '' || (movie.genres && movie.genres.includes(selectedGenre));
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre, moviesList, language]);

  const translateGenre = (genre: string) => {
    if (language === 'en') return genre;
    return GENRE_TRANSLATIONS[genre] || genre;
  };

  return (
    <View 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', flex: 1 }}
    >
      {/* Search Input */}
      <Search
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={language === 'vi' ? 'Tìm kiếm phim...' : 'Search movies...'}
      />

      {/* Genres Filter Bar */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedGenre('')}
            style={{
              backgroundColor: selectedGenre === ''
                ? '#F3E8FF'
                : (isDark ? '#1D183B' : '#FFFFFF'),
              borderColor: selectedGenre === ''
                ? '#e9d5ff'
                : (isDark ? '#2E2856' : '#F3F4F6'),
            }}
            className="px-4 py-2 rounded-full mr-2 border"
          >
            <Text
              style={{
                color: selectedGenre === '' ? '#7B61FF' : (isDark ? '#9CA3AF' : '#4B5563')
              }}
              className="text-xs font-semibold"
            >
              {language === 'vi' ? 'Tất cả thể loại' : 'All genres'}
            </Text>
          </TouchableOpacity>

          {genresList.map((genre) => (
            <TouchableOpacity
              key={genre}
              onPress={() => setSelectedGenre(genre)}
              style={{
                backgroundColor: selectedGenre === genre
                  ? '#F3E8FF'
                  : (isDark ? '#1D183B' : '#FFFFFF'),
                borderColor: selectedGenre === genre
                  ? '#e9d5ff'
                  : (isDark ? '#2E2856' : '#F3F4F6'),
              }}
              className="px-4 py-2 rounded-full mr-2 border"
            >
              <Text
                style={{
                  color: selectedGenre === genre ? '#7B61FF' : (isDark ? '#9CA3AF' : '#4B5563')
                }}
                className="text-xs font-semibold"
              >
                {translateGenre(genre)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Movies Grid */}
      {loading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#7B61FF" />
          <Text className="text-gray-400 text-xs mt-3">
            {language === 'vi' ? 'Đang tải danh sách phim...' : 'Loading movies list...'}
          </Text>
        </View>
      ) : filteredMovies.length === 0 ? (
        <View className="py-20 items-center justify-center px-4">
          <Ionicons name="film-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-sm mt-3 text-center">
            {language === 'vi' ? 'Không tìm thấy bộ phim nào phù hợp.' : 'No matching movies found.'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="flex-row flex-wrap px-4 gap-y-4 justify-between">
            {filteredMovies.map((movie, idx) => {
              const displayDate = movie.rawReleaseDate 
                ? new Date(movie.rawReleaseDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') 
                : undefined;

              return (
                <TouchableOpacity
                  key={`${movie.id}-${idx}`}
                  onPress={() => navigation.goToMovieDetail(movie.id.toString())}
                  style={{
                    width: CARD_WIDTH,
                    backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                    borderColor: isDark ? '#2E2856' : '#F3F4F6',
                    borderWidth: 1,
                  }}
                  className="rounded-3xl overflow-hidden shadow-sm"
                >
                  {/* Poster Image */}
                  <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} className="relative">
                    <Image
                      source={{ uri: movie.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    
                    {/* Rating Badge or Coming Soon Tag */}
                    {movie.status === 'now_showing' ? (
                      <View className="absolute top-2.5 left-2.5 bg-[#F3E8FF] px-2 py-0.5 rounded-full shadow-sm flex-row items-center">
                        <Text className="text-[#7B61FF] text-[10px] font-bold">★ {movie.rating}</Text>
                      </View>
                    ) : (
                      displayDate && (
                        <View className="absolute top-2.5 left-2.5 bg-[#7B61FF] px-2 py-0.5 rounded-md shadow-sm">
                          <Text className="text-white text-[9px] font-bold">{displayDate}</Text>
                        </View>
                      )
                    )}
                  </View>

                  {/* Movie Details */}
                  <View className="p-3">
                    <Text
                      style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                      className="text-xs font-bold leading-4 mb-1"
                      numberOfLines={1}
                    >
                      {language === 'vi' ? movie.title_vi : movie.title_en}
                    </Text>
                    
                    <Text
                      style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                      className="text-[10px] font-medium"
                      numberOfLines={1}
                    >
                      {movie.genres && movie.genres.map((g: string) => translateGenre(g)).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
