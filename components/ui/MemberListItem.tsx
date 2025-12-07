import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
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
  showFollowButton?: boolean; // 팔로우 버튼 표시 여부
  isFollowing?: boolean; // 팔로우 상태
  isLoading?: boolean; // 로딩 상태
}

export default function MemberListItem({
  member,
  onFollowRequest,
  isDark,
  showFollowButton = true,
  isFollowing = false,
  isLoading = false,
}: MemberListItemProps) {
  const cardBg = isDark ? Colors.background.paper.dark : Colors.background.paper.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

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

      {showFollowButton && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.unfollowButton,
            isLoading && styles.loadingButton,
          ]}
          onPress={onFollowRequest}
          disabled={isLoading}
          activeOpacity={0.7}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary[600]} />
          ) : (
            <Text
              style={[
                styles.followButtonText,
                {
                  color: isFollowing ? Colors.error.main : Colors.primary[600],
                },
              ]}>
              {isFollowing ? '언팔로우' : '팔로우'}
            </Text>
          )}
        </TouchableOpacity>
      )}
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
    minWidth: 80,
    alignItems: 'center',
  },
  unfollowButton: {
    borderColor: Colors.error.main,
  },
  loadingButton: {
    opacity: 0.7,
  },
  followButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
