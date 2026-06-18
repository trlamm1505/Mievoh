import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '../../../navigation/navigation';
import { useBooking } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { getSeatsStatusApi, SeatStatus } from '../../../axios/booking';
import { toast } from '../../../components/Toast/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Seat type colors
const SEAT_COLORS = {
  Regular: { available: '#D1D5DB', selected: '#7B61FF', border: '#9CA3AF' },
  VIP: { available: '#FDE68A', selected: '#7B61FF', border: '#F59E0B' },
  Sweetbox: { available: '#FBCFE8', selected: '#7B61FF', border: '#EC4899' },
};

const getSeatColor = (seat: SeatStatus, isSelected: boolean) => {
  const type = seat.seatType as keyof typeof SEAT_COLORS;
  const colors = SEAT_COLORS[type] || SEAT_COLORS.Regular;

  if (seat.status === 'SOLD') return '#374151';
  if (seat.status === 'HELD') return '#EF4444';
  if (isSelected) return colors.selected;
  return colors.available;
};

export default function SelectSeat() {
  const navigation = useAppNavigation();
  const { state, addSeat, removeSeat, clearSeats, setStep } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const [allSeats, setAllSeats] = useState<SeatStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const showtime = state.showtime;
  const selectedSeats = state.selectedSeats;

  // Fetch seats
  useEffect(() => {
    if (!showtime?.showtimeId) return;

    const fetchSeats = async () => {
      setLoading(true);
      try {
        const res = await getSeatsStatusApi(showtime.showtimeId);
        const seatsData = res?.data || res;
        if (Array.isArray(seatsData)) {
          setAllSeats(seatsData);
        } else {
          setAllSeats([]);
        }
      } catch (err) {
        console.error('Error fetching seats:', err);
        toast.error(language === 'vi' ? 'Không thể tải sơ đồ ghế' : 'Failed to load seat map');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtime?.showtimeId]);

  // Group seats by row (first char of name)
  const seatRows = useMemo(() => {
    const rows: Record<string, SeatStatus[]> = {};
    allSeats.forEach(seat => {
      const row = seat.name.charAt(0).toUpperCase();
      if (!rows[row]) rows[row] = [];
      rows[row].push(seat);
    });

    // Sort each row by seat number
    Object.keys(rows).forEach(row => {
      rows[row].sort((a, b) => {
        const numA = parseInt(a.name.slice(1)) || 0;
        const numB = parseInt(b.name.slice(1)) || 0;
        return numA - numB;
      });
    });

    return rows;
  }, [allSeats]);

  const sortedRowKeys = useMemo(() => {
    return Object.keys(seatRows).sort();
  }, [seatRows]);

  const maxSeatsPerRow = useMemo(() => {
    return Math.max(...Object.values(seatRows).map(r => r.length), 1);
  }, [seatRows]);

  const seatSize = useMemo(() => {
    const availableWidth = SCREEN_WIDTH - 80; // Padding + row label
    const size = Math.floor(availableWidth / maxSeatsPerRow) - 4;
    return Math.min(Math.max(size, 28), 42);
  }, [maxSeatsPerRow]);

  const isSelected = (seatId: string) => selectedSeats.some(s => s.seatId === seatId);

  const handleToggleSeat = (seat: SeatStatus) => {
    if (seat.status === 'SOLD' || seat.status === 'HELD') return;

    if (isSelected(seat.seatId)) {
      removeSeat(seat.seatId);
    } else {
      if (selectedSeats.length >= 8) {
        toast.error(t('toast_max_seats_limit'));
        return;
      }
      addSeat(seat);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast.error(t('toast_select_seat_required'));
      return;
    }
    setStep(3);
    navigation.goToSelectCombo();
  };

  const seatsTotalPrice = selectedSeats.length * (showtime?.ticketPrice || 0);

  if (!showtime) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>
          {language === 'vi' ? 'Chưa chọn suất chiếu' : 'No showtime selected'}
        </Text>
      </View>
    );
  }

  const movieTitle = language === 'vi'
    ? (state.movie?.title_vi || state.movie?.title_en || '')
    : (state.movie?.title_en || state.movie?.title_vi || '');

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]} numberOfLines={1}>
            {t('select_seat_title')}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {movieTitle}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Showtime Info Bar */}
      <View style={[styles.infoBar, isDark && styles.infoBarDark]}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color="#7B61FF" />
          <Text style={[styles.infoText, isDark && styles.infoTextDark]} numberOfLines={1}>
            {showtime.cinemaComplexName}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#7B61FF" />
          <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
            {new Date(showtime.showDateTime).toLocaleTimeString(
              language === 'vi' ? 'vi-VN' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            )}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="film-outline" size={14} color="#7B61FF" />
          <Text style={[styles.infoText, isDark && styles.infoTextDark]}>{showtime.format}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.seatMapContainer}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B61FF" />
            <Text style={styles.loadingText}>
              {language === 'vi' ? 'Đang tải sơ đồ ghế...' : 'Loading seat map...'}
            </Text>
          </View>
        ) : (
          <>
            {/* Screen indicator */}
            <View style={styles.screenContainer}>
              <LinearGradient
                colors={['#A38FFF', '#7B61FF', '#A38FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.screenBar}
              />
              <Text style={[styles.screenLabel, isDark && styles.screenLabelDark]}>
                {t('screen')}
              </Text>
            </View>

            {/* Seat Grid */}
            <View style={styles.seatGrid}>
              {sortedRowKeys.map(row => (
                <View key={row} style={styles.seatRow}>
                  <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>{row}</Text>
                  <View style={styles.seatsInRow}>
                    {seatRows[row].map(seat => {
                      const selected = isSelected(seat.seatId);
                      const isSweetbox = seat.seatType === 'Sweetbox';
                      const isDisabled = seat.status === 'SOLD' || seat.status === 'HELD';

                      return (
                        <TouchableOpacity
                          key={seat.seatId}
                          onPress={() => handleToggleSeat(seat)}
                          disabled={isDisabled}
                          activeOpacity={0.7}
                          style={[
                            styles.seat,
                            {
                              width: isSweetbox ? seatSize * 2 + 4 : seatSize,
                              height: seatSize,
                              backgroundColor: getSeatColor(seat, selected),
                              borderRadius: 6,
                            },
                            isDisabled && styles.seatDisabled,
                          ]}
                        >
                          <Text style={[
                            styles.seatText,
                            { fontSize: seatSize < 34 ? 8 : 10 },
                            selected && styles.seatTextSelected,
                            isDisabled && styles.seatTextDisabled,
                          ]}>
                            {seat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>{row}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_status_available')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#7B61FF' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_status_selected')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_status_booked')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_status_holding')}</Text>
                </View>
              </View>
              <View style={[styles.legendRow, { marginTop: 8 }]}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#D1D5DB', borderWidth: 1, borderColor: '#9CA3AF' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_type_regular')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FDE68A', borderWidth: 1, borderColor: '#F59E0B' }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_type_vip')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FBCFE8', borderWidth: 1, borderColor: '#EC4899', width: 24 }]} />
                  <Text style={[styles.legendText, isDark && styles.legendTextDark]}>{t('seat_type_sweetbox')}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Summary Bar */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.bottomLabel, isDark && styles.bottomLabelDark]}>
            {selectedSeats.length > 0
              ? selectedSeats.map(s => s.name).join(', ')
              : t('no_seats_selected')
            }
          </Text>
          <Text style={styles.bottomPrice}>
            {seatsTotalPrice.toLocaleString('vi-VN')} đ
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          style={[styles.continueBtn, selectedSeats.length === 0 && styles.continueBtnDisabled]}
          disabled={selectedSeats.length === 0}
        >
          <LinearGradient
            colors={selectedSeats.length > 0 ? ['#A38FFF', '#7B61FF'] : ['#9CA3AF', '#6B7280']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            <Text style={styles.continueBtnText}>{t('booking_continue')}</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FF' },
  containerDark: { backgroundColor: '#0F0C20' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 8, paddingHorizontal: 16,
    backgroundColor: '#FAF8FF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerDark: { backgroundColor: '#0F0C20', borderBottomColor: '#1E1B3A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  headerTitleDark: { color: '#F9FAFB' },
  headerSubtitle: { fontSize: 12, color: '#7B61FF', fontWeight: '500', marginTop: 1 },
  // Info Bar
  infoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 16,
    backgroundColor: '#F3E8FF', marginHorizontal: 16, marginTop: 10, borderRadius: 12,
  },
  infoBarDark: { backgroundColor: '#2E2856' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  infoTextDark: { color: '#D1D5DB' },
  // Seat Map
  seatMapContainer: { flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 13, color: '#9CA3AF' },
  // Screen
  screenContainer: { alignItems: 'center', marginTop: 24, marginBottom: 20, paddingHorizontal: 40 },
  screenBar: { width: '100%', height: 4, borderRadius: 2 },
  screenLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontWeight: '600' },
  screenLabelDark: { color: '#6B7280' },
  // Seat Grid
  seatGrid: { paddingHorizontal: 16, gap: 4 },
  seatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowLabel: { width: 16, fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  rowLabelDark: { color: '#6B7280' },
  seatsInRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 3, flexWrap: 'wrap' },
  seat: {
    justifyContent: 'center', alignItems: 'center',
    marginVertical: 1,
  },
  seatDisabled: { opacity: 0.6 },
  seatText: { color: '#374151', fontWeight: '700' },
  seatTextSelected: { color: '#FFFFFF' },
  seatTextDisabled: { color: '#6B7280' },
  // Legend
  legendContainer: { marginTop: 24, paddingHorizontal: 24 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  legendTextDark: { color: '#9CA3AF' },
  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 34,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  bottomBarDark: { backgroundColor: '#1A1740', borderTopColor: '#2E2856' },
  bottomLeft: { flex: 1, marginRight: 12 },
  bottomLabel: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  bottomLabelDark: { color: '#E5E7EB' },
  bottomPrice: { fontSize: 16, fontWeight: '800', color: '#7B61FF' },
  continueBtn: { borderRadius: 14, overflow: 'hidden' },
  continueBtnDisabled: { opacity: 0.7 },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  continueBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
