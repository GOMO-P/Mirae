import React from 'react';
import {TouchableOpacity, Text, StyleSheet, useColorScheme} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function CategoryChip({label, selected = false, onPress}: CategoryChipProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = selected
    ? Colors.primary[600]
    : isDark
    ? '#1E1E1E'
    : Colors.background.light;

  const textColor = selected
    ? '#FFFFFF'
    : isDark
    ? Colors.text.primary.dark
    : Colors.text.primary.light;

  const borderColor = selected ? Colors.primary[600] : isDark ? '#333333' : '#E0E0E0';

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.label, {color: textColor}]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
