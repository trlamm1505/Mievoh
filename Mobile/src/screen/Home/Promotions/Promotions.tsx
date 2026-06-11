import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { GradientText, GradientIcon } from '../../../components/GradientComponents/GradientComponents';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';
import { getMyVouchersApi, Voucher } from '../../../axios/booking';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GAP) / 2;
const ITEM_WIDTH = CARD_WIDTH + GAP;

interface PromotionsProps {
  onSeeAll?: () => void;
}

export default function Promotions({ onSeeAll }: PromotionsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  const { isLoggedIn } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isInteracting = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setPromotions([]);
      setLoading(false);
      return;
    }

    const fetchPromotions = async () => {
      try {
        const res = await getMyVouchersApi();
        
        let vouchers: Voucher[] = [];
        if (Array.isArray(res)) {
          vouchers = res;
        } else if (res && Array.isArray((res as any).data)) {
          vouchers = (res as any).data;
        } else if (res && (res as any).data && Array.isArray((res as any).data.data)) {
          vouchers = (res as any).data.data;
        }

        // Sort by highest discount value (weight)
        const sorted = [...vouchers].sort((a, b) => {
          const getWeight = (p: Voucher) => {
            if (p.discountType === 'PERCENTAGE') {
              if (p.maxDiscount) return p.maxDiscount;
              return p.discountValue * 1000;
            }
            return p.discountValue;
          };
          return getWeight(b) - getWeight(a);
        });

        // Take only top 4
        const top4 = sorted.slice(0, 4);

        const mapped = top4.map((v) => {
          const valStr = v.discountType === 'PERCENTAGE' 
            ? `${v.discountValue}%` 
            : `${v.discountValue.toLocaleString()}đ`;

          const maxStr = v.maxDiscount 
            ? (language === 'en' ? ` up to ${v.maxDiscount.toLocaleString()}đ` : ` tối đa ${v.maxDiscount.toLocaleString()}đ`) 
            : '';
          const minStr = v.minPurchase 
            ? (language === 'en' ? ` for orders from ${v.minPurchase.toLocaleString()}đ` : ` cho đơn hàng từ ${v.minPurchase.toLocaleString()}đ`) 
            : '';
          
          const title_vi = `Giảm ngay ${valStr}`;
          const title_en = `Get ${valStr} discount`;

          const desc_vi = `Nhận ngay ưu đãi ${valStr} giảm giá${maxStr}${minStr}.`;
          const desc_en = `Get ${valStr} discount${maxStr}${minStr}.`;

          const expiryDate = new Date(v.endDate).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');

          return {
            id: v.voucherId,
            title_vi,
            title_en,
            desc_vi,
            desc_en,
            code: v.code,
            expiryDate,
          };
        });

        setPromotions(mapped);
      } catch (err) {
        console.error('Error fetching promotions for home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [language, isLoggedIn]);

  useEffect(() => {
    if (promotions.length === 0) return;

    const timer = setInterval(() => {
      if (isInteracting.current) return;

      let nextIndex = currentIndex + 1;
      const maxScrollIndex = promotions.length - 2; // Show 2 cards at a time, scroll limit is length - 2
      if (nextIndex > maxScrollIndex) {
        nextIndex = 0;
      }
      
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * ITEM_WIDTH,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex, promotions.length]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / ITEM_WIDTH);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="small" color="#7B61FF" />
      </View>
    );
  }

  if (promotions.length === 0) return null;

  return (
    <View className="py-3 mb-6">
      {/* Title Header */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <GradientText className="text-xl font-bold">
          {t('special_promotions')}
        </GradientText>
        <TouchableOpacity onPress={onSeeAll}>
          <GradientIcon name="arrow-forward-outline" size={22} />
        </TouchableOpacity>
      </View>

      {/* Auto-scrolling, snapping FlatList of Promotions showing 2 items at a time */}
      <FlatList
        ref={flatListRef}
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        onScrollBeginDrag={() => { isInteracting.current = true; }}
        onScrollEndDrag={() => { 
          setTimeout(() => { isInteracting.current = false; }, 1000); 
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            key={item.id}
            activeOpacity={0.9}
            style={{ 
              width: CARD_WIDTH,
              height: 96,
              marginRight: index === promotions.length - 1 ? 0 : GAP,
              backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
              borderColor: isDark ? '#2E2856' : '#E5E7EB',
              borderWidth: 1,
              flexDirection: 'row',
              position: 'relative',
            }}
            className="rounded-[16px] shadow-sm overflow-hidden"
          >
            {/* Left Accent Area */}
            <LinearGradient
              colors={isDark ? ['#5B41E6', '#2E1E8B'] : ['#8B5CF6', '#C3B1FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                width: 32,
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Ionicons name="gift" size={16} color="#FFFFFF" />
            </LinearGradient>

            {/* Dotted / Dashed Separator Line */}
            <View 
              style={{
                width: 1,
                height: '100%',
                borderStyle: 'dashed',
                borderWidth: 1,
                borderColor: isDark ? '#3D3570' : '#E5E7EB',
                marginLeft: -0.5,
              }}
            />

            {/* Semi-circular ticket cutouts */}
            <View 
              style={{
                position: 'absolute',
                top: -5,
                left: 27, // (32 width - 5 radius) = 27
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isDark ? '#0F0C20' : '#FFFFFF',
                zIndex: 10,
              }}
            />
            <View 
              style={{
                position: 'absolute',
                bottom: -5,
                left: 27,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isDark ? '#0F0C20' : '#FFFFFF',
                zIndex: 10,
              }}
            />

            {/* Right Promo Info */}
            <View style={{ flex: 1, padding: 8, paddingLeft: 10, justifyContent: 'space-between' }}>
              <View>
                {/* Title */}
                <Text 
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="text-[11px] font-bold mb-0.5" 
                  numberOfLines={1}
                >
                  {language === 'vi' ? item.title_vi : item.title_en}
                </Text>

                {/* Description */}
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-[9px] leading-3 h-6" 
                  numberOfLines={2}
                >
                  {language === 'vi' ? item.desc_vi : item.desc_en}
                </Text>
              </View>

              {/* Code and Expiry Row */}
              <View className="flex-row items-center justify-between mt-auto">
                <View 
                  style={{ backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }}
                  className="px-1.5 py-0.5 rounded"
                >
                  <Text 
                    style={{ color: isDark ? '#9F8CFF' : '#7B61FF' }}
                    className="text-[8px] font-bold uppercase"
                  >
                    {item.code}
                  </Text>
                </View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
                  className="text-[8px] font-semibold"
                >
                  {language === 'vi' ? 'HSD' : 'EXP'}: {item.expiryDate}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
