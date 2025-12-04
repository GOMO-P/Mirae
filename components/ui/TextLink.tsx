import React from 'react';
import {Text, TouchableOpacity, StyleSheet, useColorScheme, TextStyle} from 'react-native';
import {Link} from 'expo-router';
import {Colors, Typography} from '@/constants/design-tokens';

interface TextLinkProps {
  href: string;
  children: string;
  style?: TextStyle;
  variant?: 'primary' | 'secondary' | 'muted';
  underline?: boolean;
}

export default function TextLink({
  href,
  children,
  style,
  variant = 'primary',
  underline = false,
}: TextLinkProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getTextStyle = (): TextStyle => {
    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: Colors.primary[600],
      },
      secondary: {
        color: Colors.secondary[600],
      },
      muted: {
        color: isDark ? Colors.text.secondary.dark : Colors.text.secondary.light,
      },
    };

    return {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      ...variantStyles[variant],
      ...(underline && {textDecorationLine: 'underline'}),
    };
  };

  return (
    <Link href={href} asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={[getTextStyle(), style]}>{children}</Text>
      </TouchableOpacity>
    </Link>
  );
}
