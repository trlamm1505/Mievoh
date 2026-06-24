import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useAppNavigation } from '../../navigation/navigation';
import { GradientText } from '../../components/GradientComponents/GradientComponents';
import Button from '../../components/Button/Button';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '../../components/Toast/Toast';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { useFocusEffect } from 'expo-router';

export default function Profile() {
  const navigation = useAppNavigation();
  const { isLoggedIn, logout, user, updateAvatar, fetchProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchProfile();
      }
    }, [isLoggedIn])
  );

  const handleLoginPress = () => {
    navigation.goToLogin();
  };

  const handleUploadAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.error(language === 'vi' ? 'Ứng dụng cần quyền truy cập thư viện ảnh để cập nhật ảnh đại diện!' : 'The app needs photo library access to update avatar!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        await updateAvatar(selectedUri);
        toast.success(t('avatar_updated_success'));
      }
    } catch (error) {
      console.error('Lỗi khi tải ảnh đại diện:', error);
      toast.error(language === 'vi' ? 'Không thể tải ảnh lên, vui lòng thử lại.' : 'Failed to upload image, please try again.');
    }
  };

  if (!isLoggedIn) {
    return (
      <View
        style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', minHeight: 500 }}
        className="flex-1 items-center justify-center px-6 py-16"
      >
        {/* Icon container with modern double-circle glow effect */}
        <View
          style={{ backgroundColor: isDark ? 'rgba(123, 97, 255, 0.15)' : '#F3E8FF/50' }}
          className="w-28 h-28 rounded-full justify-center items-center mb-8 shadow-sm"
        >
          <View
            style={{ backgroundColor: isDark ? 'rgba(123, 97, 255, 0.25)' : '#E5D9FF' }}
            className="w-20 h-20 rounded-full justify-center items-center"
          >
            <Ionicons name="lock-closed" size={38} color="#7B61FF" />
          </View>
        </View>

        {/* Title with premium Purple Gradient */}
        <GradientText className="text-2xl font-extrabold text-center mb-3">
          {language === 'vi' ? 'Bạn Chưa Đăng Nhập' : 'You are not logged in'}
        </GradientText>

        {/* Description */}
        <Text
          style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
          className="text-sm text-center mb-10 leading-5 max-w-[300px]"
        >
          {language === 'vi'
            ? 'Đăng nhập để nhận vé ưu đãi, xem lịch sử đặt vé và tích lũy điểm thưởng thành viên Mievoh.'
            : 'Log in to claim promotional tickets, view watch history, and accumulate Mievoh member rewards.'}
        </Text>

        {/* Action Buttons Stack */}
        <View className="w-full gap-3 px-2">
          <Button
            onPress={handleLoginPress}
            className="w-full shadow-lg shadow-purple-500/15"
          >
            {t('login')}
          </Button>

          <Button
            onPress={() => navigation.goToRegister()}
            variant="outline"
            className="w-full border-[#7B61FF]/30"
            textClassName="text-[#7B61FF]"
          >
            {t('register')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: isDark ? '#0F0C20' : '#F9FAFB' }}
      className="flex-1 px-4 py-6"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Profile Header Card */}
      <View
        style={{
          backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
          borderColor: isDark ? '#2E2856' : '#F3F4F6',
          borderWidth: 1
        }}
        className="items-center py-8 px-4 rounded-3xl shadow-sm mb-6"
      >
        <View className="relative">
          {/* Avatar Container with Purple Border */}
          <View
            style={{ borderColor: '#7B61FF', backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
            className="w-32 h-32 rounded-full border-[3px] justify-center items-center overflow-hidden shadow-md"
          >
            <Image
              source={
                user?.avatar
                  ? { uri: user.avatar }
                  : require('../../../assets/images/mievoh/avatar.jpg')
              }
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {/* Camera Upload Badge */}
          <TouchableOpacity
            onPress={handleUploadAvatar}
            activeOpacity={0.8}
            style={{ borderColor: isDark ? '#1D183B' : '#FFFFFF' }}
            className="absolute bottom-0 right-1 w-9 h-9 rounded-full bg-[#7B61FF] border-2 justify-center items-center shadow-lg"
          >
            <Ionicons name="camera" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Name and Member Tag */}
        <Text
          style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
          className="text-xl font-extrabold mt-4"
        >
          {user?.fullName || user?.email}
        </Text>
      </View>

      {/* Options List */}
      <View className="gap-3">
        {/* Option 1: Thông tin cá nhân */}
        <TouchableOpacity
          style={{
            backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
            borderColor: isDark ? '#2E2856' : '#F3F4F6',
            borderWidth: 1
          }}
          className="flex-row items-center justify-between p-4 rounded-2xl shadow-sm"
          onPress={() => navigation.goToPersonalInfo()}
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: isDark ? '#2E2856' : '#F3F4F6' }}
              className="w-10 h-10 rounded-full justify-center items-center mr-4"
            >
              <Ionicons name="person-outline" size={20} color="#7B61FF" />
            </View>
            <Text
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="text-[15px] font-bold"
            >
              {t('profile')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* Option 2: Lịch sử xem phim */}
        <TouchableOpacity
          style={{
            backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
            borderColor: isDark ? '#2E2856' : '#F3F4F6',
            borderWidth: 1
          }}
          className="flex-row items-center justify-between p-4 rounded-2xl shadow-sm"
          onPress={() => navigation.goToMovieHistory()}
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: isDark ? '#2E2856' : '#F3F4F6' }}
              className="w-10 h-10 rounded-full justify-center items-center mr-4"
            >
              <Ionicons name="film-outline" size={20} color="#7B61FF" />
            </View>
            <Text
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="text-[15px] font-bold"
            >
              {language === 'vi' ? 'Lịch sử xem phim' : 'Watch History'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* Option 3: Đổi mật khẩu */}
        <TouchableOpacity
          style={{
            backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
            borderColor: isDark ? '#2E2856' : '#F3F4F6',
            borderWidth: 1
          }}
          className="flex-row items-center justify-between p-4 rounded-2xl shadow-sm"
          onPress={() => navigation.goToChangePassword()}
        >
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: isDark ? '#2E2856' : '#F3F4F6' }}
              className="w-10 h-10 rounded-full justify-center items-center mr-4"
            >
              <Ionicons name="lock-closed-outline" size={20} color="#7B61FF" />
            </View>
            <Text
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="text-[15px] font-bold"
            >
              {t('change_password')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* Option 4: Đăng xuất */}
        <TouchableOpacity
          style={{
            backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
            borderColor: isDark ? '#2E2856' : '#F3F4F6',
            borderWidth: 1
          }}
          className="flex-row items-center justify-between p-4 rounded-2xl shadow-sm"
          onPress={logout}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-red-50 justify-center items-center mr-4">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text className="text-[15px] font-bold text-red-500">{t('logout')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
