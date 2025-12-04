import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/constants/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
      },
      md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
      },
      lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? Colors.neutral[300] : Colors.primary[600],
        ...Shadows.sm,
      },
      secondary: {
        backgroundColor: disabled ? Colors.neutral[200] : Colors.secondary[600],
        ...Shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: disabled ? Colors.neutral[300] : Colors.primary[600],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && {width: '100%'}),
      ...(disabled && {opacity: 0.6}),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      sm: {
        fontSize: Typography.fontSize.sm,
      },
      md: {
        fontSize: Typography.fontSize.base,
      },
      lg: {
        fontSize: Typography.fontSize.lg,
      },
    };

    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: disabled ? Colors.neutral[400] : Colors.primary[600],
      },
      ghost: {
        color: disabled ? Colors.text.disabled[isDark ? 'dark' : 'light'] : Colors.primary[600],
      },
    };

    return {
      fontWeight: Typography.fontWeight.semibold,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : Colors.primary[600]}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
