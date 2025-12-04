// app/rooms/[roomId].tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Comments from '../../components/Comments';

export default function RoomScreen() {
  // /rooms/FR-301 로 들어오면 roomId = "FR-301"
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const id = roomId ?? 'UNKNOWN';

  return (
    <View style={styles.container}>
      {/* 방 상단 정보 영역 */}
      <Text style={styles.title}>{id} 방</Text>
      <Text style={styles.subtitle}>이 방에 대한 이야기와 인증을 남겨보세요.</Text>

      {/* 댓글 컴포넌트 (rooms/{roomId}/comments 컬렉션 사용) */}
      <Comments roomId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 16,
  },
});
