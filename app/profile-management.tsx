import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import {userService} from '@/services/userService';

export default function ProfileManagementScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {user} = useAuthContext();

  const [bio, setBio] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadUserProfile();
    }
  }, [user?.uid]);

  const loadUserProfile = async () => {
    if (!user?.uid) return;
    const profile = await userService.getUserProfile(user.uid);
    if (profile) {
      setBio(profile.bio || '');
      setFollowersCount(profile.followersCount || 0);
      setFollowingCount(profile.followingCount || 0);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      await userService.updateUserProfile(user.uid, {
        bio,
        email: user.email || '',
        displayName: user.displayName || '',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const cardBackgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  const userName = user?.displayName || 'User';
  const userTag = user?.email?.split('@')[0] || 'user';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>프로필 관리</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? 'close' : 'pencil'} size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/react-logo.png')} // Fallback or user image
              style={styles.avatar}
            />
          </View>
          <View style={styles.textInfo}>
            <Text style={[styles.userName, {color: textColor}]}>닉네임 : {userName}</Text>
            <Text style={[styles.userTag, {color: secondaryTextColor}]}>Tag : @{userTag}</Text>
          </View>
        </View>

        {/* Stats */}
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

        {/* Bio */}
        <View style={styles.bioContainer}>
          <Text style={[styles.bioLabel, {color: secondaryTextColor}]}>자기소개</Text>
          <View
            style={[
              styles.bioInputContainer,
              {
                borderColor,
                backgroundColor: isEditing ? (isDark ? '#333' : '#f9f9f9') : 'transparent',
              },
            ]}>
            <TextInput
              style={[styles.bioInput, {color: textColor}]}
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
              placeholder={isEditing ? '자기소개를 입력하세요' : '자기소개가 없습니다.'}
              placeholderTextColor={secondaryTextColor}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, {opacity: loading ? 0.7 : 1}]}
              onPress={handleSave}
              disabled={loading}>
              <Text style={styles.saveButtonText}>{loading ? '저장 중...' : '저장하기'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    marginBottom: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  avatarContainer: {
    // width: 80,
    // height: 80,
    // borderRadius: 40,
    // overflow: 'hidden',
    // backgroundColor: '#E1E1E1',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#bfdbfe', // Light blue placeholder
  },
  textInfo: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: Typography.fontSize.lg,
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
  },
  bioLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  bioInputContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 300, // Fixed height as per design appearance
  },
  bioInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
  },
  saveButtonContainer: {
    padding: Spacing.xl,
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});
