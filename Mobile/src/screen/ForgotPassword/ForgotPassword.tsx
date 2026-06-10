import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppNavigation } from '../../navigation/navigation';
import { GradientText } from '../../components/GradientComponents/GradientComponents';
import Button from '../../components/Button/Button';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../validation/validation';
import { toast } from '../../components/Toast/Toast';
import { verifyEmailApi, resetPasswordApi } from '../../axios/auth';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';

export default function ForgotPassword() {
  const navigation = useAppNavigation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Đặt lại Mật khẩu
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation handlers
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!text.trim()) {
      setEmailError(null);
    } else {
      setEmailError(validateEmail(text));
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

  // Submit handlers
  const handleVerifyEmail = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    try {
      await verifyEmailApi(email.trim());
      toast.success(language === 'vi' ? 'Xác minh email thành công' : 'Email verified successfully');
      setTimeout(() => {
        setStep(2);
      }, 1500);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Xác minh email thất bại. Vui lòng kiểm tra lại!' : 'Email verification failed. Please check again!');
      toast.error(errorMsg);
    }
  };

  const handleResetPassword = async () => {
    const passErr = validatePassword(newPassword);
    const confErr = validateConfirmPassword(newPassword, confirmPassword);

    if (passErr || confErr) {
      setNewPasswordError(passErr);
      setConfirmPasswordError(confErr);
      return;
    }

    try {
      await resetPasswordApi({
        email: email.trim(),
        newPassword: newPassword
      });
      toast.success(language === 'vi' ? 'Mật khẩu đã được đặt lại thành công!' : 'Password reset successfully!');
      setTimeout(() => {
        navigation.goToLogin();
      }, 1500);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Đặt lại mật khẩu thất bại. Vui lòng thử lại!' : 'Password reset failed. Please try again!');
      toast.error(errorMsg);
    }
  };

  const getBorderColor = (fieldName: string) => {
    if (fieldName === 'email' && emailError) return '#EF4444';
    if (fieldName === 'newPassword' && newPasswordError) return '#EF4444';
    if (fieldName === 'confirmPassword' && confirmPasswordError) return '#EF4444';

    return focusedField === fieldName ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF');
  };

  const getIconColor = (fieldName: string) => {
    return focusedField === fieldName ? '#7B61FF' : '#9ca3af';
  };

  const isEmailValid = email.trim().length > 0 && emailError === null;
  const isResetValid = newPassword.length > 0 && newPasswordError === null && confirmPassword.length > 0 && confirmPasswordError === null;

  return (
    <LinearGradient
      colors={isDark ? ['#0F0C20', '#151030'] : ['#FAF7FF', '#EBE3FF']}
      style={StyleSheet.absoluteFill}
    >
      {/* Soft glowing pastel background circles */}
      <View style={[styles.glowTopRight, { backgroundColor: isDark ? '#1D183B' : '#E5D9FF' }]} />
      <View style={[styles.glowBottomLeft, { backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-5 py-2"
        >
          {/* Main Card Container */}
          <View 
            style={{ 
              backgroundColor: isDark ? '#1D183B' : '#FFFFFF', 
              borderColor: isDark ? '#2E2856' : '#F3E8FF/40',
              borderWidth: 1,
              position: 'relative'
            }}
            className="rounded-[36px] pt-5 pb-5 px-5 shadow-xl"
          >
            
            {/* Header Back/Close Button */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }}
              className="w-8 h-8 rounded-full justify-center items-center"
              onPress={() => navigation.goToLogin()}
            >
              <Ionicons name="close" size={18} color="#7B61FF" />
            </TouchableOpacity>

            {/* Logo and Subtitle */}
            <View className="items-center mb-2 mt-4">
              {/* mievoh logo image */}
              <View 
                style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', borderColor: isDark ? '#2E2856' : '#E5E7EB' }}
                className="border rounded-full p-0.5 shadow-sm mb-1"
              >
                <Image 
                  source={require('../../../assets/images/mievoh/mievoh_logo.png')} 
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  resizeMode="cover"
                />
              </View>
              {/* mievoh text image (cropped and enlarged) */}
              <View style={{ width: 135, height: 40, overflow: 'hidden', position: 'relative' }}>
                <Image 
                  source={require('../../../assets/images/mievoh/mievoh_text.png')} 
                  style={{ position: 'absolute', width: 150, height: 150, left: -12, top: -59 }}
                  resizeMode="contain"
                />
              </View>
              {/* Subtitle */}
              <Text 
                style={{ color: isDark ? '#F3F4F6' : '#7B61FF' }}
                className="text-[13px] font-semibold text-center px-4 leading-5 mt-1"
              >
                {language === 'vi' ? 'Chào mừng bạn quay trở lại với Mievoh Cinema' : 'Welcome back to Mievoh Cinema'}
              </Text>
            </View>

            {step === 1 ? (
              // BƯỚC 1: NHẬP EMAIL
              <>
                {/* Heading */}
                <GradientText 
                  colors={['#A38FFF', '#7B61FF']} 
                  className="text-2xl font-extrabold text-center mb-3 tracking-wide"
                >
                  {language === 'vi' ? 'Quên Mật Khẩu' : 'Forgot Password'}
                </GradientText>

                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs text-center mb-5 px-2 text-wrap"
                >
                  {language === 'vi' 
                    ? 'Vui lòng nhập địa chỉ Email đã đăng ký tài khoản. Chúng tôi sẽ gửi thông tin để xác minh tài khoản của bạn.'
                    : 'Please enter your registered email address. We will send details to verify your account.'}
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <View 
                    style={{ 
                      borderColor: getBorderColor('email'), 
                      backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                      borderWidth: 1
                    }}
                    className="flex-row items-center border rounded-2xl px-4 py-2"
                  >
                    <Ionicons name="mail-outline" size={18} color={getIconColor('email')} className="mr-3" />
                    <TextInput
                      placeholder={language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={email}
                      onChangeText={handleEmailChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                      className="flex-1 text-sm"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                  </View>
                  {emailError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{emailError}</Text>
                  ) : null}
                </View>

                {/* Verification Button */}
                <Button 
                  onPress={handleVerifyEmail}
                  size="md"
                  disabled={!isEmailValid}
                  className={`w-full shadow-lg mb-4 ${isEmailValid ? 'opacity-100 shadow-purple-500/20' : 'opacity-50'}`}
                >
                  {language === 'vi' ? 'XÁC MINH' : 'VERIFY'}
                </Button>
              </>
            ) : (
              // BƯỚC 2: ĐẶT LẠI MẬT KHẨU
              <>
                {/* Heading */}
                <GradientText 
                  colors={['#A38FFF', '#7B61FF']} 
                  className="text-2xl font-extrabold text-center mb-4 tracking-wide"
                >
                  {language === 'vi' ? 'Đặt Lại Mật Khẩu' : 'Reset Password'}
                </GradientText>

                {/* New Password Input */}
                <View className="mb-3">
                  <View 
                    style={{ 
                      borderColor: getBorderColor('newPassword'), 
                      backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                      borderWidth: 1
                    }}
                    className="flex-row items-center border rounded-2xl px-4 py-2"
                  >
                    <Ionicons name="lock-closed-outline" size={18} color={getIconColor('newPassword')} className="mr-3" />
                    <TextInput
                      placeholder={language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={handleNewPasswordChange}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                      className="flex-1 text-sm"
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons 
                        name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color="#7B61FF" 
                      />
                    </TouchableOpacity>
                  </View>
                  {newPasswordError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{newPasswordError}</Text>
                  ) : null}
                </View>

                {/* Confirm Password Input */}
                <View className="mb-4">
                  <View 
                    style={{ 
                      borderColor: getBorderColor('confirmPassword'), 
                      backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                      borderWidth: 1
                    }}
                    className="flex-row items-center border rounded-2xl px-4 py-2"
                  >
                    <Ionicons name="lock-closed-outline" size={18} color={getIconColor('confirmPassword')} className="mr-3" />
                    <TextInput
                      placeholder={language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                      className="flex-1 text-sm"
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color="#7B61FF" 
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{confirmPasswordError}</Text>
                  ) : null}
                </View>

                {/* Reset Password Button */}
                <Button 
                  onPress={handleResetPassword}
                  size="md"
                  disabled={!isResetValid}
                  className={`w-full shadow-lg mb-4 ${isResetValid ? 'opacity-100 shadow-purple-500/20' : 'opacity-50'}`}
                >
                  {language === 'vi' ? 'ĐẶT LẠI MẬT KHẨU' : 'RESET PASSWORD'}
                </Button>
              </>
            )}

            {/* Cancel Button */}
            <TouchableOpacity onPress={() => navigation.goToLogin()} className="align-self-center py-2 mb-2">
              <Text className="text-sm font-semibold text-purple-600 underline text-center">
                {t('cancel_btn')}
              </Text>
            </TouchableOpacity>

            {/* Bottom Register Link */}
            <View className="flex-row justify-center items-center mt-1">
              <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }} className="text-sm">
                {language === 'vi' ? 'Chưa có tài khoản? ' : 'New to Mievoh? '}
              </Text>
              <TouchableOpacity onPress={() => navigation.goToRegister()}>
                <Text className="text-sm font-bold text-[#7B61FF] underline">
                  {language === 'vi' ? 'Đăng ký ngay' : 'Sign up now'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.5,
  }
});
