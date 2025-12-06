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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useGroupContext} from '@/contexts/GroupContext';
import {useAuthContext} from '@/contexts/AuthContext';
import {UserProfile} from '@/services/userService';
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
} from 'firebase/firestore';
import {db} from '@/config/firebase';

const BLUE = '#4A90E2';
const BG = '#000000';
const WHITE = '#FFFFFF';
const LIGHT_BLUE_BG = '#E3F2FD';
const LIGHT_BG = '#F5F7FA';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#E5E5EA';
const TEXT_DARK = '#1C1C1E';

export default function GroupSettingsScreen() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const {groups, getGroupMembers} = useGroupContext();
  const {user} = useAuthContext();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [updating, setUpdating] = useState(false);

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
      } catch (error) {
        console.error('멤버 정보 로드 실패:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [id, getGroupMembers]);

  useEffect(() => {
    if (currentGroup) {
      setNewGroupName(currentGroup.name);
    }
  }, [currentGroup]);

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
      Alert.alert(
        '그룹 탈퇴 불가',
        '그룹 생성자는 탈퇴할 수 없습니다. 그룹을 삭제하시겠습니까?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '삭제',
            style: 'destructive',
            onPress: handleDeleteGroup,
          },
        ],
      );
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

    Alert.alert(
      '그룹 삭제',
      '정말 이 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
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
      ],
    );
  };

  const renderMemberItem = (item: UserProfile, index: number) => {
    const role = index === 0 ? '방장' : '팀원';
    const isCurrentUser = user?.uid === item.uid;
    const displayName = item.displayName || (item as any).name || item.email || '익명';

    return (
      <View key={item.uid} style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{displayName}</Text>
          <Text style={styles.memberRole}>{role}</Text>
        </View>
        {!isCurrentUser && (
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>팔로우</Text>
          </TouchableOpacity>
        )}
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

        {/* 멤버 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>멤버 ({members.length}명)</Text>
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
        </View>

        {/* 그룹 탈퇴 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Text style={styles.leaveButtonText}>
              {isCreator ? '그룹 삭제' : '그룹 탈퇴'}
            </Text>
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
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
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
});
