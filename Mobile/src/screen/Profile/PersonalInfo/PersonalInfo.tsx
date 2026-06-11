import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contextAPI/Auth/AuthContext';
import { useAppNavigation } from '../../../navigation/navigation';
import { toast } from '../../../components/Toast/Toast';
import { validateName, validateEmail, validatePhone, validateDateOfBirth, validateCccd } from '../../../validation/validation';
import Button from '../../../components/Button/Button';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../contextAPI/Theme/ThemeContext';
import { useLanguage } from '../../../contextAPI/Language/LanguageContext';

export default function PersonalInfo() {
  const navigation = useAppNavigation();
  const { user, updateUser, updateAvatar } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);

  const [fullname, setFullname] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác' | null>(user?.gender || null);
  const [dob, setDob] = useState(user?.dob || '');
  const [address, setAddress] = useState(user?.address || '');
  const [cccd, setCccd] = useState(user?.cccd || '');

  const [fullnameError, setFullnameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [cccdError, setCccdError] = useState<string | null>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [age, setAge] = useState<string | number>('');

  // Calculate age from date of birth string (DD/MM/YYYY)
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const parts = dobString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const birthDate = new Date(year, month, day);
        const today = new Date();
        
        if (birthDate.toString() === 'Invalid Date' || year < 1900 || birthDate > today) {
          return '';
        }

        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        return calculatedAge >= 0 ? calculatedAge : '';
      }
    }
    return '';
  };

  useEffect(() => {
    const calculated = calculateAge(dob);
    setAge(calculated);
  }, [dob]);

  const handleFullnameChange = (text: string) => {
    setFullname(text);
    if (!text) {
      setFullnameError(language === 'vi' ? 'Họ và tên là bắt buộc' : 'Full name is required');
    } else {
      setFullnameError(validateName(text));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (!text) {
      setEmailError(language === 'vi' ? 'Email là bắt buộc' : 'Email is required');
    } else {
      setEmailError(validateEmail(text));
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (!text) {
      setPhoneError(language === 'vi' ? 'Số điện thoại là bắt buộc' : 'Phone number is required');
    } else {
      setPhoneError(validatePhone(text));
    }
  };

  const handleDobChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
    if (!formatted) {
      setDobError(null);
    } else {
      setDobError(validateDateOfBirth(formatted));
    }
  };

  const handleCccdChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCccd(cleaned);
    if (!cleaned) {
      setCccdError(null);
    } else {
      setCccdError(validateCccd(cleaned));
    }
  };

  const handleUploadAvatar = async () => {
    if (!isEditing) return; // Only allow editing avatar in edit mode
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

  const handleSave = async () => {
    const nameErr = validateName(fullname);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const dobErr = validateDateOfBirth(dob);
    const cccdErr = validateCccd(cccd);

    setFullnameError(nameErr);
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    setDobError(dobErr);
    setCccdError(cccdErr);

    if (nameErr || emailErr || phoneErr || dobErr || cccdErr) {
      toast.error(language === 'vi' ? 'Vui lòng kiểm tra lại thông tin!' : 'Please check your information again!');
      return;
    }

    try {
      await updateUser({
        fullName: fullname.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        gender,
        dob,
        address: address.trim(),
        cccd: cccd.trim(),
      });
      toast.success(t('profile_updated_success'));
      setIsEditing(false);
    } catch (error) {
      toast.error(t('failed_to_update_profile'));
    }
  };

  const handleCancel = () => {
    // Reset inputs
    setFullname(user?.fullName || '');
    setEmail(user?.email || '');
    setPhone(user?.phoneNumber || '');
    setGender(user?.gender || null);
    setDob(user?.dob || '');
    setAddress(user?.address || '');
    setCccd(user?.cccd || '');
    // Clear errors
    setFullnameError(null);
    setEmailError(null);
    setPhoneError(null);
    setDobError(null);
    setCccdError(null);
    setIsEditing(false);
  };

  const getBorderColor = (fieldName: string) => {
    if (fieldName === 'fullname' && fullnameError) return '#EF4444';
    if (fieldName === 'email' && emailError) return '#EF4444';
    if (fieldName === 'phone' && phoneError) return '#EF4444';
    if (fieldName === 'dob' && dobError) return '#EF4444';
    if (fieldName === 'cccd' && cccdError) return '#EF4444';
    return focusedField === fieldName ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF');
  };

  // Helper to render read-only profile item cards
  const renderInfoCard = (icon: any, label: string, value: string | null | undefined, placeholder: string) => {
    const hasValue = !!value && value.toString().trim() !== '';
    return (
      <View 
        style={{ 
          backgroundColor: isDark ? '#1D183B' : '#FFFFFF', 
          borderColor: isDark ? '#2E2856' : '#F3F4F6',
          borderWidth: 1
        }}
        className="flex-row items-center rounded-[20px] px-5 py-4 mb-3.5 shadow-sm"
      >
        <View 
          style={{ backgroundColor: isDark ? '#2E2856' : 'rgba(123, 97, 255, 0.1)' }}
          className="w-10 h-10 rounded-full justify-center items-center mr-4"
        >
          <Ionicons name={icon} size={18} color="#7B61FF" />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-extrabold text-[#7B61FF] uppercase tracking-widest mb-1">{label}</Text>
          <Text 
            style={{ color: hasValue ? (isDark ? '#F3F4F6' : '#374151') : '#9CA3AF' }}
            className={`text-[15px] font-semibold ${!hasValue && 'italic'}`}
          >
            {hasValue ? value : placeholder}
          </Text>
        </View>
      </View>
    );
  };

  const getTranslatedGender = (g: string | null | undefined) => {
    if (!g) return null;
    if (g === 'Nam') return t('gender_male');
    if (g === 'Nữ') return t('gender_female');
    return language === 'vi' ? 'Khác' : 'Other';
  };

  return (
    <SafeAreaView 
      edges={['top']} 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#FAF8FF' }}
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
          className="flex-row items-center justify-between px-4 py-3.5"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F3F4F6" : "#1f2937"} />
          </TouchableOpacity>
          <Text 
            style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
            className="text-lg font-bold"
          >
            {t('profile')}
          </Text>
          
          {isEditing ? (
            <TouchableOpacity onPress={handleCancel} className="p-1">
              <Text className="text-[15px] font-bold text-gray-400">{t('cancel_btn')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} className="p-1.5">
              <Ionicons name="pencil" size={20} color="#7B61FF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 15 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View className="items-center mb-6">
            <View className="relative">
              <View 
                style={{ borderColor: '#7B61FF', backgroundColor: isDark ? '#1D183B' : '#FFFFFF' }}
                className="w-28 h-28 rounded-full border-[3px] justify-center items-center overflow-hidden shadow-md"
              >
                <Image 
                  source={
                    user?.avatar 
                      ? { uri: user.avatar } 
                      : require('../../../../assets/images/mievoh/avatar.jpg')
                  } 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              {isEditing && (
                <TouchableOpacity 
                  onPress={handleUploadAvatar}
                  style={{ borderColor: isDark ? '#1D183B' : '#FFFFFF' }}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#7B61FF] border-2 justify-center items-center shadow-lg"
                >
                  <Ionicons name="camera" size={17} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <Text 
              style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
              className="text-xl font-extrabold mt-4"
            >
              {user?.fullName || user?.email}
            </Text>
          </View>

          {/* Conditional View: Read-only vs Editing */}
          {!isEditing ? (
            <View>
              {renderInfoCard('person-outline', t('full_name').toUpperCase(), user?.fullName, language === 'vi' ? 'Chưa đặt họ và tên' : 'Full name not set')}
              {renderInfoCard('mail-outline', t('email_address').toUpperCase(), user?.email, language === 'vi' ? 'Chưa đăng ký email' : 'Email not registered')}
              {renderInfoCard('call-outline', t('phone_number').toUpperCase(), user?.phoneNumber, language === 'vi' ? 'Chưa đăng ký số điện thoại' : 'Phone not registered')}
              {renderInfoCard('male-female-outline', t('gender').toUpperCase(), getTranslatedGender(user?.gender), language === 'vi' ? 'Chưa chọn giới tính' : 'Gender not selected')}
              {renderInfoCard('time-outline', t('age').toUpperCase(), age ? (language === 'vi' ? `${age} tuổi` : `${age} years old`) : null, language === 'vi' ? 'Chưa cung cấp tuổi' : 'Age not provided')}
              {renderInfoCard('calendar-outline', t('date_of_birth').toUpperCase(), user?.dob, language === 'vi' ? 'Chưa đặt ngày sinh' : 'Date of birth not set')}
              {renderInfoCard('location-outline', t('address').toUpperCase(), user?.address, language === 'vi' ? 'Chưa đặt địa chỉ' : 'Address not set')}
              {renderInfoCard('card-outline', t('cccd').toUpperCase(), user?.cccd, language === 'vi' ? 'Chưa cập nhật' : 'Not updated')}
            </View>
          ) : (
            <View className="gap-4">
              {/* Fullname */}
              <View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-1.5 ml-1"
                >
                  {t('full_name')}
                </Text>
                <View 
                  style={{ 
                    borderColor: getBorderColor('fullname'),
                    backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-3"
                >
                  <Ionicons name="person-outline" size={18} color={focusedField === 'fullname' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                  <TextInput
                    placeholder={language === 'vi' ? 'Nhập họ và tên' : 'Enter full name'}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={fullname}
                    onChangeText={handleFullnameChange}
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="flex-1 text-sm"
                  />
                </View>
                {fullnameError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{fullnameError}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-1.5 ml-1"
                >
                  {t('email_address')}
                </Text>
                <View 
                  style={{ 
                    borderColor: getBorderColor('email'),
                    backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-3"
                >
                  <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                  <TextInput
                    placeholder={language === 'vi' ? 'Nhập email' : 'Enter email'}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="flex-1 text-sm"
                  />
                </View>
                {emailError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{emailError}</Text>
                ) : null}
              </View>

              {/* Phone number */}
              <View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-1.5 ml-1"
                >
                  {t('phone_number')}
                </Text>
                <View 
                  style={{ 
                    borderColor: getBorderColor('phone'),
                    backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-3"
                >
                  <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                  <TextInput
                    placeholder={language === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="phone-pad"
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="flex-1 text-sm"
                  />
                </View>
                {phoneError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{phoneError}</Text>
                ) : null}
              </View>

              {/* Gender Selection */}
              <View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-2 ml-1"
                >
                  {t('gender')}
                </Text>
                <View className="flex-row gap-2">
                  {(['Nam', 'Nữ', 'Khác'] as const).map((item) => {
                    const translatedItem = item === 'Nam' ? t('gender_male') : item === 'Nữ' ? t('gender_female') : (language === 'vi' ? 'Khác' : 'Other');
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setGender(item)}
                        style={{
                          backgroundColor: gender === item 
                            ? '#7B61FF' 
                            : (isDark ? '#1D183B' : '#FAF8FF'),
                          borderColor: gender === item 
                            ? '#7B61FF' 
                            : (isDark ? '#2E2856' : '#E9D5FF')
                        }}
                        className="flex-1 py-3 rounded-2xl border items-center justify-center"
                      >
                        <Text 
                          style={{
                            color: gender === item 
                              ? '#FFFFFF' 
                              : (isDark ? '#9CA3AF' : '#4B5563')
                          }}
                          className="text-sm font-bold"
                        >
                          {translatedItem}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date of Birth and Age side-by-side */}
              <View className="flex-row gap-3">
                {/* DOB Input */}
                <View className="flex-1">
                  <Text 
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    className="text-xs font-semibold mb-1.5 ml-1"
                  >
                    {language === 'vi' ? 'Ngày sinh (DD/MM/YYYY)' : 'Date of Birth (DD/MM/YYYY)'}
                  </Text>
                  <View 
                    style={{ 
                      borderColor: getBorderColor('dob'),
                      backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                    }}
                    className="flex-row items-center border rounded-2xl px-4 py-3"
                  >
                    <Ionicons name="calendar-outline" size={18} color={focusedField === 'dob' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                    <TextInput
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={dob}
                      onChangeText={handleDobChange}
                      onFocus={() => setFocusedField('dob')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                      className="flex-1 text-sm"
                    />
                  </View>
                  {dobError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-2">{dobError}</Text>
                  ) : null}
                </View>

                {/* Calculated Age (Read-only) */}
                <View style={{ width: 80 }}>
                  <Text 
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    className="text-xs font-semibold mb-1.5 ml-1"
                  >
                    {t('age')}
                  </Text>
                  <View 
                    style={{ 
                      backgroundColor: isDark ? '#1D183B' : '#F3F4F6', 
                      borderColor: isDark ? '#2E2856' : '#E5E7EB',
                      borderWidth: 1
                    }}
                    className="flex-row items-center rounded-2xl px-4 py-3.5 justify-center"
                  >
                    <Text 
                      style={{ color: isDark ? '#F3F4F6' : '#6B7280' }}
                      className="text-sm font-bold"
                    >
                      {age || '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Address */}
              <View>
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-1.5 ml-1"
                >
                  {t('address')}
                </Text>
                <View 
                  style={{ 
                    borderColor: focusedField === 'address' ? '#7B61FF' : (isDark ? '#2E2856' : '#E9D5FF'),
                    backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-3"
                >
                  <Ionicons name="location-outline" size={18} color={focusedField === 'address' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                  <TextInput
                    placeholder={language === 'vi' ? 'Nhập địa chỉ của bạn' : 'Enter your address'}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={address}
                    onChangeText={setAddress}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="flex-1 text-sm"
                  />
                </View>
              </View>

              {/* CCCD (Citizen Identity Card) */}
              <View className="mb-6">
                <Text 
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  className="text-xs font-semibold mb-1.5 ml-1"
                >
                  {language === 'vi' ? 'Số CCCD' : 'National ID Number'}
                </Text>
                <View 
                  style={{ 
                    borderColor: getBorderColor('cccd'),
                    backgroundColor: isDark ? '#1D183B' : '#FAF8FF'
                  }}
                  className="flex-row items-center border rounded-2xl px-4 py-3"
                >
                  <Ionicons name="card-outline" size={18} color={focusedField === 'cccd' ? '#7B61FF' : '#9ca3af'} className="mr-3" />
                  <TextInput
                    placeholder={language === 'vi' ? 'Nhập 12 số CCCD' : 'Enter 12-digit National ID'}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={cccd}
                    onChangeText={handleCccdChange}
                    onFocus={() => setFocusedField('cccd')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="number-pad"
                    maxLength={12}
                    style={{ color: isDark ? '#F3F4F6' : '#1F2937' }}
                    className="flex-1 text-sm"
                  />
                </View>
                {cccdError ? (
                  <Text className="text-red-500 text-xs mt-1 ml-2">{cccdError}</Text>
                ) : null}
              </View>

              {/* Save Button */}
              <Button 
                onPress={handleSave}
                className="w-full shadow-lg shadow-purple-500/10 mb-4"
              >
                {t('save_changes_btn').toUpperCase()}
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
