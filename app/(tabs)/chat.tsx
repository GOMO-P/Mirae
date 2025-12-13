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
  getDoc,
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

const USERS_COLLECTION = 'users';

async function getFollowingProfiles(userId: string): Promise<UserData[]> {
  try {
    const followingRef = collection(db, USERS_COLLECTION, userId, 'following');
    const snapshot = await getDocs(followingRef);

    if (snapshot.empty) return [];

    const followingIds = snapshot.docs.map(doc => doc.id);

    const profiles = await Promise.all(
      followingIds.map(async id => {
        const userDocRef = doc(db, USERS_COLLECTION, id);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          return userDocSnap.data() as UserData;
        }
        return null;
      }),
    );
    return profiles.filter((p): p is UserData => p !== null);
  } catch (error) {
    console.error('Error getting following profiles:', error);
    return [];
  }
}

export default function ChatScreen() {
  const router = useRouter();
  const {user, loading: authLoading} = useAuthContext();

  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // [추가됨] 검색어 상태 관리
  const [searchText, setSearchText] = useState('');

  const [userMap, setUserMap] = useState<{[key: string]: string}>({});

  // 1. 유저 목록 가져오기 (이름 매칭용)
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
      snapshot => {
        const rooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatList(rooms as ChatRoom[]);
        setLoading(false);
      },
      error => {
        console.error('채팅 목록 불러오기 실패:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // [추가됨] 채팅방 이름 결정 헬퍼 함수
  const getDisplayName = (room: ChatRoom) => {
    // 1. 방에 설정된 커스텀 이름이 있으면 우선 사용
    if (room.name && room.name.trim().length > 0) {
      return room.name;
    }
    // 2. 1:1 채팅인 경우 상대방 이름 표시
    if (room.participants) {
      const otherId = room.participants.find(uid => uid !== user?.uid);
      if (otherId && userMap[otherId]) {
        return userMap[otherId];
      }
    }
    return room.name || '알 수 없음';
  };

  // [추가됨] 검색어가 적용된 리스트 필터링
  const filteredChatList = chatList.filter(room => {
    const displayName = getDisplayName(room);
    // 검색어가 없으면 모두 표시, 있으면 이름에 포함되는지 확인 (대소문자 무시)
    if (!searchText.trim()) return true;
    return displayName.toLowerCase().includes(searchText.toLowerCase());
  });

  async function schedulePushNotification(title: string, body: string) {
    await Notifications.scheduleNotificationAsync({
      content: {title, body, sound: true},
      trigger: null,
    });
  }

  // 친구 목록 불러오기: 팔로우하는 사용자만 조회
  const fetchUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    try {
      const followingProfiles = await getFollowingProfiles(user.uid);
      setUsers(followingProfiles);
    } catch (error) {
      console.error('Error fetching following users: ', error);
      Alert.alert('오류', '팔로잉 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (modalVisible && user) {
      fetchUsers();
    }
  }, [modalVisible, user]);

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

  const renderChatItem = ({item}: {item: ChatRoom}) => {
    const myUnreadCount = item.unreadCounts?.[user?.uid || ''] || 0;
    
    // [수정됨] 헬퍼 함수 사용하여 이름 가져오기
    const displayName = getDisplayName(item);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: {id: item.id, name: displayName},
          })
        }>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarHead, {backgroundColor: item.avatarBgColor}]} />
          <View style={[styles.avatarBody, {backgroundColor: item.avatarBgColor}]} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

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
        <View style={styles.headerLeftButton} />

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
            // [수정됨] 검색어 상태 연결
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center'}}>
          <ActivityIndicator size="large" color="#006FFD" />
        </View>
      ) : (
        <FlatList
          // [수정됨] 전체 리스트 대신 필터링된 리스트 사용
          data={filteredChatList}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={{padding: 40, alignItems: 'center'}}>
              <Text style={{color: '#8F9098', marginBottom: 8}}>
                {searchText ? '검색 결과가 없습니다.' : '채팅방이 없습니다.'}
              </Text>
              {!searchText && (
                <Text style={{color: '#006FFD'}}>우측 상단 + 버튼을 눌러보세요!</Text>
              )}
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
                    팔로우하는 친구가 없습니다.
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