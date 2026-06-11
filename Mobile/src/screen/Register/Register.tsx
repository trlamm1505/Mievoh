import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useAppNavigation } from '../../navigation/navigation';
import { GradientText } from '../../components/GradientComponents/GradientComponents';
import Button from '../../components/Button/Button';
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validateConfirmPassword 
} from '../../validation/validation';
import { toast } from '../../components/Toast/Toast';
import { sendRegisterOtpApi, verifyRegisterOtpApi } from '../../axios/auth';
import OtpModal from '../../components/OtpModal/OtpModal';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';

export default function Register() {
  const navigation = useAppNavigation();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation states
  const [fullnameError, setFullnameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Validity checks cascade (for locking downstream fields)
  const isFullnameValid = fullname.trim().length > 0 && fullnameError === null;
  const isEmailValid = isFullnameValid && email.trim().length > 0 && emailError === null;
  const isPhoneValid = isEmailValid && phone.trim().length > 0 && phoneError === null;
  const isPasswordValid = isPhoneValid && password.length > 0 && passwordError === null;
  const isConfirmPasswordValid = isPasswordValid && confirmPassword.length > 0 && confirmPasswordError === null;

  // Validation handlers
  const handleFullnameChange = (text: string) => {
    setFullname(text);
    if (!text.trim()) {
      setFullnameError(null);
    } else {
      setFullnameError(validateName(text));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!text.trim()) {
      setEmailError(null);
    } else {
      setEmailError(validateEmail(text));
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (!text.trim()) {
      setPhoneError(null);
    } else {
      setPhoneError(validatePhone(text));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!text) {
      setPasswordError(null);
    } else {
      setPasswordError(validatePassword(text));
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
      setConfirmPasswordError(validateConfirmPassword(password, text));
    }
  };
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpResendLoading, setOtpResendLoading] = useState(false);

  useEffect(() => {
    if (otpCode === '') {
      setOtpError(null);
    }
  }, [otpCode]);

  // Input focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!isConfirmPasswordValid) return;
    try {
      await sendRegisterOtpApi({
        fullName: fullname.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        password
      });
      toast.success(language === 'vi' ? 'Đã gửi mã OTP đến email của bạn!' : 'OTP code sent to your email!');
      setOtpCode('');
      setOtpError(null);
      setShowOtpModal(true);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Đăng ký thất bại. Vui lòng thử lại!' : 'Registration failed. Please try again!');
      toast.error(errorMsg);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await verifyRegisterOtpApi({
        email: email.trim(),
        otp: otpCode
      });
      await login(res);
      toast.success(language === 'vi' ? 'Đăng ký tài khoản thành công!' : 'Account registered successfully!');
      setShowOtpModal(false);
      navigation.goToHome();
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Xác thực OTP thất bại. Vui lòng thử lại!' : 'OTP verification failed. Please try again!');
      setOtpError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpResendLoading(true);
    try {
      await sendRegisterOtpApi({
        fullName: fullname.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        password
      });
      toast.success(language === 'vi' ? 'Đã gửi lại mã OTP!' : 'OTP code resent!');
      setOtpCode('');
      setOtpError(null);
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Không thể gửi lại mã OTP. Vui lòng thử lại!' : 'Could not resend OTP. Please try again!');
      toast.error(errorMsg);
    } finally {
      setOtpResendLoading(false);
    }
  };

  const handleSignInPress = () => {
    navigation.goToLogin();
  };

  const getBorderColor = (fieldName: string) => {
    if (fieldName === 'fullname' && fullnameError) return '#EF4444';
    if (fieldName === 'email' && emailError) return '#EF4444';
    if (fieldName === 'phone' && phoneError) return '#EF4444';
    if (fieldName === 'password' && passwordError) return '#EF4444';
    if (fieldName === 'confirmPassword' && confirmPasswordError) return '#EF4444';

    return focusedField === fieldName ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF');
  };

  const getIconColor = (fieldName: string) => {
    return focusedField === fieldName ? '#7B61FF' : '#9ca3af';
  };

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
            
            {/* Header Back/Close Button (Absolute positioned to save vertical space) */}
            <TouchableOpacity 
              style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }}
              className="w-8 h-8 rounded-full justify-center items-center"
              onPress={() => navigation.goToHome()}
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
                {language === 'vi' ? 'Tạo tài khoản mới' : 'Create a new account'}
              </Text>
            </View>

            {/* Heading */}
            <GradientText 
              colors={['#A38FFF', '#7B61FF']} 
              className="text-2xl font-extrabold text-center mb-3 tracking-wide"
            >
              {language === 'vi' ? 'Đăng Ký' : 'Register'}
            </GradientText>

            {/* Form Fields */}
            {/* Fullname Input */}
            <View className="mb-2.5">
              <View 
                style={{ 
                  borderColor: getBorderColor('fullname'), 
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  borderWidth: 1
                }}
                className="flex-row items-center border rounded-2xl px-4 py-2"
              >
                <Ionicons name="person-outline" size={18} color={getIconColor('fullname')} className="mr-3" />
                <TextInput
                  placeholder={language === 'vi' ? 'Họ và tên' : 'Full name'}
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={fullname}
                  onChangeText={handleFullnameChange}
                  onFocus={() => setFocusedField('fullname')}
                  onBlur={() => setFocusedField(null)}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
              {fullnameError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{fullnameError}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View className="mb-2.5">
              <View 
                style={{ 
                  borderColor: getBorderColor('email'), 
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  opacity: isFullnameValid ? 1 : 0.5,
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
                  editable={isFullnameValid}
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

            {/* Phone Input */}
            <View className="mb-2.5">
              <View 
                style={{ 
                  borderColor: getBorderColor('phone'), 
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  opacity: isEmailValid ? 1 : 0.5,
                  borderWidth: 1
                }}
                className="flex-row items-center border rounded-2xl px-4 py-2"
              >
                <Ionicons name="call-outline" size={18} color={getIconColor('phone')} className="mr-3" />
                <TextInput
                  placeholder={language === 'vi' ? 'Số điện thoại' : 'Phone number'}
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  editable={isEmailValid}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  keyboardType="phone-pad"
                />
              </View>
              {phoneError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{phoneError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View className="mb-2.5">
              <View 
                style={{ 
                  borderColor: getBorderColor('password'), 
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  opacity: isPhoneValid ? 1 : 0.5,
                  borderWidth: 1
                }}
                className="flex-row items-center border rounded-2xl px-4 py-2"
              >
                <Ionicons name="lock-closed-outline" size={18} color={getIconColor('password')} className="mr-3" />
                <TextInput
                  placeholder={t('password')}
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  editable={isPhoneValid}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={!isPhoneValid}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color={isPhoneValid ? "#7B61FF" : "#9ca3af"} 
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <View 
                style={{ 
                  borderColor: getBorderColor('confirmPassword'), 
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  opacity: isPasswordValid ? 1 : 0.5,
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
                  editable={isPasswordValid}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={!isPasswordValid}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color={isPasswordValid ? "#7B61FF" : "#9ca3af"} 
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text className="text-red-500 text-xs mt-1 ml-2 font-medium">{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Register Button */}
            <Button 
              onPress={handleRegister}
              size="md"
              disabled={!isConfirmPasswordValid}
              className={`w-full shadow-lg mb-4 ${isConfirmPasswordValid ? 'opacity-100 shadow-purple-500/20' : 'opacity-50'}`}
            >
              {t('register').toUpperCase()}
            </Button>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mt-1">
              <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }} className="text-sm">
                {language === 'vi' ? 'Đã có tài khoản? ' : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={handleSignInPress}>
                <Text className="text-sm font-bold text-[#7B61FF] underline">
                  {language === 'vi' ? 'Đăng nhập ngay' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={email.trim()}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        otpLoading={otpLoading}
        otpError={otpError}
        otpResendLoading={otpResendLoading}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
      />
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
