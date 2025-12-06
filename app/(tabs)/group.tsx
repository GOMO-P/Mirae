import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import {db} from '@/config/firebase';

const BLUE = '#4A90E2';
const BG = '#000000';
const WHITE = '#FFFFFF';
const LIGHT_BG = '#F5F7FA';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#E5E5EA';
const TEXT_DARK = '#1C1C1E';

type Message = {
  id: string;
  nickname: string;
  text: string;
  timestamp: any;
  groupId: string;
  userId?: string;
};

const GROUPS = ['정보처리기사 스터디', '전기기사자격증반', '맥도날드를 사랑하는 모임'];

export default function GroupScreen() {
  const {user} = useAuthContext();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const currentNickname = user?.displayName || user?.email?.split('@')[0] || '익명';

  // Firestore에서 메시지 실시간 구독
  useEffect(() => {
    setLoading(true);
    setMessages([]); // 그룹 변경 시 메시지 초기화
    
    const currentGroupId = GROUPS[currentGroupIndex];
    console.log('현재 그룹:', currentGroupId); // 디버깅용
    
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', currentGroupId)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const msgs: Message[] = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a: any, b: any) => {
            // timestamp가 null인 경우 처리
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return a.timestamp?.seconds - b.timestamp?.seconds;
          }) as Message[];
        console.log(`${currentGroupId} 메시지 개수:`, msgs.length); // 디버깅용
        setMessages(msgs);
        setLoading(false);
      },
      error => {
        console.error('메시지 로드 에러:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentGroupIndex]);

  const changeGroup = () => {
    setCurrentGroupIndex(prev => (prev === GROUPS.length - 1 ? 0 : prev + 1));
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const currentGroupId = GROUPS[currentGroupIndex];
    console.log('메시지 전송 그룹:', currentGroupId); // 디버깅용

    try {
      await addDoc(collection(db, 'groupMessages'), {
        groupId: currentGroupId,
        nickname: currentNickname,
        text: inputText.trim(),
        timestamp: serverTimestamp(),
        userId: user?.uid || 'anonymous',
      });
      setInputText('');
    } catch (error) {
      console.error('메시지 전송 에러:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'groupMessages', messageId));
    } catch (error) {
      console.error('메시지 삭제 에러:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>

          <View style={styles.groupSelector}>
            <Text style={styles.groupName}>{GROUPS[currentGroupIndex]}</Text>
            <TouchableOpacity onPress={changeGroup} style={styles.nextButton}>
              <Text style={styles.nextText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 스터디 버튼 */}
        <View style={styles.studyButtons}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => router.push('/study-cert')}>
            <Text style={styles.smallButtonText}>스터디 인증</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => router.push('/study-feed')}>
            <Text style={styles.smallButtonText}>스터디 피드</Text>
          </TouchableOpacity>
        </View>

        {/* 안내 메시지 */}
        <Text style={styles.notice}>뉴비 님의 스터디 그룹에 입장하셨습니다.</Text>

        {/* 채팅 영역 */}
        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {loading ? (
            <Text style={styles.loadingText}>메시지 불러오는 중...</Text>
          ) : messages.length === 0 ? (
            <Text style={styles.emptyText}>첫 메시지를 남겨보세요!</Text>
          ) : (
            messages.map(msg => (
              <View key={msg.id} style={styles.messageContainer}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageNickname}>{msg.nickname}</Text>
                  {(msg.userId === user?.uid || user?.uid) && (
                    <TouchableOpacity
                      onPress={() => deleteMessage(msg.id)}
                      style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.messageBubble}>
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={GRAY}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: WHITE,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: BG,
  },
  groupSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: BG,
    textAlign: 'center',
  },
  nextButton: {
    marginLeft: 8,
    padding: 4,
  },
  nextText: {
    fontSize: 20,
    color: BG,
  },
  studyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: WHITE,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: BLUE,
    borderRadius: 12,
  },
  smallButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  notice: {
    textAlign: 'center',
    fontSize: 12,
    color: GRAY,
    paddingVertical: 8,
  },
  chatArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageNickname: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#FF3B30',
  },
  messageBubble: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  messageText: {
    color: TEXT_DARK,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: LIGHT_BG,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  plusText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BLUE,
    borderRadius: 16,
  },
  sendText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: GRAY,
    fontSize: 14,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: GRAY,
    fontSize: 14,
    marginTop: 20,
  },
});
