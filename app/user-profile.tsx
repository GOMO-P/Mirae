import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import {userService, UserProfile} from '@/services/userService';
import {db} from '@/config/firebase';
import {collection, query, where, getDocs, addDoc, serverTimestamp} from 'firebase/firestore';

export default function UserProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {user: currentUser} = useAuthContext();
  const {userId} = useLocalSearchParams<{userId: string}>();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [processingFollow, setProcessingFollow] = useState(false);

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId || !currentUser?.uid) return;

    setLoading(true);
    try {
      const profile = await userService.getUserProfile(userId);
      if (profile) {
        setUserProfile(profile);
        setFollowersCount(profile.followersCount || 0);
        setFollowingCount(profile.followingCount || 0);
      }

      const following = await userService.isFollowing(currentUser.uid, userId);
      setIsFollowing(following);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      Alert.alert('오류', '프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.uid || !userId) return;

    setProcessingFollow(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(currentUser.uid, userId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await userService.followUser(currentUser.uid, userId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('팔로우 처리 실패:', error);
      Alert.alert('오류', '팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingFollow(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser?.uid || !userId || !userProfile) return;

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const querySnapshot = await getDocs(q);

      let existingChatId: string | null = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants?.includes(userId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        const roomName = userProfile.displayName || userProfile.email || '익명';
        router.push({pathname: '/chat/[id]', params: {id: existingChatId, name: roomName}});
      } else {
        const roomName = userProfile.displayName || userProfile.email || '익명';
        const initialUnreadCounts = {
          [currentUser.uid]: 0,
          [userId]: 0,
        };

        const docRef = await addDoc(collection(db, 'chats'), {
          name: roomName,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          participants: [currentUser.uid, userId],
          lastMessage: '대화를 시작해보세요!',
          lastMessageAt: serverTimestamp(),
          unreadCounts: initialUnreadCounts,
          avatarBgColor: '#EAF2FF',
        });

        router.push({pathname: '/chat/[id]', params: {id: docRef.id, name: roomName}});
      }
    } catch (error) {
      console.error('채팅 시작 실패:', error);
      Alert.alert('오류', '채팅을 시작할 수 없습니다.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor}]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>프로필</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: secondaryTextColor}]}>
            프로필을 찾을 수 없습니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const userName = userProfile.displayName || userProfile.email || '익명';
  const userTag = userProfile.email?.split('@')[0] || 'user';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>프로필</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {userProfile.photoURL ? (
              <Image source={{uri: userProfile.photoURL}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{userName[0].toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.textInfoContainer}>
            <View style={styles.nameRow}>
              <View style={styles.textInfo}>
                <Text style={[styles.userName, {color: textColor}]}>닉네임 : {userName}</Text>
                <Text style={[styles.userTag, {color: secondaryTextColor}]}>Tag : @{userTag}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButtonSmall,
                  isFollowing && styles.unfollowButtonSmall,
                  processingFollow && styles.disabledButton,
                ]}
                onPress={handleFollowToggle}
                disabled={processingFollow}>
                <Text
                  style={[
                    styles.followButtonTextSmall,
                    {color: isFollowing ? Colors.error.main : Colors.primary[600]},
                  ]}>
                  {processingFollow ? '처리 중...' : isFollowing ? '언팔로우' : '맞팔로우'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
              <Ionicons name="chatbubble-outline" size={18} color="white" />
              <Text style={styles.chatButtonText}>채팅하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, {color: textColor}]}>팔로워</Text>
            <Text style={[styles.statValue, {color: secondaryTextColor}]}>{followersCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, {color: textColor}]}>팔로잉</Text>
            <Text style={[styles.statValue, {color: secondaryTextColor}]}>{followingCount}</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={[styles.bioLabel, {color: secondaryTextColor}]}>자기소개</Text>
          <View style={[styles.bioBox, {borderColor}]}>
            <Text style={[styles.bioText, {color: textColor}]}>
              {userProfile.bio || '자기소개가 없습니다.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
    width: 40,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[700],
  },
  textInfoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  textInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  userTag: {
    fontSize: Typography.fontSize.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
  },
  bioContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  bioLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  bioBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 100,
  },
  bioText: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * 1.5,
  },
  followButtonSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  unfollowButtonSmall: {
    borderColor: Colors.error.main,
  },
  disabledButton: {
    opacity: 0.5,
  },
  followButtonTextSmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[600],
    marginTop: Spacing.sm,
  },
  chatButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: 'white',
  },
});
