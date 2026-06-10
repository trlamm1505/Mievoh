import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCinemaSystemsApi, getCinemaComplexesApi } from '../../../axios/cinemas';
import { GradientText } from '../../../components/GradientComponents/GradientComponents';
import Search from '../../../components/Search/Search';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DisplayBranch {
  id: string | number;
  name: string;
  address: string;
  phone: string;
  city: string;
  rating: number;
  priceRange: string;
  image: string;
  chainName: string;
  chainLogo: string;
}

interface DisplayChain {
  id: string;
  name: string;
  logo: string;
  branches: DisplayBranch[];
}

const CITIES = [
  { key: 'Tất cả', label_vi: 'Tất cả', label_en: 'All' },
  { key: 'Hà Nội', label_vi: 'Hà Nội', label_en: 'Ha Noi' },
  { key: 'TP. Hồ Chí Minh', label_vi: 'TP. Hồ Chí Minh', label_en: 'Ho Chi Minh' },
  { key: 'Đà Nẵng', label_vi: 'Đà Nẵng', label_en: 'Da Nang' },
  { key: 'Bình Dương', label_vi: 'Bình Dương', label_en: 'Binh Duong' },
];

export default function CinemaList() {
  const [theaterChains, setTheaterChains] = useState<DisplayChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tất cả');
  const [selectedChainId, setSelectedChainId] = useState('all');

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const [systemsRes, complexesRes] = await Promise.all([
          getCinemaSystemsApi(),
          getCinemaComplexesApi()
        ]);

        const systems = Array.isArray(systemsRes) ? systemsRes : ((systemsRes as any)?.data || []);
        const complexes = Array.isArray(complexesRes) ? complexesRes : ((complexesRes as any)?.data || []);

        if (systems.length > 0 && complexes.length > 0) {
          const mapped = systems.map((sys: any, sysIdx: number) => {
            const sysNameLower = sys.name?.toLowerCase() || '';
            let rating = 4.5;
            let priceRange = '70.000đ - 120.000đ';
            let phone = '1900 1000';

            if (sysNameLower.includes('cgv')) {
              rating = 4.8;
              priceRange = '80.000đ - 160.000đ';
              phone = '1900 6017';
            } else if (sysNameLower.includes('bhd')) {
              rating = 4.6;
              priceRange = '65.000đ - 120.000đ';
              phone = '1900 2099';
            } else if (sysNameLower.includes('lotte')) {
              rating = 4.7;
              priceRange = '70.000đ - 130.000đ';
              phone = '028 3775 2524';
            } else if (sysNameLower.includes('cine')) {
              rating = 4.4;
              priceRange = '45.000đ - 90.000đ';
              phone = '028 7300 8881';
            } else if (sysNameLower.includes('beta')) {
              rating = 4.3;
              priceRange = '50.000đ - 100.000đ';
              phone = '024 7302 8885';
            }

            const systemComplexes = complexes.filter((comp: any) => comp.cinemaSystemId === sys.cinemaSystemId);

            const branches = systemComplexes.map((comp: any, idx: number) => {
              const address = comp.address || '';
              let city = 'TP. Hồ Chí Minh';
              if (address.toLowerCase().includes('hà nội') || address.toLowerCase().includes('hanoi')) {
                city = 'Hà Nội';
              } else if (address.toLowerCase().includes('đà nẵng') || address.toLowerCase().includes('da nang')) {
                city = 'Đà Nẵng';
              } else if (address.toLowerCase().includes('bình dương') || address.toLowerCase().includes('binh duong')) {
                city = 'Bình Dương';
              }

              const imagesList = [
                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'
              ];
              const randomImage = imagesList[(sysIdx + idx) % imagesList.length];

              return {
                id: comp.cinemaComplexId,
                name: comp.name || 'Rạp chiếu phim',
                address: comp.address || '',
                phone,
                city,
                rating: parseFloat((rating + (idx % 3) * 0.1 - 0.1).toFixed(1)),
                priceRange,
                image: randomImage,
                chainName: sys.name || 'Rạp',
                chainLogo: sys.logo || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80'
              };
            });

            return {
              id: sys.cinemaSystemId,
              name: sys.name || 'Hệ thống rạp',
              logo: sys.logo || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=120&q=80',
              branches
            };
          });

          setTheaterChains(mapped);
        } else {
          setTheaterChains([]);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin hệ thống rạp từ API:', error);
        setTheaterChains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCinemas();
  }, []);

  const filteredChains = useMemo(() => {
    return theaterChains.map(chain => {
      const matchingBranches = chain.branches.filter(branch => {
        const matchesCity = selectedCity === 'Tất cả' || branch.city === selectedCity;
        const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              branch.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCity && matchesSearch;
      });
      return {
        ...chain,
        branches: matchingBranches
      };
    }).filter(chain => chain.branches.length > 0);
  }, [selectedCity, searchQuery, theaterChains]);

  const allMatchingBranches = useMemo(() => {
    const branchesList: DisplayBranch[] = [];
    filteredChains.forEach(chain => {
      chain.branches.forEach(branch => {
        branchesList.push(branch);
      });
    });
    return branchesList.sort((a, b) => b.rating - a.rating);
  }, [filteredChains]);

  const displayBranches = useMemo(() => {
    if (selectedChainId === 'all') {
      return allMatchingBranches;
    }
    const chain = filteredChains.find(c => c.id === selectedChainId);
    if (!chain) return [];
    return [...chain.branches].sort((a, b) => b.rating - a.rating);
  }, [selectedChainId, allMatchingBranches, filteredChains]);

  return (
    <View 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', flex: 1 }}
    >
      {/* Search Input */}
      <Search
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={language === 'vi' ? 'Tìm rạp hoặc địa chỉ...' : 'Search cinema or address...'}
      />

      {/* City Filter Tabs */}
      <View className="mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city.key}
              onPress={() => {
                setSelectedCity(city.key);
                setSelectedChainId('all');
              }}
              style={{
                backgroundColor: selectedCity === city.key
                  ? '#F3E8FF'
                  : (isDark ? '#1D183B' : '#FFFFFF'),
                borderColor: selectedCity === city.key
                  ? '#e9d5ff'
                  : (isDark ? '#2E2856' : '#F3F4F6'),
              }}
              className="px-4 py-2 rounded-full mr-2 border"
            >
              <Text
                style={{
                  color: selectedCity === city.key 
                    ? '#7B61FF' 
                    : (isDark ? '#9CA3AF' : '#4B5563')
                }}
                className="text-xs font-semibold"
              >
                {language === 'vi' ? city.label_vi : city.label_en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chain Filter Row */}
      {!loading && theaterChains.length > 0 && (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {/* "All" Chain Button */}
            <TouchableOpacity
              onPress={() => setSelectedChainId('all')}
              className={`items-center mr-4 p-1 rounded-2xl ${
                selectedChainId === 'all' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <View 
                style={{
                  backgroundColor: isDark ? '#1D183B' : '#F9FAFB',
                  borderColor: selectedChainId === 'all' ? '#7B61FF' : (isDark ? '#2E2856' : '#E5E7EB')
                }}
                className="w-12 h-12 rounded-full items-center justify-center border shadow-sm"
              >
                <Ionicons name="grid-outline" size={20} color={selectedChainId === 'all' ? '#7B61FF' : '#9ca3af'} />
              </View>
              <Text 
                style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}
                className="text-[10px] font-bold mt-1 text-center"
              >
                {language === 'vi' ? 'Tất cả' : 'All'}
              </Text>
            </TouchableOpacity>

            {theaterChains.map((chain) => (
              <TouchableOpacity
                key={chain.id}
                onPress={() => setSelectedChainId(chain.id)}
                className={`items-center mr-4 p-1 rounded-2xl ${
                  selectedChainId === chain.id ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <View 
                  style={{
                    backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                    borderColor: selectedChainId === chain.id ? '#7B61FF' : (isDark ? '#2E2856' : '#F3F4F6')
                  }}
                  className="w-12 h-12 rounded-full overflow-hidden border shadow-sm justify-center items-center"
                >
                  <Image
                    source={{ uri: chain.logo }}
                    className="w-10 h-10 rounded-full"
                    resizeMode="contain"
                  />
                </View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}
                  className="text-[10px] font-bold mt-1 text-center" 
                  numberOfLines={1}
                >
                  {chain.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Cinemas List */}
      {loading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#7B61FF" />
          <Text className="text-gray-400 text-xs mt-3">
            {language === 'vi' ? 'Đang tải danh sách rạp...' : 'Loading cinemas list...'}
          </Text>
        </View>
      ) : displayBranches.length === 0 ? (
        <View className="py-20 items-center justify-center px-4">
          <Ionicons name="location-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-sm mt-3 text-center">
            {language === 'vi' ? 'Không tìm thấy rạp nào phù hợp với bộ lọc.' : 'No matching cinemas found.'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="px-4"
        >
          <View className="gap-y-4">
            {displayBranches.map((branch) => (
              <TouchableOpacity
                key={branch.id.toString()}
                style={{
                  backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
                  borderColor: isDark ? '#2E2856' : '#F3F4F6',
                  borderWidth: 1,
                }}
                className="rounded-3xl overflow-hidden shadow-sm flex-row p-3 items-center"
              >
                {/* Branch Image */}
                <View className="w-24 h-24 rounded-2xl overflow-hidden mr-3.5 bg-gray-100">
                  <Image
                    source={{ uri: branch.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Branch details */}
                <View className="flex-1">
                  {/* Brand & Name */}
                  <View className="flex-row items-center mb-1 flex-wrap">
                    <Image
                      source={{ uri: branch.chainLogo }}
                      className="w-4 h-4 rounded-full mr-1.5"
                      resizeMode="contain"
                    />
                    <Text className="text-xs font-bold text-[#7B61FF] uppercase tracking-wider">{branch.chainName}</Text>
                  </View>

                  <Text 
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="text-sm font-bold leading-5 mb-1.5" 
                    numberOfLines={1}
                  >
                    {branch.name}
                  </Text>

                  {/* Rating & Price */}
                  <View className="flex-row items-center mb-1.5">
                    <Text className="text-yellow-500 text-[10px] mr-1">⭐</Text>
                    <Text 
                      style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}
                      className="text-[11px] font-semibold mr-2.5"
                    >
                      {branch.rating}
                    </Text>
                    <Text className="text-gray-300 text-xs mr-2.5">|</Text>
                    <Text 
                      style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                      className="text-[10px] font-medium" 
                      numberOfLines={1}
                    >
                      {branch.priceRange}
                    </Text>
                  </View>

                  {/* Address */}
                  <View className="flex-row items-start pr-2">
                    <Ionicons name="location-outline" size={12} color="#9ca3af" style={{ marginTop: 1, marginRight: 2 }} />
                    <Text 
                      style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                      className="text-[11px] leading-4" 
                      numberOfLines={2}
                    >
                      {branch.address}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
