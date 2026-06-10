import React from 'react';
import { View, Text, TextProps } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface GradientTextProps extends TextProps {
  children: string;
  colors?: [string, string, ...string[]];
  className?: string;
  style?: any;
}

export function GradientText({ 
  children, 
  colors = ['#C3B1FA', '#7B61FF'], // Light purple to dark purple
  className = '',
  style,
  ...props 
}: GradientTextProps) {
  const isCentered = className.includes('text-center');

  return (
    <View style={[{ flexDirection: 'row' }, isCentered ? { width: '100%', justifyContent: 'center' } : { flexShrink: 1 }, style]}>
      <MaskedView
        style={isCentered ? { flex: 1, flexDirection: 'row' } : { flexDirection: 'row' }}
        maskElement={
          <Text {...props} className={`${className} bg-transparent`} style={style}>
            {children}
          </Text>
        }
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={isCentered ? { flex: 1, flexDirection: 'row' } : { flexDirection: 'row' }}
        >
          <Text {...props} className={`${className} opacity-0`} style={style}>
            {children}
          </Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

interface GradientIconProps {
  name: any;
  size?: number;
  colors?: [string, string, ...string[]];
  style?: any;
}

export function GradientIcon({ 
  name, 
  size = 22, 
  colors = ['#C3B1FA', '#7B61FF'],
  style
}: GradientIconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <MaskedView
        style={{ flex: 1, flexDirection: 'row' }}
        maskElement={
          <Ionicons name={name} size={size} color="black" style={{ backgroundColor: 'transparent' }} />
        }
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        >
          <View style={{ opacity: 0 }}>
            <Ionicons name={name} size={size} color="black" />
          </View>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}
