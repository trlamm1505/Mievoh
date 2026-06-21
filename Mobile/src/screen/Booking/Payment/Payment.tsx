import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useAppNavigation } from '../../../navigation/navigation';
import { useBooking } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { createBookingApi, getMyVouchersApi, verifyVNPayReturnApi, Voucher, CreateBookingDto } from '../../../axios/booking';
import { toast } from '../../../components/Toast/Toast';

const extractVoucherList = (payload: any): Voucher[] => {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.vouchers,
    payload?.data?.vouchers,
  ];

  return candidates.find(Array.isArray) || [];
};

const extractUrlParams = (url: string) => {
  const queryString = url.split('?')[1]?.split('#')[0] || '';
  return queryString.split('&').reduce<Record<string, string>>((params, pair) => {
    if (!pair) return params;

    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    params[key] = value;
    return params;
  }, {});
};

const isVNPayReturnUrl = (url: string) => (
  url.includes('vnpay-return') || url.includes('payment-success') || url.includes('payment-result')
);

const isSuccessfulPaymentResponse = (payload: any, params: Record<string, string>) => {
  const data = payload?.data || payload;
  const responseCode = params.vnp_ResponseCode || data?.code || data?.responseCode;
  const transactionStatus = params.vnp_TransactionStatus || data?.transactionStatus;
  const message = String(data?.message || '').toLowerCase();

  return responseCode === '00'
    || transactionStatus === '00'
    || message.includes('success')
    || message.includes('thành công');
};

export default function Payment() {
  const navigation = useAppNavigation();
  const { state, setBookingResult, setStep, seatsTotalPrice, foodsTotalPrice, totalPrice } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const isHandlingPaymentReturn = useRef(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const movie = state.movie;
  const showtime = state.showtime;
  const selectedSeats = state.selectedSeats;
  const selectedFoods = state.selectedFoods;

  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  const movieTitle = language === 'vi'
    ? (movie?.title_vi || movie?.title_en || '')
    : (movie?.title_en || movie?.title_vi || '');

  // Fetch vouchers
  const handleOpenVouchers = async () => {
    setShowVoucherModal(true);
    setLoadingVouchers(true);
    try {
      const res = await getMyVouchersApi();
      const voucherList = extractVoucherList(res);
      setVouchers(voucherList.filter((v: Voucher) => v.isActive));
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleApplyVoucher = (voucher: Voucher) => {
    setAppliedVoucher(voucher);
    setVoucherCode(voucher.code);

    let discount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discount = Math.floor(totalPrice * voucher.discountValue / 100);
      if (voucher.maxDiscount && discount > voucher.maxDiscount) {
        discount = voucher.maxDiscount;
      }
    } else {
      discount = voucher.discountValue;
    }
    setDiscountAmount(discount);
    setShowVoucherModal(false);
    toast.success(language === 'vi' ? `Đã áp dụng mã ${voucher.code}` : `Applied code ${voucher.code}`);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setDiscountAmount(0);
  };

  // Create booking and open payment
  const handlePayNow = async () => {
    if (!showtime || selectedSeats.length === 0) return;

    setIsSubmitting(true);
    try {
      const enteredVoucherCode = voucherCode.trim();
      const bookingData: CreateBookingDto = {
        showtimeId: showtime.showtimeId,
        seats: selectedSeats.map(s => s.seatId),
        foods: selectedFoods.length > 0
          ? selectedFoods.map(f => ({ foodId: f.food.foodId, quantity: f.quantity }))
          : undefined,
        voucherCode: appliedVoucher?.code || enteredVoucherCode || undefined,
      };

      const res = await createBookingApi(bookingData);
      const bookingResult = res?.data || res;
      const result = bookingResult as any;

      toast.success(t('toast_payment_initiated'));

      if (result?.paymentUrl) {
        isHandlingPaymentReturn.current = false;
        setIsVerifyingPayment(false);
        setPaymentUrl(result.paymentUrl);
        setShowWebView(true);
        setBookingResult({
          bookingId: result.booking?.bookingId || '',
          ticketCode: result.booking?.ticketCode || '',
          paymentUrl: result.paymentUrl,
          totalPrice: finalPrice,
        });
      } else {
        // No payment URL = free or auto-confirmed
        setBookingResult({
          bookingId: result.booking?.bookingId || '',
          ticketCode: result.booking?.ticketCode || '',
          paymentUrl: '',
          totalPrice: finalPrice,
        });
        setStep(5);
        navigation.goToTicketResult();
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      const msg = err?.response?.data?.message || (language === 'vi' ? 'Đặt vé thất bại' : 'Booking failed');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentReturnUrl = useCallback(async (url: string) => {
    if (!isVNPayReturnUrl(url) || isHandlingPaymentReturn.current) return;

    isHandlingPaymentReturn.current = true;
    setShowWebView(false);
    setPaymentUrl(null);
    setIsVerifyingPayment(true);

    const params = extractUrlParams(url);

    try {
      const responseCode = params.vnp_ResponseCode;
      if (responseCode && responseCode !== '00') {
        setIsVerifyingPayment(false);
        toast.error(
          responseCode === '24'
            ? (language === 'vi' ? 'Bạn đã hủy thanh toán' : 'Payment was cancelled')
            : (language === 'vi' ? 'Thanh toán không thành công' : 'Payment failed')
        );
        return;
      }

      const verifyResult = await verifyVNPayReturnApi(params);
      if (isSuccessfulPaymentResponse(verifyResult, params)) {
        toast.success(t('toast_payment_success'));
        setStep(5);
        navigation.goToTicketResult();
        return;
      }

      setIsVerifyingPayment(false);
      toast.error(language === 'vi' ? 'Thanh toán không thành công' : 'Payment failed');
    } catch (err: any) {
      console.error('VNPay return verification error:', err);
      setIsVerifyingPayment(false);
      const msg = err?.response?.data?.message || (language === 'vi' ? 'Thanh toán không thành công' : 'Payment failed');
      toast.error(msg);
    } finally {
      isHandlingPaymentReturn.current = false;
    }
  }, [language, navigation, setStep, t]);

  // Fallback for platforms/events where the return URL already reached navigation state.
  const handleWebViewNavigation = useCallback((navState: any) => {
    const url = navState.url || '';
    void handlePaymentReturnUrl(url);
  }, [handlePaymentReturnUrl]);

  const handleShouldStartLoad = useCallback((request: any) => {
    const url = request.url || '';
    if (!isVNPayReturnUrl(url)) return true;

    void handlePaymentReturnUrl(url);
    return false;
  }, [handlePaymentReturnUrl]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {t('stepper_payment')}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Card */}
        <View style={[styles.summaryCard, isDark && styles.summaryCardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            {t('order_confirmation')}
          </Text>

          {/* Movie Info */}
          <View style={styles.movieRow}>
            {movie?.imageUrl && (
              <Image source={{ uri: movie.imageUrl }} style={styles.moviePoster} resizeMode="cover" />
            )}
            <View style={styles.movieInfo}>
              <Text style={[styles.movieTitle, isDark && styles.movieTitleDark]} numberOfLines={2}>
                {movieTitle}
              </Text>
              {showtime && (
                <>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color="#7B61FF" />
                    <Text style={[styles.infoValue, isDark && styles.infoValueDark]} numberOfLines={1}>
                      {showtime.cinemaComplexName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={13} color="#7B61FF" />
                    <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>
                      {new Date(showtime.showDateTime).toLocaleString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }
                      )}
                      {' • '}{showtime.format}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Seats */}
          <View style={[styles.detailRow, isDark && styles.detailRowDark]}>
            <View style={styles.detailLeft}>
              <Ionicons name="grid-outline" size={16} color="#7B61FF" />
              <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>{t('booking_seats')}</Text>
            </View>
            <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
              {selectedSeats.map(s => s.name).join(', ')}
            </Text>
          </View>

          {/* Combos */}
          {selectedFoods.length > 0 && (
            <View style={[styles.detailRow, isDark && styles.detailRowDark]}>
              <View style={styles.detailLeft}>
                <Ionicons name="fast-food-outline" size={16} color="#7B61FF" />
                <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>{t('booking_combo')}</Text>
              </View>
              <View style={styles.comboList}>
                {selectedFoods.map(f => (
                  <Text key={f.food.foodId} style={[styles.comboItem, isDark && styles.comboItemDark]}>
                    {f.quantity}x {f.food.name}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Voucher Section */}
        <View style={[styles.voucherCard, isDark && styles.voucherCardDark]}>
          <View style={styles.voucherHeader}>
            <Ionicons name="pricetag-outline" size={18} color="#7B61FF" />
            <Text style={[styles.voucherTitle, isDark && styles.voucherTitleDark]}>
              {language === 'vi' ? 'Mã giảm giá' : 'Voucher Code'}
            </Text>
          </View>

          {appliedVoucher ? (
            <View style={styles.appliedVoucher}>
              <View style={styles.appliedVoucherInfo}>
                <Text style={styles.appliedVoucherCode}>{appliedVoucher.code}</Text>
                <Text style={styles.appliedVoucherDiscount}>
                  -{discountAmount.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <TouchableOpacity onPress={handleRemoveVoucher}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.voucherInputRow}>
              <TextInput
                style={[styles.voucherInput, isDark && styles.voucherInputDark]}
                value={voucherCode}
                onChangeText={setVoucherCode}
                placeholder={language === 'vi' ? 'Nhập mã giảm giá' : 'Enter voucher code'}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={handleOpenVouchers} style={styles.voucherSelectBtn}>
                <Text style={styles.voucherSelectBtnText}>
                  {language === 'vi' ? 'Chọn mã' : 'Browse'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={[styles.paymentMethodCard, isDark && styles.paymentMethodCardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            {t('payment_method')}
          </Text>
          <TouchableOpacity style={[styles.methodItem, styles.methodItemSelected]} activeOpacity={0.8}>
            <View style={styles.methodRadio}>
              <View style={styles.methodRadioInner} />
            </View>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/VNPay_Logo.svg/1200px-VNPay_Logo.svg.png' }}
              style={styles.methodLogo}
              resizeMode="contain"
            />
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, isDark && styles.methodNameDark]}>VNPay</Text>
              <Text style={styles.methodDesc}>
                {language === 'vi' ? 'Thanh toán qua VNPay' : 'Pay via VNPay'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={[styles.priceCard, isDark && styles.priceCardDark]}>
          <View style={styles.priceLine}>
            <Text style={[styles.priceLabel, isDark && styles.priceLabelDark]}>{t('ticket_price')}</Text>
            <Text style={[styles.priceValue, isDark && styles.priceValueDark]}>
              {seatsTotalPrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          {foodsTotalPrice > 0 && (
            <View style={styles.priceLine}>
              <Text style={[styles.priceLabel, isDark && styles.priceLabelDark]}>Combo</Text>
              <Text style={[styles.priceValue, isDark && styles.priceValueDark]}>
                {foodsTotalPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          {discountAmount > 0 && (
            <View style={styles.priceLine}>
              <Text style={[styles.priceLabel, isDark && styles.priceLabelDark]}>
                {language === 'vi' ? 'Giảm giá' : 'Discount'}
              </Text>
              <Text style={styles.discountValue}>
                -{discountAmount.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          <View style={[styles.priceLine, styles.totalLine]}>
            <Text style={styles.totalLabel}>{t('booking_total')}</Text>
            <Text style={styles.totalValue}>{finalPrice.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Terms Reminder */}
        <View style={[styles.termsCard, isDark && styles.termsCardDark]}>
          <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
          <Text style={[styles.termsText, isDark && styles.termsTextDark]}>
            {t('booking_terms_reminder')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Pay Button */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.bottomLabel, isDark && styles.bottomLabelDark]}>{t('booking_total')}</Text>
          <Text style={styles.bottomTotal}>{finalPrice.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity
          onPress={handlePayNow}
          activeOpacity={0.8}
          style={[styles.payBtn, isSubmitting && { opacity: 0.7 }]}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#A38FFF', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payBtnGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color="white" />
                <Text style={styles.payBtnText}>{t('pay_now')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment Verification Overlay */}
      <Modal visible={isVerifyingPayment} transparent animationType="fade">
        <View style={styles.verifyingOverlay}>
          <View style={[styles.verifyingCard, isDark && styles.verifyingCardDark]}>
            <ActivityIndicator size="large" color="#7B61FF" />
            <Text style={[styles.verifyingTitle, isDark && styles.verifyingTitleDark]}>
              {language === 'vi' ? 'Đang xác nhận thanh toán' : 'Verifying payment'}
            </Text>
            <Text style={styles.verifyingDesc}>
              {language === 'vi'
                ? 'Vui lòng chờ trong giây lát, vé của bạn đang được xử lý.'
                : 'Please wait a moment while your ticket is being processed.'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* VNPay WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <View style={[styles.webViewContainer, isDark && styles.webViewContainerDark]}>
          <View style={[styles.webViewHeader, isDark && styles.webViewHeaderDark]}>
            <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.webViewCloseBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, isDark && styles.webViewTitleDark]}>VNPay</Text>
            <View style={{ width: 40 }} />
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onNavigationStateChange={handleWebViewNavigation}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>
      </Modal>

      {/* Voucher Selection Modal */}
      <Modal visible={showVoucherModal} transparent animationType="slide" onRequestClose={() => setShowVoucherModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowVoucherModal(false)} activeOpacity={1} />
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {language === 'vi' ? 'Mã giảm giá của bạn' : 'Your Vouchers'}
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {loadingVouchers ? (
                <ActivityIndicator size="small" color="#7B61FF" style={{ marginVertical: 30 }} />
              ) : vouchers.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="pricetag-outline" size={36} color="#9CA3AF" />
                  <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 13 }}>
                    {language === 'vi' ? 'Bạn chưa có mã giảm giá nào' : 'You have no vouchers'}
                  </Text>
                </View>
              ) : (
                vouchers.map(v => (
                  <TouchableOpacity
                    key={v.voucherId}
                    onPress={() => handleApplyVoucher(v)}
                    style={[styles.voucherItem, isDark && styles.voucherItemDark]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.voucherBadge}>
                      <Ionicons name="pricetag" size={16} color="white" />
                    </View>
                    <View style={styles.voucherItemInfo}>
                      <Text style={[styles.voucherItemCode, isDark && styles.voucherItemCodeDark]}>{v.code}</Text>
                      <Text style={styles.voucherItemDesc}>
                        {v.discountType === 'PERCENTAGE'
                          ? `${language === 'vi' ? 'Giảm' : 'Off'} ${v.discountValue}%${v.maxDiscount ? ` (max ${v.maxDiscount.toLocaleString('vi-VN')}đ)` : ''}`
                          : `${language === 'vi' ? 'Giảm' : 'Off'} ${v.discountValue.toLocaleString('vi-VN')}đ`
                        }
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#7B61FF" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryCardDark: { backgroundColor: '#1A1740' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 14 },
  sectionTitleDark: { color: '#F9FAFB' },
  movieRow: { flexDirection: 'row', marginBottom: 14 },
  moviePoster: { width: 60, height: 85, borderRadius: 10 },
  movieInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  movieTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  movieTitleDark: { color: '#F9FAFB' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  infoValue: { fontSize: 12, color: '#6B7280', flex: 1 },
  infoValueDark: { color: '#9CA3AF' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  detailRowDark: { borderTopColor: '#2E2856' },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  detailLabelDark: { color: '#9CA3AF' },
  detailValue: { fontSize: 13, color: '#1F2937', fontWeight: '600', maxWidth: 180, textAlign: 'right' },
  detailValueDark: { color: '#E5E7EB' },
  comboList: { alignItems: 'flex-end' },
  comboItem: { fontSize: 12, color: '#374151', marginBottom: 2 },
  comboItemDark: { color: '#D1D5DB' },
  // Voucher
  voucherCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  voucherCardDark: { backgroundColor: '#1A1740' },
  voucherHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  voucherTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  voucherTitleDark: { color: '#F9FAFB' },
  voucherInputRow: { flexDirection: 'row', gap: 8 },
  voucherInput: {
    flex: 1, height: 42, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 13, color: '#1F2937', backgroundColor: '#F9FAFB',
  },
  voucherInputDark: { borderColor: '#2E2856', backgroundColor: '#1E1B3A', color: '#F9FAFB' },
  voucherSelectBtn: {
    paddingHorizontal: 16, height: 42, justifyContent: 'center',
    backgroundColor: '#F3E8FF', borderRadius: 12,
  },
  voucherSelectBtnText: { fontSize: 13, color: '#7B61FF', fontWeight: '600' },
  appliedVoucher: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FFF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC',
  },
  appliedVoucherInfo: { flex: 1 },
  appliedVoucherCode: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  appliedVoucherDiscount: { fontSize: 12, color: '#059669', marginTop: 2 },
  // Payment Method
  paymentMethodCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  paymentMethodCardDark: { backgroundColor: '#1A1740' },
  methodItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', gap: 12,
  },
  methodItemSelected: { borderColor: '#7B61FF', backgroundColor: '#FAF5FF' },
  methodRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#7B61FF',
    justifyContent: 'center', alignItems: 'center',
  },
  methodRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7B61FF' },
  methodLogo: { width: 36, height: 36, borderRadius: 8 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  methodNameDark: { color: '#F9FAFB' },
  methodDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  // Price Card
  priceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  priceCardDark: { backgroundColor: '#1A1740' },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: '#6B7280' },
  priceLabelDark: { color: '#9CA3AF' },
  priceValue: { fontSize: 13, color: '#374151', fontWeight: '500' },
  priceValueDark: { color: '#D1D5DB' },
  discountValue: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  totalLine: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#7B61FF' },
  totalValue: { fontSize: 17, fontWeight: '900', color: '#7B61FF' },
  // Terms
  termsCard: {
    flexDirection: 'row', gap: 8, padding: 14, borderRadius: 14,
    backgroundColor: '#FFFBEB', marginTop: 12,
  },
  termsCardDark: { backgroundColor: '#2E2820' },
  termsText: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },
  termsTextDark: { color: '#FDE68A' },
  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 34,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  bottomBarDark: { backgroundColor: '#1A1740', borderTopColor: '#2E2856' },
  bottomLeft: { flex: 1, marginRight: 12 },
  bottomLabel: { fontSize: 12, color: '#6B7280' },
  bottomLabelDark: { color: '#9CA3AF' },
  bottomTotal: { fontSize: 18, fontWeight: '900', color: '#7B61FF' },
  payBtn: { borderRadius: 14, overflow: 'hidden' },
  payBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 8 },
  payBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  // Payment verification
  verifyingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 32, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  verifyingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  verifyingCardDark: { backgroundColor: '#1A1740' },
  verifyingTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  verifyingTitleDark: { color: '#F9FAFB' },
  verifyingDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // WebView
  webViewContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  webViewContainerDark: { backgroundColor: '#0F0C20' },
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  webViewHeaderDark: { borderBottomColor: '#1E1B3A' },
  webViewCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  webViewTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1F2937' },
  webViewTitleDark: { color: '#F9FAFB' },
  // Voucher Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, maxHeight: '70%',
  },
  modalContentDark: { backgroundColor: '#1A1740' },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937', marginBottom: 16 },
  modalTitleDark: { color: '#F9FAFB' },
  voucherItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: '#F9FAFB', marginBottom: 8, gap: 12,
  },
  voucherItemDark: { backgroundColor: '#2E2856' },
  voucherBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#7B61FF',
    justifyContent: 'center', alignItems: 'center',
  },
  voucherItemInfo: { flex: 1 },
  voucherItemCode: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  voucherItemCodeDark: { color: '#F9FAFB' },
  voucherItemDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
