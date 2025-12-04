// app/study-feed.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, deleteObject } from 'firebase/storage';

const BLUE = '#316BFF';
const CARD = '#151515';
const GRAY = '#A0A4AF';
const WHITE = '#FFFFFF';

type StudyRecord = {
  id: string;
  studyMode: 'solo' | 'group';
  studyDateDisplay: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
  description: string;
  imageUrl: string | null;
  createdAt?: any;
};

export default function StudyFeedScreen() {
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ===== Firestore 실시간 구독 =====
  useEffect(() => {
    const q = query(
      collection(db, 'studyRecords'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap: any) => {
        const list: StudyRecord[] = snap.docs.map((d: any) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setRecords(list);
        setLoading(false);
      },
      (err: any) => {
        console.error('피드 구독 에러:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  // ===== 삭제 처리 (Firestore + Storage) =====
  const confirmDelete = (record: StudyRecord) => {
    if (deletingId) return;

    Alert.alert(
      '삭제',
      '정말 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => handleDelete(record),
        },
      ],
      { cancelable: true },
    );
  };

  const handleDelete = async (record: StudyRecord) => {
    try {
      setDeletingId(record.id);

      // 1) 사진이 있으면 Storage에서도 삭제 시도
      if (record.imageUrl) {
        try {
          // Firebase v9: 다운로드 URL 그대로 넣어도 ref에서 해석해줌
          const imgRef = ref(storage, record.imageUrl);
          await deleteObject(imgRef);
        } catch (err) {
          console.warn('이미지 삭제 실패(무시 가능):', err);
          // 사진 삭제는 실패해도 글 삭제는 계속 진행
        }
      }

      // 2) Firestore 문서 삭제
      await deleteDoc(doc(db, 'studyRecords', record.id));
    } catch (err) {
      console.error('인증 삭제 에러:', err);
      Alert.alert('에러', '삭제 중 오류가 발생했어요.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderRecord = (r: StudyRecord) => {
    const timeText = `${r.hours}시간 ${r.minutes}분 (총 ${r.totalMinutes}분)`;
    const modeText = r.studyMode === 'solo' ? '혼자 공부' : '다같이 공부';

    return (
      <View key={r.id} style={styles.card}>
        {/* 상단: 날짜 + 모드 */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{r.studyDateDisplay}</Text>
            <Text style={styles.modeText}>{modeText}</Text>
          </View>
          <Text style={styles.timeText}>{timeText}</Text>
        </View>

        {/* 중간: 이미지 + 설명 */}
        <View style={styles.cardBody}>
          {r.imageUrl ? (
            <Image source={{ uri: r.imageUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={{ color: GRAY, fontSize: 12 }}>사진 없음</Text>
            </View>
          )}

          <View style={styles.descWrap}>
            <Text style={styles.descLabel}>공부 내용</Text>
            <Text style={styles.descText}>{r.description}</Text>
          </View>
        </View>

        {/* 하단: 삭제 버튼 */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(r)}
            disabled={deletingId === r.id}
          >
            <Text style={styles.deleteText}>
              {deletingId === r.id ? '삭제 중...' : '삭제'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>스터디 피드</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/study-cert')}
        >
          <Text style={styles.headerBtnText}>＋ 인증하기</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>아직 등록된 인증이 없어요.</Text>
          <Text style={styles.emptyTextSub}>
            아래 버튼을 눌러 첫 인증을 남겨보세요!
          </Text>
          <TouchableOpacity
            style={[styles.headerBtn, { marginTop: 16 }]}
            onPress={() => router.push('/study-cert')}
          >
            <Text style={styles.headerBtnText}>스터디 인증하러 가기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {records.map(renderRecord)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BLUE,
  },
  headerBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  modeText: {
    color: GRAY,
    fontSize: 12,
    marginTop: 2,
  },
  timeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#202020',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  descWrap: {
    flex: 1,
    marginLeft: 10,
  },
  descLabel: {
    color: GRAY,
    fontSize: 11,
    marginBottom: 2,
  },
  descText: {
    color: WHITE,
    fontSize: 13,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FF5555',
  },
  deleteText: {
    fontSize: 12,
    color: '#FF7777',
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: WHITE,
    fontSize: 15,
    marginBottom: 4,
  },
  emptyTextSub: {
    color: GRAY,
    fontSize: 13,
    textAlign: 'center',
  },
});
