import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useAuthContext} from '@/contexts/AuthContext';

// 🔥 Firebase 관련
import {db} from '@/config/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  increment,
  deleteField, // 🔥 [추가] 필드 삭제용
} from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: Timestamp | null;
}

interface UserInfo {
  uid: string;
  name: string;
  email: string;
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const {id, name} = useLocalSearchParams();
  const {user} = useAuthContext();

  const roomId = Array.isArray(id) ? id[0] : id;
  const initialName = Array.isArray(name) ? name[0] : name;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  // 방 정보 및 설정 상태
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [participants, setParticipants] = useState<UserInfo[]>([]);

  // 🔥 [추가] 채팅방 이름 관리 상태
  const [currentRoomName, setCurrentRoomName] = useState(initialName || '채팅방');
  const [editableName, setEditableName] = useState(initialName || '');

  // 초대 관련 상태
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);

  const flatListRef = useRef<FlatList>(null);

  // 🔥 [추가] 현재 방의 방장 ID를 저장할 state
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null);

  // 1. 메시지 데이터 구독
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetchedMessages: Message[] = snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Message),
      );

      setMessages(fetchedMessages);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 2. 방 정보 구독
  // 2. 방 정보 구독
  // 2. 방 정보 구독 (수정됨: 실시간 읽음 처리 로직 추가)
  useEffect(() => {
    if (!roomId || !user) return;

    const roomRef = doc(db, 'chats', roomId);
    const unsubscribe = onSnapshot(roomRef, async docSnap => {
      if (docSnap.exists()) {
        const roomData = docSnap.data();

        // [수정 1] 방장 ID 가져오기
        if (roomData.createdBy) {
          setRoomOwnerId(roomData.createdBy);
        }

        // [수정 2] 방 이름 동기화
        if (roomData.name) {
          setCurrentRoomName(roomData.name);
        }

        // 🔥 [핵심 수정] 실시간 읽음 처리 로직
        // 내가 현재 이 화면(채팅방)을 보고 있는데 내 안읽음 카운트가 0보다 크다면,
        // (상대방이 방금 메시지를 보낸 상황) 즉시 0으로 초기화 요청을 보냅니다.
        const myUnreadCount = roomData.unreadCounts?.[user.uid] || 0;

        if (myUnreadCount > 0) {
          try {
            await updateDoc(roomRef, {
              [`unreadCounts.${user.uid}`]: 0,
            });
          } catch (e) {
            console.error('읽음 처리 실패:', e);
          }
        }

        // ---------------------------------------------------------
        // 아래는 기존 로직 유지 (강퇴 감지, 알림 설정, 참여자 정보 로딩)
        // ---------------------------------------------------------

        const currentParticipants = roomData.participants || [];

        // 강퇴 감지: 내 ID가 참여자 목록에서 사라졌는지 확인
        if (!currentParticipants.includes(user.uid)) {
          setSettingsVisible(false); // 설정 모달 닫기

          if (Platform.OS === 'web') {
            window.alert('방장에 의해 내보내졌습니다.');
            router.replace('/(tabs)/chat');
          } else {
            Alert.alert('알림', '방장에 의해 내보내졌습니다.', [
              {
                text: '확인',
                onPress: () => {
                  if (router.canGoBack()) router.back();
                  else router.replace('/(tabs)/chat');
                },
              },
            ]);
          }
          return;
        }

        // 알림 설정 동기화
        const mutedList = roomData.mutedBy || [];
        setIsNotificationEnabled(!mutedList.includes(user.uid));

        // 참여자 정보 상세 로딩
        if (currentParticipants.length > 0) {
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('uid', 'in', currentParticipants));
            const querySnapshot = await getDocs(q);
            const users: UserInfo[] = [];
            querySnapshot.forEach(doc => users.push(doc.data() as UserInfo));
            setParticipants(users);
          } catch (error) {
            console.error('참여자 정보 불러오기 실패:', error);
          }
        } else {
          setParticipants([]);
        }
      } else {
        // 방이 삭제된 경우
        if (Platform.OS === 'web') {
          window.alert('채팅방이 종료되었습니다.');
          router.replace('/(tabs)/chat');
        } else {
          Alert.alert('알림', '채팅방이 종료되었습니다.', [
            {text: '확인', onPress: () => router.back()},
          ]);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, user]);

  // 3. 전체 유저 목록 불러오기 (초대용)
  const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: UserInfo[] = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data() as UserInfo;
        if (!participants.some(p => p.uid === userData.uid)) {
          users.push(userData);
        }
      });
      setAllUsers(users);
    } catch (e) {
      console.error('유저 목록 로딩 실패:', e);
    }
  };

  useEffect(() => {
    if (inviteModalVisible) fetchAllUsers();
  }, [inviteModalVisible]);

  // 4. 유저 초대 함수
  const handleInviteUser = async (targetUser: UserInfo) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'chats', roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(targetUser.uid),
        [`unreadCounts.${targetUser.uid}`]: 0,
      });
      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        text: `${targetUser.name}님이 초대되었습니다.`,
        sender: 'system',
        createdAt: serverTimestamp(),
      });
      Alert.alert('성공', `${targetUser.name}님을 초대했습니다.`);
      setInviteModalVisible(false);
    } catch (e) {
      console.error('초대 실패:', e);
      Alert.alert('오류', '초대에 실패했습니다.');
    }
  };

  // 5. 알림 토글
  const toggleNotification = async (value: boolean) => {
    if (!roomId || !user) return;
    setIsNotificationEnabled(value);
    try {
      const roomRef = doc(db, 'chats', roomId);
      if (value) {
        await updateDoc(roomRef, {mutedBy: arrayRemove(user.uid)});
      } else {
        await updateDoc(roomRef, {mutedBy: arrayUnion(user.uid)});
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      setIsNotificationEnabled(!value);
    }
  };

  // 6. 🔥 [추가] 채팅방 이름 변경 함수
  const notify = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n${message ?? ''}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleUpdateRoomName = async () => {
    // 🔥 [추가] 방장이 아니면 권한 없음 알림
    if (roomOwnerId && user?.uid !== roomOwnerId) {
      Alert.alert('권한 없음', '채팅방 이름은 방장만 변경할 수 있습니다.');
      return;
    }

    if (!roomId || !editableName.trim()) {
      notify('알림', '방 이름을 입력해주세요.');
      return;
    }

    try {
      const roomRef = doc(db, 'chats', roomId);
      await updateDoc(roomRef, {
        name: editableName.trim(),
      });

      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        text: `채팅방 이름이 "${editableName.trim()}"(으)로 변경되었습니다.`,
        sender: 'system',
        createdAt: serverTimestamp(),
      });

      notify('성공', '채팅방 이름이 변경되었습니다.');
    } catch (e) {
      console.error('이름 변경 실패:', e);
      notify('오류', '이름 변경에 실패했습니다.');
    }
  };

  // 7. 메시지 전송
  const sendMessage = async () => {
    if (!text.trim() || !roomId || !user) return;
    const messageToSend = text;
    setText('');

    try {
      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        text: messageToSend,
        sender: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      });

      const roomRef = doc(db, 'chats', roomId);
      const roomSnap = await getDoc(roomRef);

      const updateData: any = {
        lastMessage: messageToSend,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        unreadCounts: {},
      };

      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const currentParticipants = roomData.participants || [];
        currentParticipants.forEach((uid: string) => {
          if (uid !== user.uid) {
            updateData.unreadCounts[uid] = increment(1);
          }
        });
      }
      await setDoc(roomRef, updateData, {merge: true});
    } catch (error) {
      console.error('Error sending message: ', error);
      alert('전송 실패');
    }
  };

  // 8. 나가기 로직 수정
  const performLeaveChat = async () => {
    if (!roomId || !user) return;
    try {
      const roomRef = doc(db, 'chats', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setSettingsVisible(false);
        router.back();
        return;
      }

      const roomData = roomSnap.data();
      const currentParticipants = roomData.participants || [];
      // 내가 나간 후 남게 될 인원들
      const updatedParticipants = currentParticipants.filter((uid: string) => uid !== user.uid);

      // 🔥 [수정] 남은 인원이 2명 미만(1명 또는 0명)이면 방 삭제
      // 기존 코드: if (updatedParticipants.length < 1)
      if (updatedParticipants.length < 2) {
        await deleteDoc(roomRef);
      } else {
        // 2명 이상 남아있다면, 나만 명단에서 빠짐
        await updateDoc(roomRef, {
          participants: updatedParticipants,
          [`unreadCounts.${user.uid}`]: deleteField(), // 내 읽음 카운트도 삭제
        });
      }

      setSettingsVisible(false);
      router.replace('/(tabs)/chat');
    } catch (e) {
      console.error('Error leaving chat:', e);
      Alert.alert('오류', '나가기 처리 중 문제가 발생했습니다.');
    }
  };

  const handleLeaveChat = () => {
    if (Platform.OS === 'web') {
      if (confirm('정말로 이 채팅방을 나가시겠습니까?')) {
        performLeaveChat();
      }
    } else {
      Alert.alert('채팅방 나가기', '정말로 이 채팅방을 나가시겠습니까?', [
        {text: '취소', style: 'cancel'},
        {text: '나가기', style: 'destructive', onPress: performLeaveChat},
      ]);
    }
  };

  // 🔥 [수정] 유저 강퇴(내보내기) 함수 - Platform 분기 적용
  // 🔥 [수정] 유저 강퇴 함수 (2명 미만 시 방 폭파 로직 추가)
  const handleKickUser = async (targetUser: UserInfo) => {
    if (!roomId) return;

    const executeKick = async () => {
      try {
        const roomRef = doc(db, 'chats', roomId);

        // 현재 참여자 수에서 1명(강퇴 대상)을 뺐을 때 남은 인원 계산
        // participants state는 현재 화면에 보이는 목록 기준입니다.
        const remainingCount = participants.length - 1;

        // 🔥 [핵심 로직] 남은 인원이 2명 미만(즉, 1명 이하)이면 방 자체를 삭제
        if (remainingCount < 2) {
          await deleteDoc(roomRef);

          // 방이 삭제되면 useEffect의 onSnapshot에서 "방이 종료되었습니다" 알림을 띄우고
          // 목록 화면으로 자동 이동시키므로 별도의 이동 로직은 필요 없습니다.
        } else {
          // 남은 인원이 2명 이상이면, 단순히 참여자 목록에서만 제거
          await updateDoc(roomRef, {
            participants: arrayRemove(targetUser.uid),
            [`unreadCounts.${targetUser.uid}`]: deleteField(),
          });

          // 강퇴 알림 메시지 전송
          await addDoc(collection(db, 'chats', roomId, 'messages'), {
            text: `${targetUser.name}님이 방장에 의해 내보내졌습니다.`,
            sender: 'system',
            createdAt: serverTimestamp(),
          });

          // UI 목록 업데이트
          setParticipants(prev => prev.filter(p => p.uid !== targetUser.uid));

          if (Platform.OS === 'web') {
            window.alert('성공적으로 내보냈습니다.');
          } else {
            Alert.alert('알림', '성공적으로 내보냈습니다.');
          }
        }
      } catch (error) {
        console.error('강퇴 실패:', error);
        Alert.alert('오류', '작업을 처리하는 중 문제가 발생했습니다.');
      }
    };

    // (확인 창 로직은 기존과 동일)
    if (Platform.OS === 'web') {
      if (
        window.confirm(`${targetUser.name}님을 내보내면 방이 폭파될 수 있습니다. 진행하시겠습니까?`)
      ) {
        await executeKick();
      }
    } else {
      Alert.alert(
        '참여자 내보내기',
        `${targetUser.name}님을 내보내시겠습니까?\n(남은 인원이 2명 미만이면 방이 삭제됩니다)`,
        [
          {text: '취소', style: 'cancel'},
          {text: '내보내기', style: 'destructive', onPress: executeKick},
        ],
      );
    }
  };

  const renderItem = ({item}: {item: Message}) => {
    const isMe = item.sender === (user?.displayName || 'me') || item.sender === 'me';
    if (item.sender === 'system') {
      return (
        <View style={styles.systemMessageRow}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        {!isMe && <Text style={styles.senderName}>{item.sender}</Text>}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderInviteItem = ({item}: {item: UserInfo}) => (
    <TouchableOpacity style={styles.inviteItem} onPress={() => handleInviteUser(item)}>
      <View style={styles.avatarSmall} />
      <View>
        <Text style={styles.participantName}>{item.name}</Text>
        <Text style={styles.participantEmail}>{item.email}</Text>
      </View>
      <IconSymbol name="plus" size={20} color="#006FFD" style={{marginLeft: 'auto'}} />
    </TouchableOpacity>
  );

  // 채팅방 입장 시 읽음 처리
  useEffect(() => {
    if (!roomId || !user) return;
    const resetUnreadCount = async () => {
      try {
        const roomRef = doc(db, 'chats', roomId);
        await setDoc(
          roomRef,
          {
            unreadCounts: {[user.uid]: 0},
          },
          {merge: true},
        );
      } catch (e) {
        console.error('읽음 처리 실패:', e);
      }
    };
    resetUnreadCount();
  }, [roomId, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <IconSymbol name="chevron.left" size={24} color="#006FFD" />
        </TouchableOpacity>
        {/* 🔥 헤더 제목을 state 변수로 변경 */}
        <Text style={styles.headerTitle}>{currentRoomName}</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.iconButton}>
          <IconSymbol name="gear" size={24} color="#1F2024" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#006FFD" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton}>
            <IconSymbol name="plus" size={24} color="#006FFD" />
          </TouchableOpacity>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="메시지 입력"
              value={text}
              onChangeText={setText}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <IconSymbol name="arrow.up" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ⚙️ 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>그룹 채팅방 설정</Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={{position: 'absolute', right: 0}}>
                <IconSymbol name="xmark" size={24} color="#1F2024" />
              </TouchableOpacity>
            </View>

            {/* 채팅방 이름 변경 섹션 (방장만 가능) */}
            <View style={styles.settingItemColumn}>
              <Text style={[styles.settingText, {marginBottom: 8}]}>채팅방 이름</Text>
              <View style={{flexDirection: 'row', gap: 8}}>
                <TextInput
                  style={[
                    styles.nameInput,
                    // 방장이 아니면 회색 배경 & 텍스트 흐리게 처리
                    user?.uid !== roomOwnerId && {backgroundColor: '#F0F0F0', color: '#999'},
                  ]}
                  value={editableName}
                  onChangeText={setEditableName}
                  placeholder="방 이름을 입력하세요"
                  editable={user?.uid === roomOwnerId} // 방장만 수정 가능
                />
                {/* 방장일 때만 저장 버튼 표시 */}
                {user?.uid === roomOwnerId && (
                  <TouchableOpacity style={styles.saveButton} onPress={handleUpdateRoomName}>
                    <Text style={styles.saveButtonText}>저장</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* 방장이 아닐 때 안내 문구 */}
              {user?.uid !== roomOwnerId && (
                <Text style={{fontSize: 12, color: '#FF5555', marginTop: 4}}>
                  * 방장만 변경 가능합니다.
                </Text>
              )}
            </View>
            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>채팅방 알림</Text>
              <Switch
                value={isNotificationEnabled}
                onValueChange={toggleNotification}
                trackColor={{false: '#767577', true: '#006FFD'}}
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>참여자 ({participants.length}명)</Text>
              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  setTimeout(() => {
                    setInviteModalVisible(true);
                  }, 500);
                }}>
                <Text style={{color: '#006FFD', fontWeight: '600'}}>+ 초대하기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            <ScrollView style={styles.participantList}>
              {participants.length > 0 ? (
                participants.map(p => (
                  <View key={p.uid} style={styles.participantItem}>
                    <View style={styles.avatarSmall} />
                    <View style={{flex: 1}}>
                      <Text style={styles.participantName}>
                        {p.name || '이름 없음'}
                        {p.uid === user?.uid ? ' (나)' : ''}
                        {/* 방장 표시 (왕관 아이콘 등) */}
                        {p.uid === roomOwnerId ? ' 👑' : ''}
                      </Text>
                      <Text style={styles.participantEmail}>{p.email}</Text>
                    </View>

                    {/* 강퇴 버튼: 나는 방장이고, 상대방은 내가 아닐 때 표시 */}
                    {user?.uid === roomOwnerId && p.uid !== user.uid && (
                      <TouchableOpacity style={styles.kickButton} onPress={() => handleKickUser(p)}>
                        <Text style={styles.kickButtonText}>내보내기</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={{color: '#8F9098', padding: 10, textAlign: 'center'}}>
                  참여자 정보가 없습니다.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveChat}>
              <Text style={styles.leaveButtonText}>채팅방 나가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 초대 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, {maxHeight: '60%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대화 상대 초대</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <IconSymbol name="xmark" size={24} color="#1F2024" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allUsers}
              renderItem={renderInviteItem}
              keyExtractor={item => item.uid}
              ListEmptyComponent={
                <Text style={{textAlign: 'center', marginTop: 20, color: '#888'}}>
                  초대할 친구가 없습니다.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, backgroundColor: 'white'},
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {fontSize: 16, fontWeight: '700', color: '#1F2024'},
  iconButton: {padding: 4},
  listContent: {padding: 16, gap: 16, paddingBottom: 80},
  messageRow: {marginBottom: 4, maxWidth: '80%'},
  myRow: {alignSelf: 'flex-end', alignItems: 'flex-end'},
  otherRow: {alignSelf: 'flex-start', alignItems: 'flex-start'},

  systemMessageRow: {alignItems: 'center', marginVertical: 10},
  systemMessageText: {
    fontSize: 12,
    color: '#8F9098',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  senderName: {fontSize: 12, color: '#71727A', fontWeight: '700', marginBottom: 4, marginLeft: 4},
  bubble: {paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20},
  myBubble: {backgroundColor: '#006FFD', borderTopRightRadius: 4},
  otherBubble: {backgroundColor: '#F8F9FE', borderTopLeftRadius: 4},
  messageText: {fontSize: 14, lineHeight: 20},
  myText: {color: 'white'},
  otherText: {color: '#1F2024'},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  plusButton: {marginRight: 12},
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textInput: {flex: 1, height: 40, paddingHorizontal: 12, fontSize: 14, color: '#1F2024'},
  sendButton: {
    width: 32,
    height: 32,
    backgroundColor: '#006FFD',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    width: '100%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {fontSize: 16, fontWeight: '700', color: '#1F2024'},

  // 🔥 [추가된 스타일] 이름 변경 UI
  settingItemColumn: {paddingVertical: 16},
  nameInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8F9FE',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    width: 60,
    height: 44,
    backgroundColor: '#006FFD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {color: 'white', fontWeight: '600'},

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingText: {fontSize: 14, color: '#1F2024'},
  divider: {height: 1, backgroundColor: '#F0F0F0'},
  participantList: {marginTop: 10, marginBottom: 20, maxHeight: 200},
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    backgroundColor: '#F8F9FE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarSmall: {width: 32, height: 32, borderRadius: 12, backgroundColor: '#B4DBFF'},
  participantName: {fontSize: 14, fontWeight: '600', color: '#1F2024'},
  participantEmail: {fontSize: 12, color: '#71727A'},
  leaveButton: {
    backgroundColor: '#006FFD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  leaveButtonText: {color: 'white', fontWeight: '600', fontSize: 14},
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  // 🔥 [추가] 내보내기 버튼 스타일
  kickButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kickButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
});
