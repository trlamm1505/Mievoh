import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';

interface SearchProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  onFocus?: () => void;
}

export default function Search({
  value = '',
  onChangeText,
  placeholder = 'Tìm rạp hoặc địa chỉ...',
  onSubmit,
  onClear,
  onFocus,
}: SearchProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View 
      style={{ backgroundColor: isDark ? '#0F0C20' : '#FFFFFF' }}
      className="px-4 py-2"
    >
      {/* Search Input Container */}
      <View 
        style={{
          backgroundColor: isDark ? '#1D183B' : '#F9FAFB',
          borderColor: isDark ? '#2E2856' : '#F3F4F6',
          borderWidth: 1,
        }}
        className="flex-row items-center rounded-2xl px-4 py-2.5 shadow-sm"
      >
        {/* Search Icon */}
        <Ionicons name="search-outline" size={20} color="#9ca3af" />

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9CA3AF' : '#9ca3af'}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          onFocus={onFocus}
          className="flex-1 ml-2.5 text-[14px] p-0"
          style={{ 
            includeFontPadding: false, 
            textAlignVertical: 'center',
            color: isDark ? '#F3F4F6' : '#1F2937'
          }}
          underlineColorAndroid="transparent"
          autoCorrect={false}
          spellCheck={false}
        />

        {/* Clear Button (only show when value is not empty) */}
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="p-1">
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
