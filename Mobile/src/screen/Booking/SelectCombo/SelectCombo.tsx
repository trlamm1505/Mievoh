import React, { useState, useEffect } from 'react';
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
import { useBooking } from '../../../contextAPI/Booking/BookingContext';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { getFoodsByComplexApi, Food } from '../../../axios/booking';
import { toast } from '../../../components/Toast/Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default food images based on name keywords (when API returns imageUrl: null)
// Using free Twemoji CDN for food emoji icons
const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  hotdog: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32d.png',   // 🌭
  nachos: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9c0.png',   // 🧀
  'bắp': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37f.png',    // 🍿
  popcorn: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f37f.png',  // 🍿
  combo: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f371.png',    // 🍱
  'nước': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f964.png',   // 🥤
  drink: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f964.png',    // 🥤
  'gà': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f357.png',     // 🍗
  chicken: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f357.png',  // 🍗
  snack: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f35f.png',    // 🍟
  'nước ép': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9c3.png', // 🧃
  'nước suối': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png', // 💧
  caramel: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png',  // 🍬
  'phô mai': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9c0.png', // 🧀
};

const getFoodFallbackImage = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  // Check specific (longer) keywords first, then generic ones
  const priorityOrder = ['nước ép', 'nước suối', 'phô mai', 'caramel', 'hotdog', 'nachos', 'gà', 'chicken', 'snack', 'nước', 'drink', 'bắp', 'popcorn', 'combo'];
  for (const key of priorityOrder) {
    if (lowerName.includes(key)) {
      return DEFAULT_FOOD_IMAGES[key];
    }
  }
  return null;
};

export default function SelectCombo() {
  const navigation = useAppNavigation();
  const { state, setFoodQuantity, setStep, seatsTotalPrice, foodsTotalPrice, totalPrice } = useBooking();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  const { isLoggedIn } = useAuth();

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const showtime = state.showtime;
  const selectedFoods = state.selectedFoods;

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
    }
  }, [isLoggedIn]);

  // Fetch foods
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!showtime?.cinemaComplexId) return;

    const fetchFoods = async () => {
      setLoading(true);
      try {
        const res = await getFoodsByComplexApi(showtime.cinemaComplexId);
        const foodsData = res?.data || res;
        if (Array.isArray(foodsData)) {
          setFoods(foodsData.filter((f: Food) => f.isActive));
        } else {
          setFoods([]);
        }
      } catch (err) {
        console.error('Error fetching foods:', err);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [isLoggedIn, showtime?.cinemaComplexId]);

  const getQuantity = (foodId: string): number => {
    const found = selectedFoods.find(f => f.food.foodId === foodId);
    return found?.quantity || 0;
  };

  const handleIncrease = (food: Food) => {
    const current = getQuantity(food.foodId);
    setFoodQuantity(food, current + 1);
  };

  const handleDecrease = (food: Food) => {
    const current = getQuantity(food.foodId);
    if (current > 0) {
      setFoodQuantity(food, current - 1);
    }
  };

  const handleContinue = () => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
      return;
    }

    setStep(4);
    navigation.goToPayment();
  };

  const handleSkip = () => {
    if (!isLoggedIn) {
      toast.error(language === 'vi' ? 'Vui lòng đăng nhập để đặt vé' : 'Please log in to book tickets');
      navigation.goToLogin();
      return;
    }

    setStep(4);
    navigation.goToPayment();
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            {t('choose_combo')}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>
            {language === 'vi' ? 'Bỏ qua' : 'Skip'}
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#7B61FF" />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <View style={[styles.stepper, isDark && styles.stepperDark]}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepDone]}>
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
          <Text style={[styles.stepText, styles.stepTextDone]}>{t('select_seat_title')}</Text>
        </View>
        <View style={[styles.stepLine, styles.stepLineDone]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, styles.stepActive]}>
            <Text style={styles.stepCircleText}>2</Text>
          </View>
          <Text style={[styles.stepText, styles.stepTextActive]}>{t('stepper_combos')}</Text>
        </View>
        <View style={[styles.stepLine]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, isDark && styles.stepCircleDark]}>
            <Text style={[styles.stepCircleText, styles.stepCircleTextInactive]}>3</Text>
          </View>
          <Text style={[styles.stepText, isDark && styles.stepTextDark]}>{t('stepper_payment')}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descContainer}>
        <Text style={[styles.descTitle, isDark && styles.descTitleDark]}>
          {t('popcorn_drinks_combos')}
        </Text>
        <Text style={[styles.descSubtitle, isDark && styles.descSubtitleDark]}>
          {t('popcorn_combo_discount_desc')}
        </Text>
      </View>

      {/* Food List */}
      <ScrollView
        style={styles.foodList}
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7B61FF" />
            <Text style={styles.loadingText}>
              {language === 'vi' ? 'Đang tải menu...' : 'Loading menu...'}
            </Text>
          </View>
        ) : foods.length === 0 ? (
          <View style={[styles.emptyContainer, isDark && styles.emptyContainerDark]}>
            <Ionicons name="fast-food-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {language === 'vi' ? 'Rạp này chưa có combo bắp nước' : 'No combos available at this cinema'}
            </Text>
          </View>
        ) : (
          foods.map(food => {
            const qty = getQuantity(food.foodId);
            const fallbackImage = getFoodFallbackImage(food.name);
            return (
              <View key={food.foodId} style={[styles.foodCard, isDark && styles.foodCardDark]}>
                {food.imageUrl ? (
                  <Image source={{ uri: food.imageUrl }} style={styles.foodImage} resizeMode="cover" />
                ) : fallbackImage ? (
                  <Image source={{ uri: fallbackImage }} style={[styles.foodImage, styles.foodImageFallback]} resizeMode="contain" />
                ) : (
                  <View style={[styles.foodImage, styles.foodImagePlaceholder]}>
                    <Ionicons name="fast-food-outline" size={28} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, isDark && styles.foodNameDark]} numberOfLines={2}>
                    {food.name}
                  </Text>
                  {food.description && (
                    <Text style={[styles.foodDesc, isDark && styles.foodDescDark]} numberOfLines={2}>
                      {food.description}
                    </Text>
                  )}
                  <Text style={styles.foodPrice}>
                    {food.price.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    onPress={() => handleDecrease(food)}
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    disabled={qty === 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={qty > 0 ? '#7B61FF' : '#D1D5DB'} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, isDark && styles.qtyTextDark]}>{qty}</Text>
                  <TouchableOpacity
                    onPress={() => handleIncrease(food)}
                    style={[styles.qtyBtn, styles.qtyBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Summary Bar */}
      <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
        <View style={styles.bottomLeft}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, isDark && styles.priceLabelDark]}>
              {t('ticket_price')}:
            </Text>
            <Text style={[styles.priceValue, isDark && styles.priceValueDark]}>
              {seatsTotalPrice.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          {foodsTotalPrice > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, isDark && styles.priceLabelDark]}>Combo:</Text>
              <Text style={[styles.priceValue, isDark && styles.priceValueDark]}>
                {foodsTotalPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('booking_total')}:</Text>
            <Text style={styles.totalValue}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.8} style={styles.continueBtn}>
          <LinearGradient
            colors={['#A38FFF', '#7B61FF']}
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
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  skipText: { fontSize: 13, color: '#7B61FF', fontWeight: '600' },
  // Stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 20, gap: 8,
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stepperDark: { backgroundColor: '#1A1740' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  stepCircleDark: { backgroundColor: '#2E2856' },
  stepDone: { backgroundColor: '#10B981' },
  stepActive: { backgroundColor: '#7B61FF' },
  stepCircleText: { fontSize: 11, fontWeight: '700', color: 'white' },
  stepCircleTextInactive: { color: '#9CA3AF' },
  stepLine: { width: 30, height: 2, backgroundColor: '#E5E7EB', borderRadius: 1 },
  stepLineDone: { backgroundColor: '#10B981' },
  stepText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  stepTextDark: { color: '#6B7280' },
  stepTextDone: { color: '#10B981' },
  stepTextActive: { color: '#7B61FF', fontWeight: '600' },
  // Description
  descContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  descTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  descTitleDark: { color: '#F9FAFB' },
  descSubtitle: { fontSize: 13, color: '#6B7280' },
  descSubtitleDark: { color: '#9CA3AF' },
  // Food List
  foodList: { flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13, color: '#9CA3AF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 50, gap: 12, backgroundColor: '#F9FAFB', borderRadius: 16 },
  emptyContainerDark: { backgroundColor: '#1A1740' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  // Food Card
  foodCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  foodCardDark: { backgroundColor: '#1A1740' },
  foodImage: { width: 80, height: 80, borderRadius: 12 },
  foodImagePlaceholder: {
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  foodImageFallback: {
    backgroundColor: '#F9F5FF', padding: 12, borderRadius: 12,
  },
  foodInfo: { flex: 1, marginLeft: 12 },
  foodName: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  foodNameDark: { color: '#F9FAFB' },
  foodDesc: { fontSize: 11, color: '#6B7280', marginBottom: 4, lineHeight: 15 },
  foodDescDark: { color: '#9CA3AF' },
  foodPrice: { fontSize: 14, fontWeight: '800', color: '#7B61FF' },
  // Qty Controls
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  qtyBtnDisabled: { borderColor: '#F3F4F6', opacity: 0.5 },
  qtyBtnActive: { backgroundColor: '#7B61FF', borderColor: '#7B61FF' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#1F2937', minWidth: 20, textAlign: 'center' },
  qtyTextDark: { color: '#F9FAFB' },
  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 34,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  bottomBarDark: { backgroundColor: '#1A1740', borderTopColor: '#2E2856' },
  bottomLeft: { flex: 1, marginRight: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  priceLabel: { fontSize: 11, color: '#6B7280' },
  priceLabelDark: { color: '#9CA3AF' },
  priceValue: { fontSize: 11, color: '#374151', fontWeight: '500' },
  priceValueDark: { color: '#D1D5DB' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 4, marginTop: 2, marginBottom: 0 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#7B61FF' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#7B61FF' },
  continueBtn: { borderRadius: 14, overflow: 'hidden' },
  continueBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  continueBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
