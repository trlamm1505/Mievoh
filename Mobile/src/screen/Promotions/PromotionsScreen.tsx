import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Clipboard, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { getMyVouchersApi, Voucher } from '../../axios/booking';
import { LinearGradient } from 'expo-linear-gradient';

export default function PromotionsScreen() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // Sort by highest discount value (weight) descending
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

        const mapped = sorted.map((v) => {
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
        console.error('Error fetching promotions for list screen:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [language]);

  const handleCopyCode = (code: string, id: string) => {
    Clipboard.setString(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <View 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#F9FAFB' }}
      className="flex-1"
    >
      {/* Hero Banner Card */}
      <View className="px-4 pt-4 pb-2">
        <LinearGradient
          colors={isDark ? ['#312E81', '#1E1B4B'] : ['#7B61FF', '#C3B1FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 16, position: 'relative', overflow: 'hidden' }}
          className="shadow-sm"
        >
          {/* Background decorative circles */}
          <View 
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <View 
            style={{
              position: 'absolute',
              left: -40,
              bottom: -40,
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-base font-extrabold uppercase tracking-wider">
                {language === 'vi' ? 'SĂN DEAL HOT' : 'HOT DEALS'}
              </Text>
              <Text className="text-white/80 text-[10px] font-semibold mt-1 leading-4">
                {language === 'vi' 
                  ? 'Nhập mã liền tay - Nhận ngay giảm giá vé & bắp nước cực đã!' 
                  : 'Claim vouchers to get discounts on tickets & combos!'}
              </Text>
            </View>
            <View className="w-11 h-11 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </View>



      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#7B61FF" />
        </View>
      ) : promotions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4 py-12">
          <Ionicons name="gift-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm font-semibold mt-3 text-center">
            {language === 'vi' ? 'Không tìm thấy ưu đãi nào khả dụng lúc này.' : 'No promotions available at this moment.'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-2"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {promotions.map((promo) => (
            <View 
              key={promo.id}
              style={{ 
                backgroundColor: isDark ? '#1D183B' : '#FFFFFF', 
                borderColor: isDark ? '#2E2856' : '#E5E7EB',
                borderWidth: 1,
                flexDirection: 'row',
                position: 'relative',
              }}
              className="rounded-[16px] shadow-sm overflow-hidden mb-4"
            >
              {/* Left Accent Area (Purple gradient as before) */}
              <LinearGradient
                colors={isDark ? ['#5B41E6', '#2E1E8B'] : ['#8B5CF6', '#C3B1FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  width: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Ionicons name="gift" size={20} color="#FFFFFF" />
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

              {/* Semi-circular ticket cutouts (No border, matches ScrollView background color exactly) */}
              <View 
                style={{
                  position: 'absolute',
                  top: -6,
                  left: 38, // (44 width - 6 radius) = 38
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: isDark ? '#0F0C20' : '#F9FAFB', // Matches ScrollView background
                  zIndex: 10,
                }}
              />
              <View 
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: 38,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: isDark ? '#0F0C20' : '#F9FAFB', // Matches ScrollView background
                  zIndex: 10,
                }}
              />

              {/* Right Promo Info */}
              <View className="p-3.5 pl-4.5 flex-1 justify-between">
                {/* Text Content */}
                <View>
                  {/* Promo Title */}
                  <Text 
                    style={{ color: isDark ? '#F3F4F6' : '#111827' }}
                    className="text-base font-bold mb-1.5"
                  >
                    {language === 'vi' ? promo.title_vi : promo.title_en}
                  </Text>

                  {/* Description */}
                  <Text 
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    className="text-xs mb-3.5 leading-5"
                  >
                    {language === 'vi' ? promo.desc_vi : promo.desc_en}
                  </Text>
                </View>

                {/* Action and Info Row */}
                <View 
                  style={{ borderTopColor: isDark ? '#2E2856' : '#F3F4F6' }}
                  className="flex-row items-center justify-between pt-3 border-t"
                >
                  <View>
                    <Text className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                      {language === 'vi' ? 'Hạn sử dụng' : 'Expiry Date'}
                    </Text>
                    <Text 
                      style={{ color: isDark ? '#F3F4F6' : '#374151' }}
                      className="text-xs font-bold"
                    >
                      {promo.expiryDate}
                    </Text>
                  </View>

                  {/* Copy Code Button */}
                  <TouchableOpacity
                    onPress={() => handleCopyCode(promo.code, promo.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: copiedId === promo.id 
                        ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') 
                        : (isDark ? '#2E2856' : '#F3E8FF'),
                      borderColor: copiedId === promo.id 
                        ? '#10B981' 
                        : (isDark ? '#9F8CFF' : '#7B61FF'),
                      borderWidth: 1
                    }}
                    className="flex-row items-center px-4 py-2 rounded-xl"
                  >
                    <Ionicons 
                      name={copiedId === promo.id ? "checkmark-circle-outline" : "copy-outline"} 
                      size={14} 
                      color={copiedId === promo.id ? "#10B981" : "#7B61FF"} 
                      style={{ marginRight: 6 }}
                    />
                    <Text 
                      className="text-xs font-bold"
                      style={{
                        color: copiedId === promo.id ? '#10B981' : (isDark ? '#9F8CFF' : '#7B61FF')
                      }}
                    >
                      {copiedId === promo.id ? (language === 'vi' ? 'Đã sao chép' : 'Copied') : promo.code}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
