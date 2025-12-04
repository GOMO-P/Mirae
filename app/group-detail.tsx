import React, {useState, useLayoutEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  Alert,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useNavigation, useLocalSearchParams} from 'expo-router';
import Button from '@/components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import MemberListItem from '@/components/ui/MemberListItem';
import Avatar from '@/components/ui/Avatar';
import {useGroupContext} from '@/contexts/GroupContext';

// 📌 Fallback용 Mock Data (데이터를 못 찾았을 때 보여줄 기본값)
const FALLBACK_GROUP = {
  id: 'fallback',
  name: '코딩테스트 그룹 스터디 (예시)',
  imageUrl:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  status: '모집중',
  description:
    '그룹 정보를 불러오지 못해 예시 데이터를 표시합니다.\n언어는 상관없이 코딩테스트 준비하시는 분 모집합니다!',
  currentMembers: 5,
  maxMembers: 50,
  members: [
    {id: 'm1', name: '최용주', role: '방장' as const},
    {id: 'm2', name: '서정원', role: '팀원' as const},
    {id: 'm3', name: '이정모', role: '팀원' as const},
    {id: 'm4', name: '권성호', role: '팀원' as const},
    {id: 'm5', name: '김철수', role: '팀원' as const},
  ],
};

export default function GroupDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // URL 파라미터에서 id 받기
  const {id} = useLocalSearchParams<{id: string}>();
  const {groups, joinedGroupIds} = useGroupContext();

  // ✅ 그룹 데이터 찾기 (없으면 Fallback 데이터 사용 - 오류 방지)
  const groupData = useMemo(() => {
    const found = groups.find(g => g.id === id);
    if (found) return found;

    // Fallback 데이터에 ID만 현재 요청된 ID로 덮어씌워서 사용
    return {...FALLBACK_GROUP, id: id || 'fallback'};
  }, [id, groups]);

  // Fallback을 사용하는 경우 멤버 리스트가 없으므로 가짜 멤버 추가
  const members = (groupData as any).members || FALLBACK_GROUP.members;

  // 이미 가입한 그룹인지 확인
  const isAlreadyJoined = joinedGroupIds.includes(groupData.id);

  const [isLiked, setIsLiked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const backgroundColor = isDark ? Colors.background.dark : '#E3F2FD';
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleJoinGroup = () => {
    if (isAlreadyJoined) {
      Alert.alert('알림', '이미 가입한 그룹입니다.');
      return;
    }
    // 지원서 화면으로 이동
    router.push({
      pathname: '/group-application',
      params: {id: groupData.id},
    });
  };

  const handleFollowRequest = (memberId: string) => {
    console.log(`멤버 ${memberId}에게 팔로우 요청`);
  };

  const renderMemberItem = ({item}: {item: any}) => (
    <MemberListItem
      member={item}
      onFollowRequest={() => handleFollowRequest(item.id)}
      isDark={isDark}
    />
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={30} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.iconButton}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? Colors.error.main : textColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar name={groupData.name} imageUri={groupData.imageUrl} size="xl" />
        </View>

        {/* Member List Section */}
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{height: Spacing.xs / 2}} />}
        />

        <View style={styles.divider} />

        {/* Group Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.groupName, {color: textColor}]}>{groupData.name}</Text>
          <Text style={[styles.groupStatus, {color: Colors.primary[600]}]}>
            모집중 ({groupData.currentMembers}/{groupData.maxMembers})
          </Text>
          <Text
            style={[
              styles.groupDescription,
              {
                color: secondaryTextColor,
                lineHeight: Typography.fontSize.base * 1.5,
              },
            ]}>
            {groupData.description}
          </Text>
        </View>

        <View style={{height: 80}} />
      </ScrollView>

      {/* Footer Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor,
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.sm : Spacing.lg,
          },
        ]}>
        <Button
          title={isAlreadyJoined ? '이미 가입한 그룹입니다' : '그룹 참여하기'}
          onPress={handleJoinGroup}
          loading={isJoining}
          disabled={isAlreadyJoined}
          fullWidth
          size="md"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[300],
    marginVertical: Spacing.xl,
    opacity: 0.5,
  },
  infoSection: {},
  groupName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  groupStatus: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  groupDescription: {
    fontSize: Typography.fontSize.base,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
