import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contextAPI/Auth/AuthContext';
import { useAppNavigation } from '../../navigation/navigation';
import { GradientText } from '../../components/GradientComponents/GradientComponents';
import { toast } from '../../components/Toast/Toast';
import { loginApi, redirectToGoogleApi, AuthResponse } from '../../axios/auth';
import Button from '../../components/Button/Button';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../contextAPI/Language/LanguageContext';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../../config/constant/constant';

export default function Login() {
  const navigation = useAppNavigation();
  const { login } = useAuth();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUserFocused, setIsUserFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);
  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);
  const [isProcessingGoogle, setIsProcessingGoogle] = useState(false);

  const webViewRef = useRef<WebView>(null);

  const processGoogleLogin = (url: string) => {
    if (isProcessingGoogle) return;
    setIsProcessingGoogle(true);

    const getQueryParam = (urlStr: string, paramName: string) => {
      const rx = new RegExp("[?&]" + paramName + "=([^&#]*)", "i");
      const m = urlStr.match(rx);
      return m ? m[1] : null;
    };

    const token = getQueryParam(url, 'token');
    const usernameParam = getQueryParam(url, 'username');
    const fullName = getQueryParam(url, 'fullName');
    const email = getQueryParam(url, 'email');
    const avatar = getQueryParam(url, 'avatar');

    if (token && usernameParam) {
      const authData: AuthResponse = {
        token: {
          accessToken: token,
          refreshToken: token
        },
        user: {
          username: usernameParam,
          fullName: fullName ? decodeURIComponent(fullName) : null,
          email: email || null,
          phoneNumber: null,
          avatar: avatar || null,
          userType: 'user',
          gender: null,
          dob: null,
          address: null,
          cccd: null
        }
      };

      setIsGoogleModalVisible(false);

      login(authData).then(() => {
        toast.success(language === 'vi' ? 'Đăng nhập bằng Google thành công!' : 'Google login successful!');
        navigation.goToHome();
      }).catch(err => {
        console.error("Google login context error:", err);
        toast.error(language === 'vi' ? 'Không thể hoàn tất đăng nhập bằng Google.' : 'Failed to complete Google login.');
        setIsProcessingGoogle(false);
      });
    } else {
      setIsProcessingGoogle(false);
    }
  };

  const handleNavigationStateChange = (webViewState: any) => {
    const url = webViewState.url;
    if (url.includes('/login?token=')) {
      webViewRef.current?.stopLoading();
      processGoogleLogin(url);
    }
  };

  const handleShouldStartLoad = (request: any) => {
    if (request.url.includes('/login?token=')) {
      webViewRef.current?.stopLoading();
      processGoogleLogin(request.url);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const token = params.token as string;
    const userParam = params.username as string;
    const fullName = params.fullName as string;
    const email = params.email as string;
    const avatar = params.avatar as string;

    if (token && userParam) {
      const authData: AuthResponse = {
        token: {
          accessToken: token,
          refreshToken: token
        },
        user: {
          username: userParam,
          fullName: fullName || null,
          email: email || null,
          phoneNumber: null,
          avatar: avatar || null,
          userType: 'user',
          gender: null,
          dob: null,
          address: null,
          cccd: null
        }
      };

      login(authData).then(() => {
        toast.success(language === 'vi' ? 'Đăng nhập bằng Google thành công!' : 'Google login successful!');
        navigation.goToHome();
      }).catch(err => {
        console.error("Google login context error:", err);
        toast.error(language === 'vi' ? 'Không thể hoàn tất đăng nhập bằng Google.' : 'Failed to complete Google login.');
      });
    }
  }, [params.token, params.username]);

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password) {
        toast.error(language === 'vi' ? 'Vui lòng nhập tên đăng nhập và mật khẩu!' : 'Please enter username and password!');
        return;
      }
      const res = await loginApi({ username: username.trim(), password });
      await login(res);
      toast.success(language === 'vi' ? 'Đăng nhập thành công!' : 'Login successful!');
      navigation.goToHome();
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      const errorMsg = Array.isArray(serverMessage) 
        ? serverMessage.join('\n') 
        : serverMessage || (language === 'vi' ? 'Đăng nhập thất bại. Vui lòng thử lại!' : 'Login failed. Please try again!');
      toast.error(errorMsg);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleModalVisible(true);
  };

  const handleSignUpPress = () => {
    navigation.goToRegister();
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
            <View className="items-center mb-3 mt-4">
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

            {/* Heading */}
            <GradientText 
              colors={['#A38FFF', '#7B61FF']} 
              className="text-2xl font-extrabold text-center mb-3 tracking-wide"
            >
              {language === 'vi' ? 'Đăng Nhập' : 'Login'}
            </GradientText>

            {/* Inputs */}
            {/* Username Input */}
            <View className="mb-3">
              <View 
                style={{
                  borderColor: isUserFocused ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF'),
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  borderWidth: 1
                }}
                className="flex-row items-center rounded-2xl px-4 py-2.5"
              >
                <Ionicons name="person-outline" size={20} color={isUserFocused ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                <TextInput
                  placeholder={t('username')}
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsUserFocused(true)}
                  onBlur={() => setIsUserFocused(false)}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <View 
                style={{
                  borderColor: isPassFocused ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF'),
                  backgroundColor: isDark ? '#0F0C20' : '#FAF8FF',
                  borderWidth: 1
                }}
                className="flex-row items-center rounded-2xl px-4 py-2.5"
              >
                <Ionicons name="lock-closed-outline" size={20} color={isPassFocused ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                <TextInput
                  placeholder={t('password')}
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                  style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                  className="flex-1 text-sm"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#7B61FF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              onPress={() => navigation.goToForgotPassword()} 
              className="align-self-end mb-4 py-1"
            >
              <Text className="text-xs font-bold text-[#7B61FF] text-right underline">
                {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button 
              onPress={handleLogin}
              size="md"
              className="w-full mb-4"
            >
              {t('login').toUpperCase()}
            </Button>

            {/* Divider */}
            <View className="flex-row items-center justify-center mb-4">
              <View style={{ backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }} className="flex-1 h-[1px]" />
              <View 
                style={{ backgroundColor: isDark ? '#1D183B' : '#F3E8FF', borderColor: isDark ? '#2E2856' : '#E9D5FF' }}
                className="px-3 py-0.5 rounded-md mx-3 border"
              >
                <Text className="text-[10px] font-bold text-[#7B61FF] uppercase tracking-wider">
                  {language === 'vi' ? 'HOẶC' : 'OR'}
                </Text>
              </View>
              <View style={{ backgroundColor: isDark ? '#2E2856' : '#F3E8FF' }} className="flex-1 h-[1px]" />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity 
              onPress={handleGoogleLogin}
              style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF', borderColor: isDark ? '#2E2856' : '#F3E8FF', borderWidth: 1 }}
              className="w-full flex-row items-center justify-center py-3 rounded-2xl shadow-sm mb-4"
            >
              <Image 
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
                style={{ width: 18, height: 18 }} 
                className="mr-3"
                resizeMode="contain"
              />
              <Text style={{ color: isDark ? '#F3F4F6' : '#374151' }} className="text-sm font-bold">
                {language === 'vi' ? 'Đăng nhập với Google' : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center items-center mt-1">
              <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }} className="text-sm">
                {language === 'vi' ? 'Chưa có tài khoản? ' : 'New to Mievoh? '}
              </Text>
              <TouchableOpacity onPress={handleSignUpPress}>
                <Text className="text-sm font-bold text-[#7B61FF] underline">
                  {language === 'vi' ? 'Đăng ký ngay' : 'Sign up now'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Login WebView Modal */}
      <Modal
        visible={isGoogleModalVisible}
        animationType="slide"
        onRequestClose={() => setIsGoogleModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}>
          {/* Header */}
          <View 
            style={{ 
              height: Platform.OS === 'ios' ? 90 : 60, 
              paddingTop: Platform.OS === 'ios' ? 40 : 10,
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderColor: isDark ? '#2E2856' : '#E5E7EB',
              backgroundColor: isDark ? '#1D183B' : '#FFFFFF',
              paddingHorizontal: 16
            }}
          >
            <TouchableOpacity onPress={() => setIsGoogleModalVisible(false)}>
              <Ionicons name="close" size={24} color={isDark ? '#F3F4F6' : '#1F2937'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#F3F4F6' : '#1F2937' }}>
              Google Login
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* WebView */}
          <WebView
            ref={webViewRef}
            source={{ uri: `${API_BASE_URL}/auth/google` }}
            userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
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
