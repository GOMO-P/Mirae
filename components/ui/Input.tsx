import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

export type InputType = 'text' | 'email' | 'password' | 'number';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: InputType;
  error?: string;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  type = 'text',
  error,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const getSecureTextEntry = () => {
    return type === 'password' && !showPassword;
  };

  const handleRightIconPress = () => {
    if (type === 'password') {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = (): keyof typeof Ionicons.glyphMap | undefined => {
    if (type === 'password') {
      return showPassword ? 'eye-off-outline' : 'eye-outline';
    }
    return rightIcon;
  };

  const containerStyle: ViewStyle = {
    borderWidth: 1.5,
    borderColor: error
      ? Colors.error.main
      : isFocused
      ? Colors.primary[600]
      : isDark
      ? Colors.neutral[700]
      : Colors.neutral[300],
    borderRadius: BorderRadius.lg,
    backgroundColor: isDark ? Colors.background.paper.dark : Colors.background.paper.light,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: isDark ? Colors.text.primary.dark : Colors.text.primary.light,
    paddingVertical: Spacing.sm,
  };

  const labelStyle: TextStyle = {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: isDark ? Colors.text.primary.dark : Colors.text.primary.light,
    marginBottom: Spacing.xs,
  };

  const errorStyle: TextStyle = {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.main,
    marginTop: Spacing.xs,
  };

  const iconColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  return (
    <View style={style}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View style={containerStyle}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={iconColor} style={{marginRight: Spacing.sm}} />
        )}

        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={isDark ? Colors.text.disabled.dark : Colors.text.disabled.light}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={type !== 'email'}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {(getRightIcon() || type === 'password') && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            disabled={!onRightIconPress && type !== 'password'}
            style={{marginLeft: Spacing.sm}}>
            <Ionicons name={getRightIcon() || 'eye-outline'} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
}
