import React, {useState} from 'react';
import {View, TextInput, StyleSheet, useColorScheme, ViewStyle} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onFocus,
  onBlur,
  style,
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: isFocused
      ? Colors.primary[600]
      : isDark
      ? Colors.neutral[700]
      : Colors.neutral[200],
  };

  const inputStyle = {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: isDark ? Colors.text.primary.dark : Colors.text.primary.light,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  };

  const iconColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  return (
    <View style={[containerStyle, style]}>
      <Ionicons name="search-outline" size={20} color={iconColor} />
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={isDark ? Colors.text.disabled.dark : Colors.text.disabled.light}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </View>
  );
}
