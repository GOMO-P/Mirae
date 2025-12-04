import React from 'react';
import {View, StyleSheet, ViewStyle, useColorScheme} from 'react-native';
import {Colors, BorderRadius, Spacing, Shadows} from '@/constants/design-tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export default function Card({children, style, variant = 'elevated'}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    };

    const variantStyles: Record<string, ViewStyle> = {
      elevated: {
        backgroundColor: isDark ? Colors.background.paper.dark : Colors.background.paper.light,
        ...Shadows.md,
      },
      outlined: {
        backgroundColor: isDark ? Colors.background.paper.dark : Colors.background.paper.light,
        borderWidth: 1,
        borderColor: isDark ? Colors.neutral[700] : Colors.neutral[300],
      },
      filled: {
        backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100],
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
