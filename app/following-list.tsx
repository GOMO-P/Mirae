import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import {Colors, Typography, Spacing} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import {userService, UserProfile} from '@/services/userService';

export default function FollowingListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {user} = useAuthContext();
  const params = useLocalSearchParams();
  const userId = (params.userId as string) || user?.uid;

  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    if (!userId) return;

    setLoading(true);
    const followingProfiles = await userService.getFollowing(userId);
    setFollowing(followingProfiles);

    // Load follow states for each user (they should all be true since we're following them)
    if (user?.uid) {
      const states: {[key: string]: boolean} = {};
      for (const profile of followingProfiles) {
        if (profile.uid !== user.uid) {
          states[profile.uid] = true; // We're already following them
        }
      }
      setFollowStates(states);
    }

    setLoading(false);
  };

  const handleUserPress = (uid: string) => {
    if (uid === user?.uid) {
      router.push('/profile-management');
    } else {
      router.push(`/user-profile?userId=${uid}`);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user?.uid) return;

    const isCurrentlyFollowing = followStates[targetUserId];

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(user.uid, targetUserId);
        setFollowStates(prev => ({...prev, [targetUserId]: false}));
        // Remove from list
        setFollowing(prev => prev.filter(u => u.uid !== targetUserId));
      } else {
        await userService.followUser(user.uid, targetUserId);
        setFollowStates(prev => ({...prev, [targetUserId]: true}));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  const renderFollowing = ({item}: {item: UserProfile}) => {
    const isFollowing = followStates[item.uid];
    const isOwnProfile = item.uid === user?.uid;

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={() => handleUserPress(item.uid)}>
          <Image
            source={
              item.photoURL ? {uri: item.photoURL} : require('@/assets/images/react-logo.png')
            }
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, {color: textColor}]}>{item.displayName || 'User'}</Text>
            <Text style={[styles.userTag, {color: secondaryTextColor}]}>
              @{item.email?.split('@')[0]}
            </Text>
          </View>
        </TouchableOpacity>
        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followButton,
              {borderColor: isFollowing ? '#EF4444' : Colors.primary[500]},
            ]}
            onPress={() => handleFollowToggle(item.uid)}>
            <Text
              style={[
                styles.followButtonText,
                {color: isFollowing ? '#EF4444' : Colors.primary[500]},
              ]}>
              {isFollowing ? '언팔로우' : '팔로우'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>팔로잉</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary[500]} style={{marginTop: 50}} />
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: secondaryTextColor}]}>팔로잉이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderFollowing}
          keyExtractor={item => item.uid}
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
    marginBottom: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#bfdbfe',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  userTag: {
    fontSize: Typography.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
