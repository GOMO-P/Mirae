import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

interface GroupItemProps {
  id: string;
  name: string;
  description: string;
  currentMembers: number;
  maxMembers: number;
  imageUrl?: string;
}

interface GroupListItemProps {
  group: GroupItemProps;
  onPress: () => void;
  isDark: boolean;
}

export default function GroupListItem({group, onPress, isDark}: GroupListItemProps) {
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  // ✅ 수정: 이미지와 비슷하게 아주 연한 파란색 배경과 은은한 아이콘 색상 사용
  const thumbnailBackgroundColor = isDark ? '#1E1E1E' : '#E3F2FD'; // Colors.primary[50] 느낌
  const thumbnailIconColor = isDark ? '#555' : '#BBDEFB'; // Colors.primary[100]~[200] 느낌의 연한 색상

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Thumbnail */}
      <View
        style={[
          styles.thumbnail,
          {
            backgroundColor: thumbnailBackgroundColor,
          },
        ]}>
        {group.imageUrl ? (
          <Image source={{uri: group.imageUrl}} style={styles.thumbnailImage} />
        ) : (
          <Ionicons name="image-outline" size={28} color={thumbnailIconColor} />
        )}
      </View>

      {/* Group Info & Member Count Layout */}
      <View style={styles.contentContainer}>
        {/* Top: Title & Description */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: textColor}]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.description, {color: secondaryTextColor}]} numberOfLines={1}>
            {group.description}
          </Text>
        </View>

        {/* Bottom: Member Count (Right aligned) */}
        <View style={styles.memberCountContainer}>
          <Text style={[styles.memberCount, {color: textColor}]}>
            {/* ✅ 수정: 색상을 textColor(진한색)로 변경 */}
            {group.currentMembers} / {group.maxMembers}명
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    // marginBottom 삭제 (Separator 사용)
  },
  thumbnail: {
    width: 80, // ✅ 수정: 썸네일 크기 약간 키움 (이미지 비율 고려)
    height: 80,
    borderRadius: BorderRadius.lg, // 둥근 모서리 강조
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between', // 위아래로 내용 분산
    paddingVertical: 4, // 썸네일 높이 안에서 약간의 패딩
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: 'bold', // ✅ 수정: 제목 볼드 처리
    marginBottom: 4,
  },
  description: {
    fontSize: 13, // ✅ 수정: 설명 텍스트 크기 미세 조정
  },
  memberCountContainer: {
    alignItems: 'flex-end', // 오른쪽 정렬
  },
  memberCount: {
    fontSize: 14,
    fontWeight: 'bold', // ✅ 수정: 멤버 수 볼드 처리
  },
});
