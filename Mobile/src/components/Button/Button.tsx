import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contextAPI/Theme/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  className = '',
  textClassName = '',
  disabled,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Sizing definitions
  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 24 },
    md: { paddingVertical: 14, paddingHorizontal: 40 },
    lg: { paddingVertical: 18, paddingHorizontal: 48 },
  };

  const sizeText = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Content for primary button with LinearGradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        className={`rounded-2xl overflow-hidden shadow-md shadow-purple-500/25 ${disabled ? 'opacity-50' : ''} ${className}`}
        {...props}
      >
        <LinearGradient
          colors={['#A38FFF', '#7B61FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }, sizeStyles[size]]}
        >
          {typeof children === 'string' ? (
            <Text numberOfLines={1} className={`text-white font-bold ${sizeText[size]} ${textClassName}`}>
              {children}
            </Text>
          ) : (
            children
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Other variants (secondary, outline, danger)
  let variantStyles = 'bg-transparent';
  let textStyles = 'text-gray-800';

  if (variant === 'secondary') {
    variantStyles = isDark ? 'bg-[#2E2856]' : 'bg-[#F3E8FF]';
    textStyles = isDark ? 'text-[#9F8CFF]' : 'text-[#7B61FF]';
  } else if (variant === 'outline') {
    variantStyles = `bg-transparent border ${isDark ? 'border-[#2E2856]' : 'border-gray-200'}`;
    textStyles = isDark ? 'text-gray-300' : 'text-gray-700';
  } else if (variant === 'danger') {
    variantStyles = isDark ? 'bg-red-950/20 border border-red-900/30' : 'bg-red-50 border border-red-100';
    textStyles = 'text-red-500';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`rounded-2xl items-center justify-center ${variantStyles} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={[sizeStyles[size]]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text numberOfLines={1} className={`font-bold ${sizeText[size]} ${textStyles} ${textClassName}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
