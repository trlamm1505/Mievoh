import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../../../navigation/navigation';
import { toast } from '../../../components/Toast/Toast';
import { validatePassword, validateConfirmPassword } from '../../../validation/validation';
import { changePasswordApi } from '../../../axios/auth';
import Button from '../../../components/Button/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

export default function ChangePassword() {
  const navigation = useAppNavigation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [oldPasswordError, setOldPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleOldPasswordChange = (text: string) => {
    setOldPassword(text);
    if (!text) {
      setOldPasswordError(language === 'vi' ? 'Vui lòng nhập mật khẩu cũ' : 'Please enter current password');
    } else {
      setOldPasswordError(null);
    }
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (!text) {
      setNewPasswordError(null);
    } else {
      setNewPasswordError(validatePassword(text));
    }
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(text, confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError(null);
    } else {
      setConfirmPasswordError(validateConfirmPassword(newPassword, text));
    }
  };

  const handleChangePassword = async () => {
    // Validate
    const oldErr = !oldPassword ? (language === 'vi' ? 'Vui lòng nhập mật khẩu cũ' : 'Please enter current password') : null;
    const newErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(newPassword, confirmPassword);

    setOldPasswordError(oldErr);
    setNewPasswordError(newErr);
    setConfirmPasswordError(confirmErr);

    if (oldErr || newErr || confirmErr) {
      toast.error(language === 'vi' ? 'Vui lòng kiểm tra lại thông tin mật khẩu!' : 'Please check your password details again!');
      return;
    }

    try {
      const response = await changePasswordApi({
        oldPassword: oldPassword,
        newPassword: newPassword,
      });
      toast.success(response.message || (language === 'vi' ? 'Thay đổi mật khẩu thành công!' : 'Password changed successfully!'));
      navigation.goBack();
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Thay đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!' : 'Failed to change password. Please check your current password!');
      toast.error(errorMsg);
    }
  };

  const getBorderColor = (fieldName: string) => {
    if (fieldName === 'old' && oldPasswordError) return '#EF4444';
    if (fieldName === 'new' && newPasswordError) return '#EF4444';
    if (fieldName === 'confirm' && confirmPasswordError) return '#EF4444';
    return focusedField === fieldName ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF');
  };

  return (
    <SafeAreaView 
      edges={['top']} 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
      className="flex-1"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header bar */}
        <View 
          style={{ 
            backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', 
            borderBottomColor: isDark ? '#2E2856' : '#F3F4F6',
            borderBottomWidth: 1
          }}
          className="flex-row items-center justify-between px-4 py-4"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F3F4F6" : "#1f2937"} />
          </TouchableOpacity>
          <Text 
            style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
            className="text-lg font-bold"
          >
            {t('change_password')}
          </Text>
          <View className="w-8" />
        </View>

      <ScrollView 
        style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6">
          <Text className="text-2xl font-extrabold text-[#7B61FF] mb-2">
            {language === 'vi' ? 'Đổi mật khẩu mới' : 'Change Password'}
          </Text>
          <Text 
            style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}
            className="text-sm"
          >
            {language === 'vi' ? 'Hãy tạo mật khẩu mạnh để bảo vệ tài khoản của bạn.' : 'Please create a strong password to protect your account.'}
          </Text>
        </View>

        {/* Old Password */}
        <View className="mb-4">
          <Text 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            className="text-xs font-semibold mb-1.5 ml-1"
          >
            {language === 'vi' ? 'Mật khẩu hiện tại' : 'Current Password'}
          </Text>
          <View 
            style={{ 
              borderColor: getBorderColor('old'),
              backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
            }}
            className="flex-row items-center border rounded-2xl px-4 py-3"
          >
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'old' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
            <TextInput
              placeholder={language === 'vi' ? 'Nhập mật khẩu hiện tại' : 'Enter current password'}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={handleOldPasswordChange}
              onFocus={() => setFocusedField('old')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="flex-1 text-sm"
            />
            <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
              <Ionicons name={showOldPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#7B61FF" />
            </TouchableOpacity>
          </View>
          {oldPasswordError ? (
            <Text className="text-red-500 text-xs mt-1 ml-2">{oldPasswordError}</Text>
          ) : null}
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            className="text-xs font-semibold mb-1.5 ml-1"
          >
            {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
          </Text>
          <View 
            style={{ 
              borderColor: getBorderColor('new'),
              backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
            }}
            className="flex-row items-center border rounded-2xl px-4 py-3"
          >
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'new' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
            <TextInput
              placeholder={language === 'vi' ? 'Nhập mật khẩu mới' : 'Enter new password'}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={handleNewPasswordChange}
              onFocus={() => setFocusedField('new')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="flex-1 text-sm"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#7B61FF" />
            </TouchableOpacity>
          </View>
          {newPasswordError ? (
            <Text className="text-red-500 text-xs mt-1 ml-2">{newPasswordError}</Text>
          ) : null}
        </View>

        {/* Confirm Password */}
        <View className="mb-8">
          <Text 
            style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            className="text-xs font-semibold mb-1.5 ml-1"
          >
            {language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
          </Text>
          <View 
            style={{ 
              borderColor: getBorderColor('confirm'),
              backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
            }}
            className="flex-row items-center border rounded-2xl px-4 py-3"
          >
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'confirm' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
            <TextInput
              placeholder={language === 'vi' ? 'Nhập lại mật khẩu mới' : 'Confirm new password'}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="flex-1 text-sm"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#7B61FF" />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <Text className="text-red-500 text-xs mt-1 ml-2">{confirmPasswordError}</Text>
          ) : null}
        </View>

        {/* Action Button */}
        <Button 
          onPress={handleChangePassword}
          className="w-full shadow-lg shadow-purple-500/10 mb-4"
        >
          {t('change_password').toUpperCase()}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}
