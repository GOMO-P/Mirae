import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {useGroupContext} from '@/contexts/GroupContext';
import {useAuthContext} from '@/contexts/AuthContext';
import {UserProfile, userService} from '@/services/userService';
import {
  doc,
  updateDoc,
  arrayRemove,
  increment,
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';
import {db} from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';

interface Application {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  major: string;
  intro: string;
  availableDays: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const BLUE = '#4A90E2';
const BG = '#000000';
const WHITE = '#FFFFFF';
const LIGHT_BLUE_BG = '#E3F2FD';
const LIGHT_BG = '#F5F7FA';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#E5E5EA';
const TEXT_DARK = '#1C1C1E';

const DAYS_MAP: {[key: string]: string} = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

export default function GroupSettingsScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const {groups, getGroupMembers} = useGroupContext();
  const {user} = useAuthContext();

  const [activeTab, setActiveTab] = useState<'members' | 'applications'>('members');
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupImage, setNewGroupImage] = useState<string>('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [followStates, setFollowStates] = useState<{[key: string]: boolean}>({});

  const currentGroup = groups.find(g => g.id === id);
  const isCreator = currentGroup?.createdBy === user?.uid;

  // 멤버 정보 가져오기
  useEffect(() => {
    const fetchMembers = async () => {
      if (!id) return;

      setLoadingMembers(true);
      try {
        const memberProfiles = await getGroupMembers(id);
        setMembers(memberProfiles);

        // 팔로우 상태 확인
        if (user?.uid) {
          const states: {[key: string]: boolean} = {};
          for (const member of memberProfiles) {
            if (member.uid !== user.uid) {
              states[member.uid] = await userService.isFollowing(user.uid, member.uid);
            }
          }
          setFollowStates(states);
        }
      } catch (error) {
        console.error('멤버 정보 로드 실패:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [id, getGroupMembers, user?.uid]);

  // 지원서 실시간 구독
  useEffect(() => {
    if (!id) {
      setLoadingApplications(false);
      return;
    }

    const q = query(
      collection(db, 'groupApplications'),
      where('groupId', '==', id),
      where('status', '==', 'pending'),
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const apps: Application[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Application[];
        setApplications(apps);
        setLoadingApplications(false);
      },
      error => {
        console.error('지원서 로드 실패:', error);
        setLoadingApplications(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (currentGroup) {
      setNewGroupName(currentGroup.name);
      setNewGroupImage(currentGroup.imageUrl || '');
    }
  }, [currentGroup]);

  const handlePickImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewGroupImage(result.assets[0].uri);
      setIsEditingImage(true);
    }
  };

  const handleUpdateGroupImage = async () => {
    if (!id) {
      Alert.alert('오류', '그룹 정보를 찾을 수 없습니다.');
      return;
    }

    if (!isCreator) {
      Alert.alert('권한 없음', '그룹 생성자만 이미지를 변경할 수 있습니다.');
      return;
    }

    setUpdating(true);
    try {
      const groupRef = doc(db, 'groups', id);
      await updateDoc(groupRef, {
        imageUrl: newGroupImage,
      });

      Alert.alert('성공', '그룹 이미지가 변경되었습니다.');
      setIsEditingImage(false);
    } catch (error) {
      console.error('그룹 이미지 변경 실패:', error);
      Alert.alert('오류', '그룹 이미지 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!id || !newGroupName.trim()) {
      Alert.alert('오류', '그룹 이름을 입력해주세요.');
      return;
    }

    if (!isCreator) {
      Alert.alert('권한 없음', '그룹 생성자만 이름을 변경할 수 있습니다.');
      return;
    }

    setUpdating(true);
    try {
      const groupRef = doc(db, 'groups', id);
      await updateDoc(groupRef, {
        name: newGroupName.trim(),
      });

      Alert.alert('성공', '그룹 이름이 변경되었습니다.');
      setIsEditingName(false);
    } catch (error) {
      console.error('그룹 이름 변경 실패:', error);
      Alert.alert('오류', '그룹 이름 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveGroup = () => {
    if (!user || !id) return;

    if (isCreator) {
      Alert.alert('그룹 탈퇴 불가', '그룹 생성자는 탈퇴할 수 없습니다. 그룹을 삭제하시겠습니까?', [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: handleDeleteGroup,
        },
      ]);
      return;
    }

    Alert.alert('그룹 탈퇴', '정말 이 그룹에서 탈퇴하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: async () => {
          try {
            const groupRef = doc(db, 'groups', id);
            await updateDoc(groupRef, {
              members: arrayRemove(user.uid),
              currentMembers: increment(-1),
            });

            Alert.alert('탈퇴 완료', '그룹에서 탈퇴했습니다.');
            router.replace('/(tabs)/group');
          } catch (error) {
            console.error('그룹 탈퇴 실패:', error);
            Alert.alert('오류', '그룹 탈퇴에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    Alert.alert('그룹 삭제', '정말 이 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. 그룹 문서 삭제
            const groupRef = doc(db, 'groups', id);
            await deleteDoc(groupRef);

            // 2. 그룹 채팅 메시지 삭제 (선택사항)
            // 메시지가 많을 경우 시간이 걸릴 수 있으므로 백그라운드에서 처리
            const messagesQuery = query(
              collection(db, 'groupMessages'),
              where('groupId', '==', id),
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            Alert.alert('삭제 완료', '그룹이 삭제되었습니다.');
            router.replace('/(tabs)/group');
          } catch (error) {
            console.error('그룹 삭제 실패:', error);
            Alert.alert('오류', '그룹 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleApproveApplication = async (application: Application) => {
    if (!id) return;

    try {
      // 1. 그룹에 멤버 추가
      const groupRef = doc(db, 'groups', id);
      await updateDoc(groupRef, {
        members: arrayUnion(application.userId),
        currentMembers: increment(1),
      });

      // 2. 지원서 상태 업데이트
      const appRef = doc(db, 'groupApplications', application.id);
      await updateDoc(appRef, {
        status: 'approved',
      });

      Alert.alert('승인 완료', `${application.name}님의 가입을 승인했습니다.`);
    } catch (error) {
      console.error('승인 실패:', error);
      Alert.alert('오류', '승인에 실패했습니다.');
    }
  };

  const handleRejectApplication = async (application: Application) => {
    if (!id) return;

    Alert.alert('지원 거절', `${application.name}님의 지원을 거절하시겠습니까?`, [
      {text: '취소', style: 'cancel'},
      {
        text: '거절',
        style: 'destructive',
        onPress: async () => {
          try {
            const appRef = doc(db, 'groupApplications', application.id);
            await updateDoc(appRef, {
              status: 'rejected',
            });
            Alert.alert('거절 완료', '지원을 거절했습니다.');
          } catch (error) {
            console.error('거절 실패:', error);
            Alert.alert('오류', '거절에 실패했습니다.');
          }
        },
      },
    ]);
  };

  // 팔로우/언팔로우 핸들러
  const handleFollowToggle = async (targetUid: string) => {
    if (!user?.uid) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.');
      return;
    }

    const isCurrentlyFollowing = followStates[targetUid];

    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(user.uid, targetUid);
      } else {
        await userService.followUser(user.uid, targetUid);
      }

      // 상태 업데이트
      setFollowStates(prev => ({
        ...prev,
        [targetUid]: !isCurrentlyFollowing,
      }));
    } catch (error) {
      console.error('팔로우 토글 실패:', error);
      Alert.alert('오류', '팔로우 처리에 실패했습니다.');
    }
  };

  const renderMemberItem = (item: UserProfile, index: number) => {
    const role = index === 0 ? '방장' : '팀원';
    const isCurrentUser = user?.uid === item.uid;
    const displayName = item.displayName || (item as any).name || item.email || '익명';
    const isFollowing = followStates[item.uid];

    return (
      <View key={item.uid} style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{displayName}</Text>
          <Text style={styles.memberRole}>{role}</Text>
        </View>
        {!isCurrentUser && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.unfollowButton]}
            onPress={() => handleFollowToggle(item.uid)}>
            <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
              {isFollowing ? '언팔로우' : '팔로우'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderApplicationItem = (application: Application) => {
    const daysText = application.availableDays.map(d => DAYS_MAP[d] || d).join(', ');

    return (
      <View key={application.id} style={styles.applicationItem}>
        <View style={styles.applicationContent}>
          <Text style={styles.applicationText}>
            <Text style={styles.applicationLabel}>이름: </Text>
            <Text style={styles.applicationValue}>{application.name}</Text>
            <Text style={styles.applicationLabel}> / 학과: </Text>
            <Text style={styles.applicationValue}>{application.major}</Text>
            <Text style={styles.applicationLabel}> / 참여 요일: </Text>
            <Text style={styles.applicationValue}>{daysText}</Text>
          </Text>
          <Text style={styles.applicationIntro} numberOfLines={3}>
            <Text style={styles.applicationLabel}>소개: </Text>
            {application.intro}
          </Text>
        </View>
        <View style={styles.applicationButtons}>
          <TouchableOpacity
            style={[styles.applicationButton, styles.rejectButton]}
            onPress={() => handleRejectApplication(application)}>
            <Text style={styles.rejectButtonText}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applicationButton, styles.approveButton]}
            onPress={() => handleApproveApplication(application)}>
            <Text style={styles.approveButtonText}>승인</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{headerShown: false}} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>그룹 설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 그룹 이미지 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>그룹 이미지</Text>
            {isCreator && (
              <TouchableOpacity onPress={handlePickImage}>
                <Text style={styles.editButton}>변경</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.imageContainer}
            onPress={isCreator ? handlePickImage : undefined}
            disabled={!isCreator}>
            {newGroupImage ? (
              <Image source={{uri: newGroupImage}} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color={GRAY} />
                <Text style={styles.imagePlaceholderText}>이미지 없음</Text>
              </View>
            )}
          </TouchableOpacity>

          {isEditingImage && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditingImage(false);
                  setNewGroupImage(currentGroup?.imageUrl || '');
                }}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.saveButton]}
                onPress={handleUpdateGroupImage}
                disabled={updating}>
                {updating ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Text style={styles.saveButtonText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 그룹 이름 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>그룹 이름</Text>
            {isCreator && !isEditingName && (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={styles.editButton}>수정</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="그룹 이름"
                placeholderTextColor={GRAY}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.smallButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditingName(false);
                    setNewGroupName(currentGroup?.name || '');
                  }}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.saveButton]}
                  onPress={handleUpdateGroupName}
                  disabled={updating}>
                  {updating ? (
                    <ActivityIndicator size="small" color={WHITE} />
                  ) : (
                    <Text style={styles.saveButtonText}>저장</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.groupNameText}>{currentGroup?.name}</Text>
          )}
        </View>

        {/* 탭 */}
        <View style={styles.section}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'members' && styles.activeTab]}
              onPress={() => setActiveTab('members')}>
              <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
                멤버 목록 ({members.length})
              </Text>
            </TouchableOpacity>
            {isCreator && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'applications' && styles.activeTab]}
                onPress={() => setActiveTab('applications')}>
                <Text
                  style={[styles.tabText, activeTab === 'applications' && styles.activeTabText]}>
                  지원서 목록 ({applications.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 멤버 목록 탭 */}
          {activeTab === 'members' && (
            <>
              {loadingMembers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={BLUE} />
                  <Text style={styles.loadingText}>멤버 정보를 불러오는 중...</Text>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {members.map((member, index) => renderMemberItem(member, index))}
                </View>
              )}
            </>
          )}

          {/* 지원서 목록 탭 (생성자만) */}
          {activeTab === 'applications' && isCreator && (
            <>
              {loadingApplications ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={BLUE} />
                  <Text style={styles.loadingText}>지원서를 불러오는 중...</Text>
                </View>
              ) : applications.length === 0 ? (
                <Text style={styles.emptyText}>대기 중인 지원서가 없습니다</Text>
              ) : (
                <View style={styles.applicationList}>
                  {applications.map(app => renderApplicationItem(app))}
                </View>
              )}
            </>
          )}
        </View>

        {/* 그룹 탈퇴 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Text style={styles.leaveButtonText}>{isCreator ? '그룹 삭제' : '그룹 탈퇴'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BLUE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: LIGHT_BLUE_BG,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 28,
    color: BG,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BG,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '500',
    color: BLUE,
  },
  groupNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: BG,
  },
  editContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: LIGHT_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: LIGHT_GRAY,
  },
  cancelButtonText: {
    color: TEXT_DARK,
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: BLUE,
  },
  saveButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  memberList: {
    marginTop: 4,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: BG,
  },
  memberRole: {
    fontSize: 13,
    color: GRAY,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BLUE,
    backgroundColor: WHITE,
  },
  unfollowButton: {
    borderColor: '#EF4444',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
  },
  unfollowButtonText: {
    color: '#EF4444',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: GRAY,
  },
  leaveButton: {
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: LIGHT_GRAY,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
    marginBottom: -2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: GRAY,
  },
  activeTabText: {
    color: BLUE,
    fontWeight: '600',
  },
  applicationList: {
    marginTop: 8,
  },
  applicationItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  applicationContent: {
    marginBottom: 12,
  },
  applicationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  applicationLabel: {
    fontWeight: '600',
    color: TEXT_DARK,
  },
  applicationValue: {
    color: TEXT_DARK,
  },
  applicationIntro: {
    fontSize: 13,
    color: GRAY,
    lineHeight: 18,
  },
  applicationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  applicationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: LIGHT_GRAY,
  },
  rejectButtonText: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: BLUE,
  },
  approveButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: GRAY,
    fontSize: 14,
    paddingVertical: 20,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: GRAY,
  },
});
