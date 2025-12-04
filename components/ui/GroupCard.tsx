import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
  category?: string;
  onPress?: () => void;
}

export default function GroupCard({
  name,
  description,
  imageUrl,
  memberCount,
  category,
  onPress,
}: GroupCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: cardBg}]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, {backgroundColor: Colors.primary[100]}]}>
            <Text style={styles.placeholderText}>그룹</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, {color: textColor}]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.description, {color: secondaryTextColor}]} numberOfLines={2}>
          {description}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          {category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
          <Text style={[styles.memberCount, {color: secondaryTextColor}]}>
            {memberCount}명 참여
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[700],
    fontWeight: Typography.fontWeight.medium,
  },
  memberCount: {
    fontSize: Typography.fontSize.xs,
  },
});
