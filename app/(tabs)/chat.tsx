import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useRouter} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';

import {db} from '@/config/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  where,
} from 'firebase/firestore';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: any;
  avatarBgColor: string;
  unreadCounts?: {[key: string]: number};
  participants?: string[];
  createdBy?: string;
}

interface UserData {
  uid: string;
  name: string;
  email: string;
}

export default function ChatScreen() {
  const router = useRouter();
  // useAuthContext에서 loading 상태도 가져옵니다.
  const {user, loading: authLoading} = useAuthContext();

  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [userMap, setUserMap] = useState<{[key: string]: string}>({});

  // 1. 유저 목록 가져오기 (이름 매칭용) - 한 번만 실행
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), snapshot => {
      const map: {[key: string]: string} = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        map[data.uid] = data.name || '알 수 없음';
      });
      setUserMap(map);
    });
    return () => unsubscribe();
  }, []);

  // 2. 채팅방 목록 가져오기
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      // 1. 성공 시 실행되는 콜백
      snapshot => {
        const rooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setChatList(rooms as ChatRoom[]);
        setLoading(false); // 로딩 종료
      },
      // 2. 실패 시 실행되는 콜백 (이게 없어서 무한 로딩 중일 수 있음)
      error => {
        console.error('채팅 목록 불러오기 실패:', error);
        setLoading(false); // 에러가 나도 로딩은 꺼야 함
      },
    );

    return () => unsubscribe();
  }, [user]);

  // (알림 함수 생략 - 동일)
  async function schedulePushNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {title, body, sound: true},
      trigger: null,
    });
  }

  // 친구 목록 불러오기
  const fetchUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'), where('uid', '!=', user.uid));
      const querySnapshot = await getDocs(q);
      const userList: UserData[] = [];
      querySnapshot.forEach(doc => userList.push(doc.data() as UserData));
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users: ', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 모달 열릴 때만 호출
  useEffect(() => {
    if (modalVisible && user) {
      fetchUsers();
    }
  }, [modalVisible, user]);

  // 채팅방 생성 (동일)
  const handleCreateChat = async (selectedUser: UserData) => {
    if (!user) return;
    try {
      setModalVisible(false);
      const roomName = `${selectedUser.name}`;

      const initialUnreadCounts = {
        [user.uid]: 0,
        [selectedUser.uid]: 0,
      };

      const docRef = await addDoc(collection(db, 'chats'), {
        name: roomName,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [user.uid, selectedUser.uid],
        lastMessage: '대화를 시작해보세요!',
        lastMessageAt: serverTimestamp(),
        unreadCounts: initialUnreadCounts,
      });

      router.push({pathname: '/chat/[id]', params: {id: docRef.id, name: roomName}});
    } catch (error) {
      console.error('Error creating room: ', error);
      Alert.alert('오류', '채팅방 생성 실패');
    }
  };

  // 173번째 줄 근처의 기존 renderChatItem을 지우고 이걸 붙여넣으세요.
  const renderChatItem = ({item}: {item: ChatRoom}) => {
    const myUnreadCount = item.unreadCounts?.[user?.uid || ''] || 0;

    // 🔥 [이름 결정 로직 개선]
    // 1. DB에 저장된 채팅방 이름(item.name)이 있으면 그걸 최우선으로 씁니다.
    let displayName = item.name;

    // 2. 만약 채팅방 이름이 비어있다면, 상대방 이름을 찾아서 씁니다.
    const hasCustomName = item.name && item.name.trim().length > 0;

    // (참고: 로직에 따라 '이름이 유저 이름과 같으면' 상대방 이름으로 보여주는 로직이 필요할 수도 있습니다.
    // 일단 현재는 DB에 name이 있으면 무조건 그걸 보여줍니다.)

    if (!hasCustomName && item.participants) {
      const otherId = item.participants.find(uid => uid !== user?.uid);
      if (otherId && userMap[otherId]) {
        displayName = userMap[otherId];
      }
    }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          // 🔥 [수정됨] 상세 화면으로 갈 때 결정된 displayName을 같이 보냅니다.
          router.push({
            pathname: '/chat/[id]',
            params: {id: item.id, name: displayName},
          })
        }>
        {/* 아바타 영역 (기존 유지) */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarHead, {backgroundColor: item.avatarBgColor}]} />
          <View style={[styles.avatarBody, {backgroundColor: item.avatarBgColor}]} />
        </View>

        {/* 텍스트 영역 */}
        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        {/* 배지 영역 (기존 유지) */}
        <View style={styles.rightContainer}>
          {myUnreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{myUnreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  const renderUserItem = ({item}: {item: UserData}) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleCreateChat(item)}>
      <View style={[styles.avatarContainer, {width: 36, height: 36, marginRight: 12}]}>
        <View style={[styles.avatarHead, {backgroundColor: '#E0E0E0'}]} />
        <View style={[styles.avatarBody, {backgroundColor: '#E0E0E0'}]} />
      </View>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  // 로딩 화면 처리
  if (authLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#006FFD" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBarPlaceholder} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeftButton}>
          <Text style={styles.headerButtonText}>수정</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>채팅 목록</Text>
        </View>
        <TouchableOpacity style={styles.headerRightButton} onPress={() => setModalVisible(true)}>
          <IconSymbol name="plus" size={24} color="#006FFD" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={18} color="#8F9098" style={{marginRight: 8}} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#8F9098"
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center'}}>
          <ActivityIndicator size="large" color="#006FFD" />
        </View>
      ) : (
        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={{padding: 40, alignItems: 'center'}}>
              <Text style={{color: '#8F9098', marginBottom: 8}}>채팅방이 없습니다.</Text>
              <Text style={{color: '#006FFD'}}>우측 상단 + 버튼을 눌러보세요!</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대화 상대를 선택하세요</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark" size={20} color="#71727A" />
              </TouchableOpacity>
            </View>
            {loadingUsers ? (
              <ActivityIndicator size="large" color="#006FFD" style={{marginVertical: 20}} />
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={item => item.uid}
                contentContainerStyle={{paddingBottom: 16}}
                ListEmptyComponent={
                  <Text style={{textAlign: 'center', color: '#8F9098', marginTop: 20}}>
                    친구 없음
                  </Text>
                }
              />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, backgroundColor: 'white'},
  statusBarPlaceholder: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'white',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  headerLeftButton: {minWidth: 40, justifyContent: 'center', alignItems: 'flex-start', zIndex: 10},
  headerButtonText: {fontSize: 14, fontWeight: '600', color: '#006FFD'},
  headerTitleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  headerTitle: {fontSize: 16, fontWeight: '700', color: '#1F2024'},
  headerRightButton: {minWidth: 40, justifyContent: 'center', alignItems: 'flex-end', zIndex: 10},
  searchContainer: {paddingHorizontal: 16, paddingVertical: 12},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {flex: 1, fontSize: 14, color: '#1F2024', height: '100%', paddingVertical: 0},
  listContent: {paddingBottom: 20},
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#EAF2FF',
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHead: {width: 16, height: 16, borderRadius: 8, position: 'absolute', top: 8},
  avatarBody: {width: 24, height: 24, borderRadius: 12, position: 'absolute', bottom: -10},
  textContainer: {flex: 1, justifyContent: 'center', gap: 2},
  nameText: {fontSize: 14, fontWeight: '700', color: '#1F2024', marginBottom: 2},
  messageText: {fontSize: 12, fontWeight: '400', color: '#71727A'},
  rightContainer: {justifyContent: 'center', alignItems: 'flex-end', minWidth: 24},
  badge: {
    backgroundColor: '#006FFD',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {color: 'white', fontSize: 10, fontWeight: '700'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 18, fontWeight: '700', color: '#1F2024'},
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  userName: {fontSize: 16, fontWeight: '600', color: '#1F2024'},
  userEmail: {fontSize: 12, color: '#71727A'},
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  closeButtonText: {fontSize: 14, fontWeight: '600', color: '#1F2024'},
});
