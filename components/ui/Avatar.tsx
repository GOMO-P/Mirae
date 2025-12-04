import React from 'react';
import {View, Text, StyleSheet, Image, useColorScheme} from 'react-native';
import {Colors, Typography, BorderRadius} from '@/constants/design-tokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  imageUri?: string;
  name?: string;
  size?: AvatarSize;
}

export default function Avatar({imageUri, name, size = 'md'}: AvatarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const sizeStyles: Record<AvatarSize, {width: number; height: number; fontSize: number}> = {
    sm: {width: 32, height: 32, fontSize: Typography.fontSize.sm},
    md: {width: 48, height: 48, fontSize: Typography.fontSize.lg},
    lg: {width: 64, height: 64, fontSize: Typography.fontSize.xl},
    xl: {width: 96, height: 96, fontSize: Typography.fontSize['2xl']},
  };

  const currentSize = sizeStyles[size];

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const containerStyle = {
    width: currentSize.width,
    height: currentSize.height,
    borderRadius: currentSize.width / 2,
    backgroundColor: imageUri ? 'transparent' : Colors.primary[500],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  };

  const textStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  };

  return (
    <View style={containerStyle}>
      {imageUri ? (
        <Image source={{uri: imageUri}} style={{width: '100%', height: '100%'}} />
      ) : (
        <Text style={textStyle}>{getInitials(name)}</Text>
      )}
    </View>
  );
}
