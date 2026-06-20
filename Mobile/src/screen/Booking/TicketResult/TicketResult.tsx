import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '../../../navigation/navigation';
import { useBooking } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TicketResult() {
  const navigation = useAppNavigation();
  const { state, resetBooking, totalPrice } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const movie = state.movie;
  const showtime = state.showtime;
  const selectedSeats = state.selectedSeats;
  const selectedFoods = state.selectedFoods;
  const bookingResult = state.bookingResult;

  const movieTitle = language === 'vi'
    ? (movie?.title_vi || movie?.title_en || '')
    : (movie?.title_en || movie?.title_vi || '');

  const handleGoHome = () => {
    resetBooking();
    navigation.replace('/?skipInitialLoading=true');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: language === 'vi'
          ? `🎬 Tôi vừa đặt vé xem phim "${movieTitle}" tại ${showtime?.cinemaComplexName || 'Mievoh'}! Mã vé: ${bookingResult?.ticketCode || ''}`
          : `🎬 I just booked a ticket for "${movieTitle}" at ${showtime?.cinemaComplexName || 'Mievoh'}! Ticket code: ${bookingResult?.ticketCode || ''}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <LinearGradient
          colors={isDark ? ['#1A1740', '#2E2856', '#1A1740'] : ['#FAF5FF', '#F3E8FF', '#EDE9FE']}
          style={styles.successHeader}
        >
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successIcon}
            >
              <Ionicons name="checkmark" size={36} color="white" />
            </LinearGradient>
          </View>
          <Text style={[styles.successTitle, isDark && styles.successTitleDark]}>
            {t('booking_success_title')}
          </Text>
          <Text style={[styles.successDesc, isDark && styles.successDescDark]}>
            {t('booking_success_desc')}
          </Text>
        </LinearGradient>

        {/* Ticket Card */}
        <View style={[styles.ticketCard, isDark && styles.ticketCardDark]}>
          {/* Ticket Header with movie poster */}
          <View style={styles.ticketHeader}>
            {movie?.imageUrl && (
              <Image source={{ uri: movie.imageUrl }} style={styles.ticketPoster} resizeMode="cover" />
            )}
            <View style={styles.ticketMovieInfo}>
              <Text style={[styles.ticketMovieTitle, isDark && styles.ticketMovieTitleDark]} numberOfLines={2}>
                {movieTitle}
              </Text>
              {showtime && (
                <Text style={styles.ticketCinema} numberOfLines={1}>
                  {showtime.cinemaComplexName}
                </Text>
              )}
            </View>
          </View>

          {/* Dashed divider */}
          <View style={styles.dashedDivider}>
            <View style={[styles.dashedCircle, styles.dashedCircleLeft, isDark && styles.dashedCircleDark]} />
            <View style={styles.dashedLine} />
            <View style={[styles.dashedCircle, styles.dashedCircleRight, isDark && styles.dashedCircleDark]} />
          </View>

          {/* Ticket Details */}
          <View style={styles.ticketDetails}>
            {showtime && (
              <>
                <View style={styles.ticketRow}>
                  <View style={styles.ticketCol}>
                    <Text style={styles.ticketDetailLabel}>
                      {language === 'vi' ? 'Ngày chiếu' : 'Date'}
                    </Text>
                    <Text style={[styles.ticketDetailValue, isDark && styles.ticketDetailValueDark]}>
                      {new Date(showtime.showDateTime).toLocaleDateString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { day: '2-digit', month: '2-digit', year: 'numeric' }
                      )}
                    </Text>
                  </View>
                  <View style={styles.ticketCol}>
                    <Text style={styles.ticketDetailLabel}>
                      {language === 'vi' ? 'Giờ chiếu' : 'Time'}
                    </Text>
                    <Text style={[styles.ticketDetailValue, isDark && styles.ticketDetailValueDark]}>
                      {new Date(showtime.showDateTime).toLocaleTimeString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </Text>
                  </View>
                  <View style={styles.ticketCol}>
                    <Text style={styles.ticketDetailLabel}>
                      {t('booking_format')}
                    </Text>
                    <Text style={[styles.ticketDetailValue, isDark && styles.ticketDetailValueDark]}>
                      {showtime.format}
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketRow}>
                  <View style={[styles.ticketCol, { flex: 2 }]}>
                    <Text style={styles.ticketDetailLabel}>
                      {t('booking_hall_seats')}
                    </Text>
                    <Text style={[styles.ticketDetailValue, isDark && styles.ticketDetailValueDark]}>
                      {showtime.cinemaName && `${showtime.cinemaName} • `}
                      {selectedSeats.map(s => s.name).join(', ')}
                    </Text>
                  </View>
                </View>

                {selectedFoods.length > 0 && (
                  <View style={styles.ticketRow}>
                    <View style={[styles.ticketCol, { flex: 2 }]}>
                      <Text style={styles.ticketDetailLabel}>{t('attached_combos')}</Text>
                      <Text style={[styles.ticketDetailValue, isDark && styles.ticketDetailValueDark]}>
                        {selectedFoods.map(f => `${f.quantity}x ${f.food.name}`).join(', ')}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Dashed divider */}
          <View style={styles.dashedDivider}>
            <View style={[styles.dashedCircle, styles.dashedCircleLeft, isDark && styles.dashedCircleDark]} />
            <View style={styles.dashedLine} />
            <View style={[styles.dashedCircle, styles.dashedCircleRight, isDark && styles.dashedCircleDark]} />
          </View>

          {/* QR / Barcode Area */}
          <View style={styles.barcodeArea}>
            <Text style={[styles.ticketCodeLabel, isDark && styles.ticketCodeLabelDark]}>
              {t('ticket_receipt_code')}
            </Text>

            {/* Simulated barcode using lines */}
            <View style={styles.barcodeContainer}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: Math.random() > 0.5 ? 3 : 2,
                    height: 50,
                    backgroundColor: isDark ? '#E5E7EB' : '#1F2937',
                    marginHorizontal: 1,
                    opacity: Math.random() > 0.3 ? 1 : 0.4,
                  }}
                />
              ))}
            </View>

            <Text style={[styles.ticketCode, isDark && styles.ticketCodeDark]}>
              {bookingResult?.ticketCode || 'N/A'}
            </Text>
            <Text style={styles.scanDesc}>
              {t('scan_barcode_desc')}
            </Text>
          </View>

          {/* Total Price */}
          <View style={[styles.totalRow, isDark && styles.totalRowDark]}>
            <Text style={styles.totalLabel}>{t('total_amount_paid')}</Text>
            <Text style={styles.totalValue}>
              {(bookingResult?.totalPrice || totalPrice).toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={handleShare} style={[styles.actionBtn, isDark && styles.actionBtnDark]}>
            <Ionicons name="share-social-outline" size={22} color="#7B61FF" />
            <Text style={styles.actionBtnText}>
              {language === 'vi' ? 'Chia sẻ' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back to Home */}
        <TouchableOpacity onPress={handleGoHome} activeOpacity={0.8} style={styles.homeBtn}>
          <LinearGradient
            colors={['#A38FFF', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeBtnGradient}
          >
            <Ionicons name="home-outline" size={18} color="white" />
            <Text style={styles.homeBtnText}>{t('back_to_homepage')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FF' },
  containerDark: { backgroundColor: '#0F0C20' },
  // Success Header
  successHeader: {
    alignItems: 'center', paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20,
  },
  successIconContainer: { marginBottom: 16 },
  successIcon: {
    width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', marginBottom: 6 },
  successTitleDark: { color: '#F9FAFB' },
  successDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  successDescDark: { color: '#9CA3AF' },
  // Ticket Card
  ticketCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginHorizontal: 20, marginTop: -10,
    shadowColor: '#7B61FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
    overflow: 'hidden',
  },
  ticketCardDark: { backgroundColor: '#1A1740' },
  ticketHeader: { flexDirection: 'row', padding: 16, gap: 12 },
  ticketPoster: { width: 60, height: 85, borderRadius: 10 },
  ticketMovieInfo: { flex: 1, justifyContent: 'center' },
  ticketMovieTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  ticketMovieTitleDark: { color: '#F9FAFB' },
  ticketCinema: { fontSize: 12, color: '#7B61FF', fontWeight: '600' },
  // Dashed Divider
  dashedDivider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 4,
  },
  dashedCircle: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FAF8FF',
  },
  dashedCircleDark: { backgroundColor: '#0F0C20' },
  dashedCircleLeft: { marginLeft: -10 },
  dashedCircleRight: { marginRight: -10 },
  dashedLine: {
    flex: 1, height: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB',
  },
  // Ticket Details
  ticketDetails: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  ticketRow: { flexDirection: 'row', gap: 12 },
  ticketCol: { flex: 1 },
  ticketDetailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  ticketDetailValue: { fontSize: 13, color: '#1F2937', fontWeight: '700' },
  ticketDetailValueDark: { color: '#E5E7EB' },
  // Barcode
  barcodeArea: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  ticketCodeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  ticketCodeLabelDark: { color: '#6B7280' },
  barcodeContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  ticketCode: { fontSize: 18, fontWeight: '900', color: '#1F2937', letterSpacing: 2, marginBottom: 4 },
  ticketCodeDark: { color: '#F9FAFB' },
  scanDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  // Total
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAF5FF',
  },
  totalRowDark: { borderTopColor: '#2E2856', backgroundColor: '#2E2856' },
  totalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#7B61FF' },
  // Actions
  actionsContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20, paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  actionBtnDark: { backgroundColor: '#1A1740' },
  actionBtnText: { fontSize: 12, color: '#7B61FF', fontWeight: '600' },
  // Home Button
  homeBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  homeBtnGradient: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, gap: 8,
  },
  homeBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
});
