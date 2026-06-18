import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '../../../navigation/navigation';
import { useBooking, BookingMovie, BookingShowtime } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { getShowtimesByComplexApi } from '../../../axios/cinemas';
import { useLocalSearchParams } from 'expo-router';
import { toast } from '../../../components/Toast/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CinemaShowtime() {
  const navigation = useAppNavigation();
  const { setMovie, setShowtime, setStep, resetBooking } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  // Get complex info from route params
  const params = useLocalSearchParams<{
    complexId: string;
    complexName: string;
    complexAddress: string;
    cinemaSystemName: string;
    cinemaSystemLogo: string;
  }>();

  const complexId = params.complexId || '';
  const complexName = params.complexName || '';
  const complexAddress = params.complexAddress || '';
  const cinemaSystemName = params.cinemaSystemName || '';
  const cinemaSystemLogo = params.cinemaSystemLogo || '';

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showtimesData, setShowtimesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Generate date list for next 7 days
  const dateOptions = useMemo(() => {
    const list = [];
    const weekdays = language === 'vi'
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const dayNum = d.getDate();
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const monthNum = d.getMonth() + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const year = d.getFullYear();

      const queryDate = `${dayStr}/${monthStr}/${year}`;

      let label = weekdays[d.getDay()];
      if (i === 0) label = language === 'vi' ? 'Hôm nay' : 'Today';

      list.push({ label, dateNum: dayStr, monthStr, queryDate });
    }
    return list;
  }, [language]);

  // Fetch showtimes by complex
  useEffect(() => {
    if (!complexId) return;

    const fetchData = async () => {
      setLoading(true);
      setShowtimesData(null);
      try {
        const dateStr = dateOptions[selectedDateIndex].queryDate;
        const res = await getShowtimesByComplexApi(complexId, dateStr);
        setShowtimesData(res);
      } catch (err) {
        console.error('Error fetching showtimes by complex:', err);
        setShowtimesData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [complexId, selectedDateIndex, dateOptions]);

  // Parse movie list from showtimes data
  const movieList = useMemo(() => {
    if (!showtimesData) return [];

    // The API response can be:
    // { movies: [...] } or [...] or { data: [...] }
    let movies = showtimesData?.movies || showtimesData?.data || showtimesData;
    if (!Array.isArray(movies)) return [];

    return movies;
  }, [showtimesData]);

  const handleSelectShowtime = (movie: any, st: any, cinemaName: string) => {
    // Reset previous booking state
    resetBooking();

    // Set movie info
    const bookingMovie: BookingMovie = {
      movieId: movie.movieId,
      title_vi: movie.title_vi || movie.title || null,
      title_en: movie.title_en || movie.title || null,
      imageUrl: movie.imageUrl || movie.posterUrl || null,
      duration: movie.duration || null,
      ageRestriction: movie.ageRestriction || null,
    };
    setMovie(bookingMovie);

    // Set showtime info
    const bookingShowtime: BookingShowtime = {
      showtimeId: st.showtimeId,
      showDateTime: st.showDateTime || '',
      format: st.format || '2D',
      ticketPrice: st.ticketPrice || 0,
      cinemaId: st.cinemaId || '',
      cinemaName: cinemaName || '',
      cinemaComplexId: complexId,
      cinemaComplexName: complexName,
      cinemaComplexAddress: complexAddress,
    };
    setShowtime(bookingShowtime);

    // Skip to step 2 (seat selection)
    setStep(2);
    navigation.goToSelectSeat();
  };

  const getMovieTitle = (movie: any) => {
    if (language === 'vi') {
      return movie.title_vi || movie.title_en || movie.title || '';
    }
    return movie.title_en || movie.title_vi || movie.title || '';
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]} numberOfLines={1}>
            {language === 'vi' ? 'Chọn suất chiếu' : 'Select Showtime'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Cinema Info Card */}
      <View style={[styles.cinemaCard, isDark && styles.cinemaCardDark]}>
        <View style={styles.cinemaCardRow}>
          {cinemaSystemLogo ? (
            <Image source={{ uri: cinemaSystemLogo }} style={styles.cinemaLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.cinemaLogo, styles.cinemaLogoPlaceholder]}>
              <Ionicons name="film" size={20} color="#7B61FF" />
            </View>
          )}
          <View style={styles.cinemaInfo}>
            {cinemaSystemName ? (
              <Text style={styles.cinemaSystemLabel}>{cinemaSystemName}</Text>
            ) : null}
            <Text style={[styles.cinemaName, isDark && styles.cinemaNameDark]} numberOfLines={1}>
              {complexName}
            </Text>
            {complexAddress ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                <Text style={styles.cinemaAddress} numberOfLines={1}>{complexAddress}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Date Picker */}
      <View style={styles.datePickerContainer}>
        <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>
          {language === 'vi' ? 'Ngày chiếu' : 'Show Date'}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {dateOptions.map((date, idx) => {
            const isSelected = selectedDateIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDateIndex(idx)}
                activeOpacity={0.8}
                style={[
                  styles.dateItem,
                  isDark && !isSelected && styles.dateItemDark,
                  isSelected && styles.dateItemActive,
                ]}
              >
                <Text style={[
                  styles.dateLabel,
                  isDark && !isSelected && styles.dateLabelDark,
                  isSelected && styles.dateLabelActive,
                ]}>
                  {date.label}
                </Text>
                <Text style={[
                  styles.dateNum,
                  isDark && !isSelected && styles.dateNumDark,
                  isSelected && styles.dateNumActive,
                ]}>
                  {date.dateNum}
                </Text>
                <Text style={[
                  styles.dateMonth,
                  isDark && !isSelected && styles.dateMonthDark,
                  isSelected && styles.dateMonthActive,
                ]}>
                  T{date.monthStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Movies & Showtimes List */}
      <ScrollView
        style={styles.moviesList}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7B61FF" />
            <Text style={styles.loadingText}>
              {language === 'vi' ? 'Đang tìm phim & suất chiếu...' : 'Finding movies & showtimes...'}
            </Text>
          </View>
        ) : movieList.length === 0 ? (
          <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
            <Ionicons name="film-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {language === 'vi' ? 'Chưa có phim chiếu vào ngày này' : 'No movies on this date'}
            </Text>
          </View>
        ) : (
          movieList.map((movie: any) => {
            const title = getMovieTitle(movie);
            const showtimes = movie.showtimes || movie.Showtimes || [];

            // Group showtimes by cinema (hall)
            const cinemaGroups: Record<string, { cinemaName: string; showtimes: any[] }> = {};
            showtimes.forEach((st: any) => {
              const cinemaName = st.Cinema?.name || st.cinemaName || 'Phòng chiếu';
              const key = st.cinemaId || cinemaName;
              if (!cinemaGroups[key]) {
                cinemaGroups[key] = { cinemaName, showtimes: [] };
              }
              cinemaGroups[key].showtimes.push(st);
            });

            return (
              <View key={movie.movieId} style={[styles.movieCard, isDark && styles.movieCardDark]}>
                {/* Movie Info Row */}
                <View style={styles.movieRow}>
                  {(movie.imageUrl || movie.posterUrl) && (
                    <Image
                      source={{ uri: movie.imageUrl || movie.posterUrl }}
                      style={styles.moviePoster}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.movieInfo}>
                    <Text style={[styles.movieTitle, isDark && styles.movieTitleDark]} numberOfLines={2}>
                      {title}
                    </Text>
                    <View style={styles.movieMeta}>
                      {movie.duration && (
                        <View style={styles.metaChip}>
                          <Ionicons name="time-outline" size={12} color="#7B61FF" />
                          <Text style={styles.metaChipText}>{movie.duration} {language === 'vi' ? 'phút' : 'min'}</Text>
                        </View>
                      )}
                      {movie.ageRestriction && (
                        <View style={[styles.metaChip, styles.ageChip]}>
                          <Text style={styles.ageChipText}>{movie.ageRestriction}</Text>
                        </View>
                      )}
                      {movie.rating && (
                        <View style={styles.metaChip}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.metaChipText}>{movie.rating}</Text>
                        </View>
                      )}
                    </View>
                    {movie.genre && (
                      <Text style={styles.movieGenre} numberOfLines={1}>{movie.genre}</Text>
                    )}
                  </View>
                </View>

                {/* Showtimes grouped by cinema/hall */}
                {Object.keys(cinemaGroups).length > 0 ? (
                  Object.entries(cinemaGroups).map(([key, group]) => (
                    <View key={key} style={styles.cinemaGroupContainer}>
                      <View style={styles.hallLabel}>
                        <Ionicons name="tv-outline" size={13} color="#9CA3AF" />
                        <Text style={[styles.hallLabelText, isDark && styles.hallLabelTextDark]}>
                          {group.cinemaName}
                        </Text>
                      </View>
                      <View style={styles.timeSlotsRow}>
                        {group.showtimes.map((st: any) => {
                          const time = new Date(st.showDateTime).toLocaleTimeString(
                            language === 'vi' ? 'vi-VN' : 'en-US',
                            { hour: '2-digit', minute: '2-digit' }
                          );
                          return (
                            <TouchableOpacity
                              key={st.showtimeId}
                              onPress={() => handleSelectShowtime(movie, st, group.cinemaName)}
                              activeOpacity={0.7}
                              style={[styles.timeSlot, isDark && styles.timeSlotDark]}
                            >
                              <Text style={[styles.timeSlotTime, isDark && styles.timeSlotTimeDark]}>
                                {time}
                              </Text>
                              <Text style={styles.timeSlotFormat}>{st.format || '2D'}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noShowtimes}>
                    <Text style={styles.noShowtimesText}>
                      {language === 'vi' ? 'Không có suất chiếu' : 'No showtimes available'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FF' },
  containerDark: { backgroundColor: '#0F0C20' },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: '#FAF8FF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerDark: { backgroundColor: '#0F0C20', borderBottomColor: '#1E1B3A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  headerTitleDark: { color: '#F9FAFB' },
  // Cinema Info Card
  cinemaCard: {
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  cinemaCardDark: { backgroundColor: '#1A1740' },
  cinemaCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cinemaLogo: { width: 44, height: 44, borderRadius: 12 },
  cinemaLogoPlaceholder: {
    backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center',
  },
  cinemaInfo: { flex: 1 },
  cinemaSystemLabel: { fontSize: 10, fontWeight: '700', color: '#7B61FF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cinemaName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  cinemaNameDark: { color: '#F9FAFB' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cinemaAddress: { fontSize: 11, color: '#9CA3AF', flex: 1 },
  // Date Picker
  datePickerContainer: { marginTop: 16, marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, paddingHorizontal: 16 },
  sectionLabelDark: { color: '#D1D5DB' },
  dateItem: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: '#F3F4F6', minWidth: 58,
  },
  dateItemDark: { backgroundColor: '#1E1B3A' },
  dateItemActive: { backgroundColor: '#7B61FF' },
  dateLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  dateLabelDark: { color: '#9CA3AF' },
  dateLabelActive: { color: 'rgba(255,255,255,0.8)' },
  dateNum: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  dateNumDark: { color: '#E5E7EB' },
  dateNumActive: { color: '#FFFFFF' },
  dateMonth: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  dateMonthDark: { color: '#6B7280' },
  dateMonthActive: { color: 'rgba(255,255,255,0.7)' },
  // Movies List
  moviesList: { flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  loadingText: { fontSize: 13, color: '#9CA3AF' },
  emptyContainer: {
    alignItems: 'center', paddingVertical: 60, gap: 14,
    backgroundColor: '#F9FAFB', borderRadius: 20, marginTop: 8,
  },
  emptyContainerDark: { backgroundColor: '#1A1740' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  // Movie Card
  movieCard: {
    marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  movieCardDark: { backgroundColor: '#1A1740' },
  movieRow: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  moviePoster: { width: 72, height: 105, borderRadius: 12 },
  movieInfo: { flex: 1, justifyContent: 'center' },
  movieTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  movieTitleDark: { color: '#F9FAFB' },
  movieMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3E8FF', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  metaChipText: { fontSize: 10, color: '#7B61FF', fontWeight: '600' },
  ageChip: { backgroundColor: '#FEE2E2' },
  ageChipText: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  movieGenre: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  // Cinema Group
  cinemaGroupContainer: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  hallLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  hallLabelText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  hallLabelTextDark: { color: '#9CA3AF' },
  // Time Slots
  timeSlotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
    alignItems: 'center', minWidth: 72,
  },
  timeSlotDark: { borderColor: '#2E2856', backgroundColor: '#1E1B3A' },
  timeSlotTime: { fontSize: 14, fontWeight: '700', color: '#374151' },
  timeSlotTimeDark: { color: '#E5E7EB' },
  timeSlotFormat: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  // No showtimes
  noShowtimes: { paddingVertical: 12, alignItems: 'center' },
  noShowtimesText: { fontSize: 12, color: '#9CA3AF' },
});
