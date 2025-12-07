import React, {useState, useLayoutEffect, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useNavigation, useLocalSearchParams} from 'expo-router';
import Button from '@/components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import MemberListItem from '@/components/ui/MemberListItem';
import Avatar from '@/components/ui/Avatar';
import {useGroupContext} from '@/contexts/GroupContext';
import {useAuthContext} from '@/contexts/AuthContext';
import {UserProfile} from '@/services/userService';

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
  const {groups, joinedGroupIds, getGroupMembers} = useGroupContext();
  const {user} = useAuthContext();

  // ✅ 그룹 데이터 찾기 (없으면 Fallback 데이터 사용 - 오류 방지)
  const groupData = useMemo(() => {
    const found = groups.find(g => g.id === id);
    if (found) return found;

    // Fallback 데이터에 ID만 현재 요청된 ID로 덮어씌워서 사용
    return {...FALLBACK_GROUP, id: id || 'fallback'};
  }, [id, groups]);

  // 이미 가입한 그룹인지 확인
  const isAlreadyJoined = joinedGroupIds.includes(groupData.id);

  const [isLiked, setIsLiked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [loadingApplicationStatus, setLoadingApplicationStatus] = useState(true);

  // 실제 멤버 정보 가져오기
  useEffect(() => {
    const fetchMembers = async () => {
      if (!id) return;

      setLoadingMembers(true);
      try {
        const memberProfiles = await getGroupMembers(id);
        setMembers(memberProfiles);
      } catch (error) {
        console.error('멤버 정보 로드 실패:', error);
        // Fallback 데이터 사용
        setMembers(FALLBACK_GROUP.members as any);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [id, getGroupMembers]);

  // 지원 상태 확인 (화면이 포커스될 때마다 체크)
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!id || !user) {
        setLoadingApplicationStatus(false);
        return;
      }

      setLoadingApplicationStatus(true);
      try {
        const {collection, query, where, getDocs} = await import('firebase/firestore');
        const {db} = await import('@/config/firebase');

        const q = query(
          collection(db, 'groupApplications'),
          where('groupId', '==', id),
          where('userId', '==', user.uid),
          where('status', '==', 'pending'),
        );

        const snapshot = await getDocs(q);
        setHasApplied(!snapshot.empty);
      } catch (error) {
        console.error('지원 상태 확인 실패:', error);
        setHasApplied(false);
      } finally {
        setLoadingApplicationStatus(false);
      }
    };

    checkApplicationStatus();

    // 화면이 포커스될 때마다 다시 체크
    const unsubscribe = navigation.addListener('focus', () => {
      checkApplicationStatus();
    });

    return unsubscribe;
  }, [id, user, navigation]);

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
    if (hasApplied) {
      Alert.alert('알림', '이미 지원한 그룹입니다. 승인을 기다려주세요.');
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

  const renderMemberItem = ({item, index}: {item: UserProfile; index: number}) => {
    // 첫 번째 멤버(생성자)를 방장으로 표시
    const role = index === 0 ? '방장' : '팀원';
    // 자신인지 확인
    const isCurrentUser = user?.uid === item.uid;

    return (
      <MemberListItem
        member={{
          id: item.uid,
          name: item.displayName || (item as any).name || item.email || '익명',
          role: role as '방장' | '팀원',
          imageUrl: item.photoURL,
        }}
        onFollowRequest={() => handleFollowRequest(item.uid)}
        isDark={isDark}
        showFollowButton={!isCurrentUser}
      />
    );
  };

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
        {loadingMembers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary[600]} />
            <Text style={[styles.loadingText, {color: secondaryTextColor}]}>
              멤버 정보를 불러오는 중...
            </Text>
          </View>
        ) : members.length > 0 ? (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.uid}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{height: Spacing.xs / 2}} />}
          />
        ) : (
          <View style={styles.emptyMembersContainer}>
            <Text style={[styles.emptyMembersText, {color: secondaryTextColor}]}>
              아직 참여한 멤버가 없습니다
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Group Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.groupName, {color: textColor}]}>{groupData.name}</Text>
          <Text style={[styles.groupStatus, {color: Colors.primary[600]}]}>
            모집중 ({members.length}/{groupData.maxMembers})
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
          title={
            isAlreadyJoined
              ? '이미 가입한 그룹입니다'
              : hasApplied
              ? '지원한 그룹입니다'
              : '그룹 참여하기'
          }
          onPress={handleJoinGroup}
          loading={isJoining || loadingApplicationStatus}
          disabled={isAlreadyJoined || hasApplied}
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  emptyMembersContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: Typography.fontSize.base,
  },
});
