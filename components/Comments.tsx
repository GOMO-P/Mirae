import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const BLUE = '#316BFF';
const CARD = '#151515';
const GRAY = '#A0A4AF';
const WHITE = '#FFFFFF';

type Comment = {
  id: string;
  text: string;
  userName: string;
  createdAt: any;
};

type CommentsProps = {
  roomId: string;
};

export default function Comments({ roomId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap: any) => {
        const list: Comment[] = snap.docs.map((d: any) => ({
          id: d.id,
          ...d.data(),
        }));
        setComments(list);
        setLoading(false);
      },
      (err: any) => {
        console.error('댓글 구독 에러:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [roomId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'rooms', roomId, 'comments'), {
        text: newComment.trim(),
        userName: '익명',
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (err) {
      console.error('댓글 작성 에러:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>댓글 ({comments.length})</Text>

      {/* 댓글 입력 */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={GRAY}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || !newComment.trim()}
        >
          <Text style={styles.submitText}>
            {submitting ? '...' : '등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 댓글 목록 */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={BLUE} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>첫 댓글을 남겨보세요!</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.userName}>{comment.userName}</Text>
                <Text style={styles.timeText}>
                  {formatDate(comment.createdAt)}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    color: WHITE,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
  },
  submitBtn: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  commentCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userName: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
  },
  timeText: {
    color: GRAY,
    fontSize: 11,
  },
  commentText: {
    color: WHITE,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: GRAY,
    fontSize: 13,
  },
});
