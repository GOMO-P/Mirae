import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import {userService, UserProfile} from '@/services/userService';

export default function FollowersListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {user} = useAuthContext();
  const {userId: targetUserId} = useLocalSearchParams<{userId?: string}>();

  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<{[key: string]: boolean}>({});

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const cardBackgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';

  useEffect(() => {
    loadFollowers();
  }, [targetUserId, user?.uid]);

  const loadFollowers = async () => {
    const userIdToLoad = targetUserId || user?.uid;
    if (!userIdToLoad) return;

    setLoading(true);
    try {
      const followersList = await userService.getFollowers(userIdToLoad);
      setFollowers(followersList);
      setLoading(false); // 먼저 목록 표시

      // 팔로우 상태는 백그라운드에서 확인
      if (user?.uid && followersList.length > 0) {
        const followingList = await userService.getFollowing(user.uid);
        const followingIds = new Set(followingList.map(u => u.uid));

        const states: {[key: string]: boolean} = {};
        followersList.forEach(follower => {
          states[follower.uid] = followingIds.has(follower.uid);
        });
        setFollowStates(states);
      }
    } catch (error) {
      console.error('팔로워 목록 로드 실패:', error);
      Alert.alert('오류', '팔로워 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user?.uid) return;

    try {
      const isCurrentlyFollowing = followStates[targetUserId] || false;

      if (isCurrentlyFollowing) {
        await userService.unfollowUser(user.uid, targetUserId);
        setFollowStates(prev => ({...prev, [targetUserId]: false}));
      } else {
        await userService.followUser(user.uid, targetUserId);
        setFollowStates(prev => ({...prev, [targetUserId]: true}));
      }
    } catch (error) {
      console.error('팔로우 처리 실패:', error);
      Alert.alert('오류', '팔로우 처리 중 오류가 발생했습니다.');
    }
  };

  const renderFollowerItem = ({item}: {item: UserProfile}) => {
    const isFollowing = followStates[item.uid] || false;

    return (
      <View style={[styles.followerItem, {backgroundColor: cardBackgroundColor}]}>
        <TouchableOpacity
          style={styles.followerInfo}
          onPress={() => router.push({pathname: '/user-profile', params: {userId: item.uid}})}>
          {item.photoURL ? (
            <Image source={{uri: item.photoURL}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(item.displayName || item.email || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.textInfo}>
            <Text style={[styles.name, {color: textColor}]} numberOfLines={1}>
              {item.displayName || item.email || '익명'}
            </Text>
            <Text style={[styles.email, {color: secondaryTextColor}]} numberOfLines={1}>
              @{item.email?.split('@')[0] || 'user'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.unfollowButton]}
          onPress={() => handleFollowToggle(item.uid)}>
          <Text
            style={[
              styles.followButtonText,
              {color: isFollowing ? Colors.error.main : Colors.primary[600]},
            ]}>
            {isFollowing ? '언팔로우' : '맞팔로우'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={secondaryTextColor} />
      <Text style={[styles.emptyText, {color: secondaryTextColor}]}>아직 팔로워가 없습니다</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>팔로워</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={item => item.uid}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    width: 40,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  followerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[700],
  },
  textInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs / 2,
  },
  email: {
    fontSize: Typography.fontSize.sm,
  },
  followButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    backgroundColor: 'transparent',
  },
  unfollowButton: {
    borderColor: Colors.error.main,
    backgroundColor: 'transparent',
  },
  followButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing['2xl'] * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    marginTop: Spacing.md,
  },
});
