import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, useColorScheme} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import Avatar from '@/components/ui/Avatar'; // 기존 Avatar 컴포넌트 재사용

interface Member {
  id: string;
  name: string;
  role: '방장' | '팀원';
  imageUrl?: string;
}

interface MemberListItemProps {
  member: Member;
  onFollowRequest: () => void;
  isDark: boolean;
}

export default function MemberListItem({member, onFollowRequest, isDark}: MemberListItemProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const cardBg = isDark ? Colors.background.paper.dark : Colors.background.paper.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  const handleFollow = () => {
    onFollowRequest();
    setIsFollowing(true); // 요청 완료 후 상태 변경 (API 호출 대신 시뮬레이션)
  };

  return (
    <View style={[styles.card, {backgroundColor: cardBg}]}>
      <Avatar name={member.name} size="md" imageUri={member.imageUrl} />

      <View style={styles.infoContainer}>
        <Text style={[styles.name, {color: textColor}]} numberOfLines={1}>
          {member.name}
        </Text>
        <Text style={[styles.role, {color: secondaryTextColor}]} numberOfLines={1}>
          {member.role}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.followButton}
        onPress={handleFollow}
        disabled={isFollowing}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.followButtonText,
            {
              color: isFollowing ? secondaryTextColor : Colors.primary[600],
            },
          ]}>
          {isFollowing ? '요청됨' : '팔로우 요청'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    // 스크린샷과 같이 부드러운 배경 카드 형태
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  role: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs / 2,
  },
  followButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    backgroundColor: 'transparent',
  },
  followButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
