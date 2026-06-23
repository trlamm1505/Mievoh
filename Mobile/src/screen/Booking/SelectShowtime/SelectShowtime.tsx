import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
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
import { useBooking, BookingShowtime } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { getShowtimesByMovieApi } from '../../../axios/movie';
import { toast } from '../../../components/Toast/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CinemaShowtimeGroup = {
  key: string;
  cinemaName: string;
  showtimes: any[];
};

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const SHOWTIME_DATE_TIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const getShowtimeWallClockTime = (showDateTime?: string | null) => {
  if (!showDateTime) return NaN;

  const match = showDateTime.match(SHOWTIME_DATE_TIME_REGEX);
  if (!match) return new Date(showDateTime).getTime();

  const [, year, month, day, hour, minute] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
};

const getCurrentVietnamWallClockTime = () => (
  Math.floor((new Date().getTime() + VIETNAM_OFFSET_MS) / 60000) * 60000
);

const formatShowtimeTime = (showDateTime: string | null | undefined, locale: string) => {
  const match = showDateTime?.match(SHOWTIME_DATE_TIME_REGEX);
  if (match) return `${match[4]}:${match[5]}`;

  return new Date(showDateTime || 0).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isFutureShowtime = (showtime: any, now: number) => {
  const showtimeTime = getShowtimeWallClockTime(showtime?.showDateTime);
  return Number.isFinite(showtimeTime) && showtimeTime > now;
};

const sortShowtimesByTime = (showtimes: any[]) => (
  [...showtimes].sort((a, b) => {
    const timeA = getShowtimeWallClockTime(a?.showDateTime);
    const timeB = getShowtimeWallClockTime(b?.showDateTime);
    return timeA - timeB;
  })
);

const subscribeToCurrentMinute = (onStoreChange: () => void) => {
  const timer = setInterval(onStoreChange, 30000);
  return () => clearInterval(timer);
};

const getCurrentMinuteSnapshot = getCurrentVietnamWallClockTime;

const getShowtimeCinemaName = (showtime: any) => (
  showtime?.Cinema?.name || showtime?.cinemaName || showtime?.cinema?.name || 'Cinema'
);

const getCinemaShowtimeGroups = (complex: any, now: number): CinemaShowtimeGroup[] => {
  const nestedCinemas = complex?.cinemas || complex?.Cinemas;
  if (Array.isArray(nestedCinemas) && nestedCinemas.length > 0) {
    return nestedCinemas
      .map((cinema: any) => {
        const showtimes = cinema?.showtimes || cinema?.Showtimes || [];
        const cinemaName = cinema?.name || cinema?.cinemaName || 'Cinema';

        return {
          key: cinema?.cinemaId || cinemaName,
          cinemaName,
          showtimes: sortShowtimesByTime(showtimes.map((st: any) => ({
            ...st,
            cinemaId: st?.cinemaId || cinema?.cinemaId || '',
            Cinema: st?.Cinema || cinema,
          })).filter((st: any) => isFutureShowtime(st, now))),
        };
      })
      .filter((group: CinemaShowtimeGroup) => group.showtimes.length > 0);
  }

  const showtimes = complex?.showtimes || complex?.Showtimes || [];
  const groups = new Map<string, CinemaShowtimeGroup>();

  showtimes.filter((st: any) => isFutureShowtime(st, now)).forEach((st: any) => {
    const cinemaName = getShowtimeCinemaName(st);
    const key = st?.cinemaId || st?.Cinema?.cinemaId || cinemaName;

    if (!groups.has(key)) {
      groups.set(key, { key, cinemaName, showtimes: [] });
    }

    groups.get(key)?.showtimes.push(st);
  });

  return Array.from(groups.values()).map(group => ({
    ...group,
    showtimes: sortShowtimesByTime(group.showtimes),
  }));
};

export default function SelectShowtime() {
  const navigation = useAppNavigation();
  const { state, setShowtime, setStep } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  const { isLoggedIn } = useAuth();

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showtimesData, setShowtimesData] = useState<any>(null);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(null);
  const [selectedShowtimeInfo, setSelectedShowtimeInfo] = useState<BookingShowtime | null>(null);
  const currentTime = useSyncExternalStore(
    subscribeToCurrentMinute,
    getCurrentMinuteSnapshot,
    getCurrentMinuteSnapshot
  );

  const movie = state.movie;

  // Generate date list for the next 7 days
  const dateOptions = useMemo(() => {
    const list = [];
    const weekdays = language === 'vi'
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date(getCurrentVietnamWallClockTime());

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() + i);

      const dayNum = d.getUTCDate();
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const monthNum = d.getUTCMonth() + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const year = d.getUTCFullYear();

      const queryDate = `${dayStr}/${monthStr}/${year}`;

      let label = weekdays[d.getUTCDay()];
      if (i === 0) label = language === 'vi' ? 'Hôm nay' : 'Today';

      list.push({
        label,
        dateNum: dayStr,
        monthStr,
        queryDate,
      });
    }
    return list;
  }, [language]);
  useEffect(() => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
    }
  }, [isLoggedIn]);

  // Fetch Showtimes
  useEffect(() => {
    if (!isLoggedIn || !movie?.movieId) return;

    const fetchShowtimes = async () => {
      setShowtimesData(null);
      setLoadingShowtimes(true);
      setSelectedShowtimeId(null);
      setSelectedShowtimeInfo(null);
      try {
        const dateStr = dateOptions[selectedDateIndex].queryDate;
        const res = await getShowtimesByMovieApi(movie.movieId, dateStr);
        setShowtimesData(res);
      } catch (err) {
        console.error('Error fetching showtimes:', err);
        setShowtimesData(null);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
  }, [isLoggedIn, movie?.movieId, selectedDateIndex, dateOptions]);

  const handleSelectShowtime = (st: any, complex: any, cinemaName?: string) => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
      return;
    }

    const info: BookingShowtime = {
      showtimeId: st.showtimeId,
      showDateTime: st.showDateTime,
      format: st.format || '2D',
      ticketPrice: st.ticketPrice || 0,
      cinemaId: st.cinemaId || '',
      cinemaName: cinemaName || st.Cinema?.name || st.cinemaName || '',
      cinemaComplexId: complex.cinemaComplexId || '',
      cinemaComplexName: complex.name || '',
      cinemaComplexAddress: complex.address || '',
    };
    setSelectedShowtimeId(st.showtimeId);
    setSelectedShowtimeInfo(info);
  };

  const selectedShowtimeIsAvailable = selectedShowtimeInfo
    ? isFutureShowtime(selectedShowtimeInfo, currentTime)
    : false;

  const handleContinue = () => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
      return;
    }

    if (!selectedShowtimeInfo) {
      toast.error(language === 'vi' ? 'Vui lòng chọn suất chiếu' : 'Please select a showtime');
      return;
    }
    if (!selectedShowtimeIsAvailable) {
      toast.error(language === 'vi' ? 'Suất chiếu đã qua giờ' : 'This showtime has already passed');
      return;
    }

    setShowtime(selectedShowtimeInfo);
    setStep(2);
    navigation.goToSelectSeat();
  };

  const visibleCinemaSystems = useMemo(() => {
    const systems = showtimesData?.cinemaSystems;
    if (!Array.isArray(systems)) return [];

    return systems
      .map((system: any) => {
        const complexes = system?.cinemaComplexes || system?.CinemaComplexes || [];
        const visibleComplexes = Array.isArray(complexes)
          ? complexes
            .map((complex: any) => ({
              ...complex,
              showtimeGroups: getCinemaShowtimeGroups(complex, currentTime),
            }))
            .filter((complex: any) => complex.showtimeGroups.length > 0)
          : [];

        return {
          ...system,
          visibleComplexes,
        };
      })
      .filter((system: any) => system.visibleComplexes.length > 0);
  }, [showtimesData, currentTime]);

  if (!movie) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
        <Ionicons name="film-outline" size={48} color="#9CA3AF" />
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          {language === 'vi' ? 'Không tìm thấy thông tin phim' : 'Movie information not found'}
        </Text>
      </View>
    );
  }

  const movieTitle = language === 'vi'
    ? (movie.title_vi || movie.title_en || '')
    : (movie.title_en || movie.title_vi || '');

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]} numberOfLines={1}>
            {t('select_showtime')}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Movie Info Card */}
      <View style={[styles.movieCard, isDark && styles.movieCardDark]}>
        {movie.imageUrl && (
          <Image source={{ uri: movie.imageUrl }} style={styles.moviePoster} resizeMode="cover" />
        )}
        <View style={styles.movieInfo}>
          <Text style={[styles.movieTitle, isDark && styles.movieTitleDark]} numberOfLines={2}>
            {movieTitle}
          </Text>
          <View style={styles.movieMeta}>
            {movie.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#7B61FF" />
                <Text style={styles.metaText}>{movie.duration} {language === 'vi' ? 'phút' : 'mins'}</Text>
              </View>
            )}
            {movie.ageRestriction && (
              <View style={[styles.ageBadge]}>
                <Text style={styles.ageBadgeText}>{movie.ageRestriction}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Date Picker */}
      <View style={styles.datePickerContainer}>
        <Text style={[styles.sectionLabel, isDark && styles.sectionLabelDark]}>
          {t('select_date')}
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

      {/* Showtime List */}
      <ScrollView
        style={styles.showtimesList}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingShowtimes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7B61FF" />
            <Text style={styles.loadingText}>
              {language === 'vi' ? 'Đang tìm suất chiếu...' : 'Finding showtimes...'}
            </Text>
          </View>
        ) : visibleCinemaSystems.length === 0 ? (
          <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
            <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {language === 'vi' ? 'Chưa có suất chiếu vào ngày này' : 'No showtimes on this date'}
            </Text>
          </View>
        ) : (
          visibleCinemaSystems.map((system: any) => (
            <View key={system.cinemaSystemId} style={[styles.systemCard, isDark && styles.systemCardDark]}>
              {/* Cinema System Header */}
              <View style={styles.systemHeader}>
                {system.logo ? (
                  <Image source={{ uri: system.logo }} style={styles.systemLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.systemIconPlaceholder}>
                    <Ionicons name="film" size={16} color="#7B61FF" />
                  </View>
                )}
                <Text style={[styles.systemName, isDark && styles.systemNameDark]}>{system.name}</Text>
              </View>

              {/* Complexes */}
              {system.visibleComplexes.map((complex: any) => (
                <View key={complex.cinemaComplexId} style={[styles.complexCard, isDark && styles.complexCardDark]}>
                  <View style={styles.complexInfo}>
                    <Text style={[styles.complexName, isDark && styles.complexNameDark]}>{complex.name}</Text>
                    <Text style={[styles.complexAddress, isDark && styles.complexAddressDark]} numberOfLines={1}>
                      {complex.address}
                    </Text>
                  </View>

                  {/* Time Slots */}
                  {complex.showtimeGroups.map((group: CinemaShowtimeGroup) => (
                    <View key={group.key} style={[styles.cinemaGroupContainer, isDark && styles.cinemaGroupContainerDark]}>
                      <View style={styles.hallLabel}>
                        <Ionicons name="tv-outline" size={13} color="#9CA3AF" />
                        <Text style={[styles.hallLabelText, isDark && styles.hallLabelTextDark]}>
                          {group.cinemaName}
                        </Text>
                      </View>
                      <View style={styles.timeSlotsRow}>
                        {group.showtimes.map((st: any) => {
                          const isActive = selectedShowtimeId === st.showtimeId;
                          const time = formatShowtimeTime(
                            st.showDateTime,
                            language === 'vi' ? 'vi-VN' : 'en-US'
                          );
                          return (
                            <TouchableOpacity
                              key={st.showtimeId}
                              onPress={() => handleSelectShowtime(st, complex, group.cinemaName)}
                              activeOpacity={0.7}
                              style={[
                                styles.timeSlot,
                                isDark && !isActive && styles.timeSlotDark,
                                isActive && styles.timeSlotActive,
                              ]}
                            >
                              <Text style={[
                                styles.timeSlotTime,
                                isActive && styles.timeSlotTimeActive,
                              ]}>
                                {time}
                              </Text>
                              <Text style={[
                                styles.timeSlotFormat,
                                isActive && styles.timeSlotFormatActive,
                              ]}>
                                {st.format || '2D'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedShowtimeInfo && selectedShowtimeIsAvailable && (
        <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
          <View style={styles.bottomBarInfo}>
            <Text style={[styles.bottomBarLabel, isDark && styles.bottomBarLabelDark]}>
              {selectedShowtimeInfo.cinemaComplexName}
            </Text>
            <Text style={styles.bottomBarTime}>
              {formatShowtimeTime(
                selectedShowtimeInfo.showDateTime,
                language === 'vi' ? 'vi-VN' : 'en-US'
              )}
              {' • '}
              {selectedShowtimeInfo.format}
            </Text>
          </View>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} style={styles.continueBtn}>
            <LinearGradient
              colors={['#A38FFF', '#7B61FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueBtnText}>
                {t('booking_continue')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  containerDark: {
    backgroundColor: '#0F0C20',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAF8FF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerDark: {
    backgroundColor: '#0F0C20',
    borderBottomColor: '#1E1B3A',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  // Movie Card
  movieCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  movieCardDark: {
    backgroundColor: '#1A1740',
  },
  moviePoster: {
    width: 56,
    height: 80,
    borderRadius: 10,
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  movieTitleDark: {
    color: '#F9FAFB',
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ageBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Date Picker
  datePickerContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sectionLabelDark: {
    color: '#D1D5DB',
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    minWidth: 58,
  },
  dateItemDark: {
    backgroundColor: '#1E1B3A',
  },
  dateItemActive: {
    backgroundColor: '#7B61FF',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  dateLabelDark: {
    color: '#9CA3AF',
  },
  dateLabelActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  dateNumDark: {
    color: '#E5E7EB',
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  dateMonthDark: {
    color: '#6B7280',
  },
  dateMonthActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Showtimes List
  showtimesList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginTop: 8,
  },
  emptyContainerDark: {
    backgroundColor: '#1A1740',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#6B7280',
  },
  // System Card
  systemCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  systemCardDark: {
    backgroundColor: '#1A1740',
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 8,
  },
  systemIconPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  systemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  systemNameDark: {
    color: '#F9FAFB',
  },
  // Complex
  complexCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  complexCardDark: {
    borderTopColor: '#2E2856',
  },
  complexInfo: {
    marginBottom: 10,
  },
  cinemaGroupContainer: {
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cinemaGroupContainerDark: {
    borderTopColor: '#2E2856',
  },
  hallLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  hallLabelText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  hallLabelTextDark: {
    color: '#9CA3AF',
  },
  complexName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  complexNameDark: {
    color: '#D1D5DB',
  },
  complexAddress: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  complexAddressDark: {
    color: '#6B7280',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 72,
  },
  timeSlotDark: {
    borderColor: '#2E2856',
    backgroundColor: '#1E1B3A',
  },
  timeSlotActive: {
    borderColor: '#7B61FF',
    backgroundColor: '#F3E8FF',
  },
  timeSlotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  timeSlotTimeActive: {
    color: '#7B61FF',
  },
  timeSlotFormat: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timeSlotFormatActive: {
    color: '#7B61FF',
  },
  timeSlotDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    opacity: 0.45,
  },
  timeSlotDisabledDark: {
    borderColor: '#1E1B3A',
    backgroundColor: '#110E2E',
    opacity: 0.35,
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarDark: {
    backgroundColor: '#1A1740',
    borderTopColor: '#2E2856',
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomBarLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  bottomBarLabelDark: {
    color: '#E5E7EB',
  },
  bottomBarTime: {
    fontSize: 12,
    color: '#7B61FF',
    fontWeight: '600',
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  continueBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
