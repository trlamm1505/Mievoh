import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getNowShowingMoviesApi, getComingSoonMoviesApi } from '../../../axios/movie';
import { getCinemaComplexesApi } from '../../../axios/cinemas';
import { useAppNavigation } from '../../../navigation/navigation';

interface HomeSearchResultsProps {
  query: string;
}

export default function HomeSearchResults({ query }: HomeSearchResultsProps) {
  const navigation = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [nowShowingRes, comingSoonRes, cinemasRes] = await Promise.all([
          getNowShowingMoviesApi({ page: 1, pageSize: 100 }),
          getComingSoonMoviesApi({ page: 1, pageSize: 100 }),
          getCinemaComplexesApi()
        ]);

        // Map movies
        let allMovies: any[] = [];
        if (nowShowingRes?.data?.length > 0 || comingSoonRes?.data?.length > 0) {
          const nowShowingMapped = (nowShowingRes?.data || []).map((m: any) => {
            let genresArr: string[] = [];
            if (Array.isArray(m.genres)) {
              genresArr = m.genres;
            } else if (typeof m.genres === 'string') {
              genresArr = (m.genres as string).split(',').map(g => g.trim());
            }
            return {
              id: m.movieId,
              title: m.title_vi || m.title_en || 'Phim',
              title_en: m.title_en || '',
              image: m.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
              genres: genresArr,
              duration: m.duration ? `${m.duration}m` : '120m'
            };
          });

          const comingSoonMapped = (comingSoonRes?.data || []).map((m: any) => {
            let genresArr: string[] = [];
            if (Array.isArray(m.genres)) {
              genresArr = m.genres;
            } else if (typeof m.genres === 'string') {
              genresArr = (m.genres as string).split(',').map(g => g.trim());
            }
            return {
              id: m.movieId,
              title: m.title_vi || m.title_en || 'Phim',
              title_en: m.title_en || '',
              image: m.imageUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
              genres: genresArr,
              duration: m.duration ? `${m.duration}m` : '120m'
            };
          });

          allMovies = [...nowShowingMapped, ...comingSoonMapped];
        }

        // Map cinemas
        let allCinemas: any[] = [];
        if (cinemasRes?.length > 0) {
          allCinemas = cinemasRes.map((c: any) => ({
            id: c.cinemaComplexId,
            name: c.name || '',
            address: c.address || '',
            image: c.CinemaSystem?.logo || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80'
          }));
        }

        setMovies(allMovies);
        setCinemas(allCinemas);
      } catch (err) {
        console.error('Error fetching search data:', err);
        setMovies([]);
        setCinemas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-12 bg-white">
        <ActivityIndicator size="small" color="#7B61FF" />
        <Text className="text-gray-400 text-[10px] mt-2">Đang tìm kiếm...</Text>
      </View>
    );
  }

  const cleanQuery = query.toLowerCase().trim();
  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(cleanQuery) || 
    (m.title_en && m.title_en.toLowerCase().includes(cleanQuery))
  );

  const filteredCinemas = cinemas.filter(c => 
    c.name.toLowerCase().includes(cleanQuery) || 
    c.address.toLowerCase().includes(cleanQuery)
  );

  const hasResults = filteredMovies.length > 0 || filteredCinemas.length > 0;

  if (!hasResults) {
    return (
      <View className="flex-1 items-center justify-center py-12 px-6 bg-white">
        <Text className="text-gray-400 text-xs text-center font-medium">
          Không tìm thấy kết quả nào
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Movies section */}
      {filteredMovies.length > 0 && (
        <View className="px-1 py-1">
          <Text className="text-gray-450 text-[10px] font-bold tracking-widest uppercase mb-2">
            PHIM
          </Text>
          <View className="gap-0.5">
            {filteredMovies.map((movie) => (
              <TouchableOpacity 
                key={`movie-${movie.id}`}
                onPress={() => navigation.goToMovieDetail(movie.id.toString())}
                activeOpacity={0.7}
                className="flex-row py-2 items-center"
              >
                <Image 
                  source={{ uri: movie.image }} 
                  className="w-[46px] h-[62px] rounded-xl border border-gray-100"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-3.5">
                  <Text className="text-gray-900 text-xs font-bold mb-0.5" numberOfLines={1}>
                    {movie.title}
                  </Text>
                  {movie.genres && movie.genres.length > 0 ? (
                    <Text className="text-[#8B5CF6] text-[10px] font-semibold mb-0.5" numberOfLines={1}>
                      {movie.genres.join(' / ')}
                    </Text>
                  ) : null}
                  <Text className="text-gray-400 text-[9px] font-semibold">
                    {movie.duration}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Cinemas section */}
      {filteredCinemas.length > 0 && (
        <View className="px-1 pt-3">
          <Text className="text-gray-455 text-[10px] font-bold tracking-widest uppercase mb-2">
            RẠP
          </Text>
          <View className="gap-0.5">
            {filteredCinemas.map((cinema) => (
              <TouchableOpacity 
                key={`cinema-${cinema.id}`}
                activeOpacity={0.7}
                className="flex-row py-2 items-center"
              >
                <View className="w-[40px] h-[40px] rounded-full overflow-hidden border border-gray-100 bg-white justify-center items-center">
                  <Image 
                    source={{ uri: cinema.image }} 
                    className="w-7 h-7 rounded-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="flex-1 ml-3.5">
                  <Text className="text-gray-900 text-xs font-bold mb-0.5" numberOfLines={1}>
                    {cinema.name}
                  </Text>
                  <Text className="text-gray-400 text-[9px] leading-3.5" numberOfLines={2}>
                    {cinema.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
