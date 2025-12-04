import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, useColorScheme} from 'react-native';
import {Colors, Typography, Spacing} from '@/constants/design-tokens';

interface StatCounterProps {
  label: string;
  count: number;
  onPress?: () => void;
}

export default function StatCounter({label, count, onPress}: StatCounterProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.count, {color: textColor}]}>{count}</Text>
      <Text style={[styles.label, {color: secondaryTextColor}]}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  count: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
  },
});
