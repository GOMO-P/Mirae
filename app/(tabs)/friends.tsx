import React, {useState} from 'react';
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

const BLUE = '#316BFF';
const BG = '#000000';
const WHITE = '#FFFFFF';
const GRAY = '#A0A4AF';
const DARK_GRAY = '#1A1A1A';

type Message = {
  id: string;
  nickname: string;
  text: string;
  timestamp: Date;
};

type GroupMessages = {
  [key: number]: Message[];
};

const GROUPS = ['정보처리기사 스터디', '전기기사자격증반', '맥도날드를 사랑하는 모임'];

// 각 그룹별 초기 메시지
const INITIAL_MESSAGES: GroupMessages = {
  0: [
    {
      id: '1',
      nickname: '방장',
      text: '안녕하세요 공지 읽어주시고 맘껏 버튼 누르시면 스터디 하시고 공부 인증 같이 서로 올리주세요!',
      timestamp: new Date(),
    },
  ],
  1: [
    {
      id: '2',
      nickname: '모카',
      text: '전기기사 자격증 같이 준비해요!',
      timestamp: new Date(),
    },
  ],
  2: [
    {
      id: '3',
      nickname: '이나',
      text: '맥도날드 좋아하시는 분들 환영합니다!',
      timestamp: new Date(),
    },
  ],
};

export default function GroupScreen() {
  const {user} = useAuthContext();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupMessages, setGroupMessages] = useState<GroupMessages>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const currentNickname = user?.displayName || user?.email?.split('@')[0] || '익명';

  const changeGroup = () => {
    setCurrentGroupIndex(prev => (prev === GROUPS.length - 1 ? 0 : prev + 1));
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      nickname: currentNickname,
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setGroupMessages(prev => ({
      ...prev,
      [currentGroupIndex]: [...(prev[currentGroupIndex] || []), newMessage],
    }));
    setInputText('');
  };

  const currentMessages = groupMessages[currentGroupIndex] || [];

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
          {currentMessages.map(msg => (
            <View key={msg.id} style={styles.messageContainer}>
              <Text style={styles.messageNickname}>{msg.nickname}</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            </View>
          ))}
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
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 24,
    color: WHITE,
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
    color: WHITE,
    textAlign: 'center',
  },
  nextButton: {
    marginLeft: 8,
    padding: 4,
  },
  nextText: {
    fontSize: 20,
    color: WHITE,
  },
  studyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: BG,
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
    backgroundColor: BG,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageNickname: {
    fontSize: 12,
    fontWeight: '600',
    color: BLUE,
    marginBottom: 4,
  },
  messageBubble: {
    backgroundColor: DARK_GRAY,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  messageText: {
    color: WHITE,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DARK_GRAY,
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
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: WHITE,
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
});
