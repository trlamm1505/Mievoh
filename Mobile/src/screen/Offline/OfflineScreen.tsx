import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Image, Modal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useAppNavigation } from '../../navigation/navigation';

export default function OfflineScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { language, setLanguage } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  const navigation = useAppNavigation();
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0814' : '#F3F4F6' }}>
      {/* Background Image placed behind everything with absolute fill and zIndex -1 */}
      <Image
        source={require('../../../assets/images/mievoh/movie_theater_bg.png')}
        style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
        resizeMode="cover"
      />

      {/* Top Header Bar showing User Info and Settings Button */}
      <View 
        style={{ 
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          borderBottomWidth: 1,
          backgroundColor: isDark ? 'rgba(15, 12, 32, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        }}
        className="flex-row items-center justify-between px-6 py-3"
      >
        {isLoggedIn && user ? (
          <View className="flex-row items-center">
            <Image
              source={
                user.avatar
                  ? { uri: user.avatar }
                  : require('../../../assets/images/mievoh/avatar.jpg')
              }
              style={{ width: 40, height: 40, borderRadius: 20 }}
              className="border border-violet-400/30"
              resizeMode="cover"
            />
            <View className="ml-3">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {language === 'vi' ? 'Xin chào,' : 'Hello,'}
              </Text>
              <Text className="text-[15px] font-bold text-gray-805 dark:text-white">
                {user.fullName || user.email}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/images/mievoh/mievoh_logo.png')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
            <View className="ml-3">
              <Text className="text-[15px] font-bold text-gray-855 dark:text-white">
                Mievoh Cinema
              </Text>
            </View>
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity 
          onPress={() => setIsSettingsVisible(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={22} color={isDark ? '#E5E7EB' : '#1f2937'} />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
      >
        {/* Main Introduce Title */}
        <Text 
          style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}
          className="text-2xl font-black text-center mb-2 leading-8"
        >
          {language === 'vi' ? 'Kết nối ngoại tuyến' : 'Offline Mode'}
        </Text>

        {/* Subtitle */}
        <Text 
          style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}
          className="text-xs text-center mb-6 px-4 leading-5 font-medium"
        >
          {language === 'vi'
            ? 'Đã ngắt kết nối mạng. Bạn vẫn có thể xem lại lịch sử đặt vé và thông tin vé đã mua trước đó.'
            : 'You are currently offline. You can still view your booking history and previously purchased tickets.'}
        </Text>

        {/* Feature Cards Showcase */}
        {/* Card 1: Premium Lounge */}
        <View style={styles.featureCard}>
          <Image
            source={require('../../../assets/images/mievoh/cinema_lounge_feature.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.cardGradientOverlay} />
          
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-white text-base font-extrabold">
              {language === 'vi' ? 'Không gian đẳng cấp' : 'Premium Space'}
            </Text>
            <Text className="text-gray-300 text-[10px] mt-0.5 leading-4 font-medium">
              {language === 'vi'
                ? 'Trải nghiệm rạp chiếu phim hiện đại với tiêu chuẩn quốc tế.'
                : 'Experience state-of-the-art cinema rooms built to international standards.'}
            </Text>
          </View>
        </View>

        {/* Card 2: Easy Ticket Booking */}
        <View style={styles.featureCard}>
          <Image
            source={require('../../../assets/images/mievoh/ticket_booking_feature.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.cardGradientOverlay} />
          
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-white text-base font-extrabold">
              {language === 'vi' ? 'Đặt vé dễ dàng' : 'Easy Ticket Booking'}
            </Text>
            <Text className="text-gray-300 text-[10px] mt-0.5 leading-4 font-medium">
              {language === 'vi'
                ? 'Chỉ vài thao tác đơn giản để sở hữu chỗ ngồi đẹp nhất.'
                : 'Just a few simple taps to grab the absolute best seats in the theater.'}
            </Text>
          </View>
        </View>

        {/* Card 3: IMAX & Dolby */}
        <View style={styles.featureCard}>
          <Image
            source={require('../../../assets/images/mievoh/imax_dolby_feature.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.cardGradientOverlay} />
          
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-white text-base font-extrabold">
              {language === 'vi' ? 'Công nghệ IMAX & Dolby' : 'IMAX & Dolby Technology'}
            </Text>
            <Text className="text-gray-300 text-[10px] mt-0.5 leading-4 font-medium">
              {language === 'vi'
                ? 'Hình ảnh sắc nét và âm thanh sống động đến từng chi tiết.'
                : 'Crystal-clear screen visuals and breathtaking audio details.'}
            </Text>
          </View>
        </View>

        {/* Redirect Button to Movie History at the end */}
        <TouchableOpacity
          onPress={() => navigation.goToMovieHistory()}
          style={{ 
            backgroundColor: '#7B61FF',
            shadowColor: '#7B61FF',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 5,
            width: '100%',
            marginTop: 8
          }}
          className="py-4 rounded-2xl items-center justify-center active:opacity-90 flex-row"
        >
          <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white text-base font-extrabold tracking-wide">
            {language === 'vi' ? 'Xem Lịch Sử Đặt Vé' : 'View Booking History'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Dropdown Popover */}
      <Modal
        visible={isSettingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsSettingsVisible(false)}
        >
          <View style={[
            styles.dropdownContainer,
            isDark && styles.dropdownContainerDark
          ]}>
            {/* Theme Choice Item with Two Icons */}
            <View style={styles.dropdownItemRow}>
              <View className="flex-row items-center flex-1">
                <Ionicons name="color-palette-outline" size={18} color="#7B61FF" />
                <Text style={[
                  styles.dropdownLabel,
                  isDark && styles.dropdownTextDark
                ]}>
                  {language === 'vi' ? 'Giao diện' : 'Theme'}
                </Text>
              </View>
              
              <View style={[
                styles.themeOptionsContainer,
                isDark && styles.themeOptionsContainerDark
              ]}>
                {/* Sun (Light Mode) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    !isDark && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (isDark) toggleTheme();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="sunny" 
                    size={14} 
                    color={!isDark ? "#FFFFFF" : "#7B61FF"} 
                  />
                </TouchableOpacity>

                {/* Moon (Dark Mode) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    isDark && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (!isDark) toggleTheme();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="moon" 
                    size={14} 
                    color={isDark ? "#FFFFFF" : "#7B61FF"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            {/* Language Choice Item with Two Options */}
            <View style={styles.dropdownItemRow}>
              <View className="flex-row items-center flex-1">
                <Ionicons name="globe-outline" size={18} color="#7B61FF" />
                <Text style={[
                  styles.dropdownLabel,
                  isDark && styles.dropdownTextDark
                ]}>
                  {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                </Text>
              </View>
              
              <View style={[
                styles.themeOptionsContainer,
                isDark && styles.themeOptionsContainerDark
              ]}>
                {/* VI (Tiếng Việt) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    language === 'vi' && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (language !== 'vi') setLanguage('vi');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 'bold', 
                      color: language === 'vi' ? "#FFFFFF" : "#7B61FF" 
                    }}
                  >
                    VI
                  </Text>
                </TouchableOpacity>

                {/* EN (English) */}
                <TouchableOpacity 
                  style={[
                    styles.themeButton,
                    language === 'en' && styles.themeButtonActive
                  ]}
                  onPress={() => {
                    if (language !== 'en') setLanguage('en');
                  }}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 'bold', 
                      color: language === 'en' ? "#FFFFFF" : "#7B61FF" 
                    }}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 60,
    right: 16,
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFEBF4',
  },
  dropdownContainerDark: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  dropdownTextDark: {
    color: '#E5E7EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  dividerDark: {
    backgroundColor: '#312E81',
  },
  themeOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeOptionsContainerDark: {
    backgroundColor: '#0F0C20',
    borderColor: '#312E81',
  },
  themeButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#7B61FF',
  },
  featureCard: {
    height: 155,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    borderColor: 'rgba(123, 97, 255, 0.25)',
    borderWidth: 1.5,
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 12, 32, 0.55)', // Dark translucent overlay for readability
  },
});
