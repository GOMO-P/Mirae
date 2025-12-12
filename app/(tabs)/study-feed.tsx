import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router, useLocalSearchParams} from 'expo-router';

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  runTransaction,
  increment,
} from 'firebase/firestore';
import {db, storage} from '../../config/firebase';
import {ref, deleteObject} from 'firebase/storage';
import {useAuthContext} from '@/contexts/AuthContext';
import {useGroupContext} from '@/contexts/GroupContext';

const BLUE = '#4A90E2';
const LIGHT_BG = '#F5F7FA';
const LIGHT_CARD = '#FFFFFF';
const GRAY = '#8E8E93';
const TEXT_DARK = '#1C1C1E';
const WHITE = '#FFFFFF';

type StudyRecord = {
  id: string;
  uid?: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  studyMode: 'solo' | 'group';
  groupId?: string;
  groupName?: string;
  studyDateDisplay: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
  pointsEarned?: number;
  description: string;
  imageUrl: string | null;
  createdAt?: any;
};

export default function StudyFeedScreen() {
  const {user} = useAuthContext();
  const {joinedGroupIds} = useGroupContext();
  const params = useLocalSearchParams();

  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'group' | 'my'>('all');

  // 파라미터로 필터 모드 변경
  useEffect(() => {
    if (params.initialFilter) {
      setFilterMode(params.initialFilter as any);
    }
  }, [params.initialFilter]);

  // ===== Firestore 실시간 구독 =====
  useEffect(() => {
    setLoading(true);
    setRecords([]); // 필터 변경 시 기존 데이터 초기화
    let q;

    if (filterMode === 'my' && user) {
      q = query(
        collection(db, 'studyRecords'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
      );
    } else if (filterMode === 'group') {
      if (!joinedGroupIds || joinedGroupIds.length === 0) {
        // 가입한 그룹이 없으면 빈 목록
        setRecords([]);
        setLoading(false);
        return;
      }
      // 'in' 쿼리는 최대 10개(또는 30개) 제안이 있음. 안전하게 10개로 자르거나 처리 필요.
      const targetGroups = joinedGroupIds.slice(0, 10);
      q = query(
        collection(db, 'studyRecords'),
        where('groupId', 'in', targetGroups),
        orderBy('createdAt', 'desc'),
      );
    } else {
      // 전체 피드
      q = query(collection(db, 'studyRecords'), orderBy('createdAt', 'desc'));
    }

    const unsub = onSnapshot(
      q,
      snap => {
        const list: StudyRecord[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setRecords(list);
        setLoading(false);
      },
      err => {
        console.error('피드 구독 에러:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [filterMode, user, joinedGroupIds]);

  // ===== 삭제 처리 (Transaction: Doc Delete + Points Rollback) =====
  const confirmDelete = (record: StudyRecord) => {
    // 본인 글만 삭제 가능
    if (user?.uid && record.uid && record.uid !== user.uid) {
      Alert.alert('권한 없음', '다른 사람의 글은 삭제할 수 없어요.');
      return;
    }

    if (deletingId) return;

    if (Platform.OS === 'web') {
      if (window.confirm('정말 삭제할까요? 포인트도 함께 회수됩니다.')) handleDelete(record);
    } else {
      Alert.alert(
        '삭제',
        '정말 삭제할까요?\n(획득한 포인트도 함께 회수됩니다)',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => handleDelete(record),
          },
        ],
        {cancelable: true},
      );
    }
  };

  const handleDelete = async (record: StudyRecord) => {
    try {
      setDeletingId(record.id);

      // --- Transaction 시작 ---
      await runTransaction(db, async transaction => {
        // 1. 문서 존재 확인 (이미 삭제됐을 수도 있으므로)
        const recordRef = doc(db, 'studyRecords', record.id);
        const recordSnap = await transaction.get(recordRef);
        if (!recordSnap.exists()) {
          throw new Error('Document does not exist!');
        }

        // 2. 포인트 차감 (회수)
        // 기존에 지급했던 포인트: record.pointsEarned 혹은 record.totalMinutes
        const pointsToDeduct = record.pointsEarned ?? record.totalMinutes ?? 0;
        const minutesToDeduct = record.totalMinutes ?? 0;

        if (record.uid) {
          const userRef = doc(db, 'users', record.uid);
          transaction.update(userRef, {
            totalPoints: increment(-pointsToDeduct),
            totalStudyMinutes: increment(-minutesToDeduct),
          });
        }

        if (record.groupId) {
          const groupRef = doc(db, 'groups', record.groupId);
          transaction.update(groupRef, {
            totalPoints: increment(-pointsToDeduct),
          });
        }

        // 3. 문서 삭제
        transaction.delete(recordRef);
      });
      // --- Transaction 끝 ---

      // 4. 이미지 삭제 (Transaction 밖에서 수행 - 실패해도 DB 정합성은 맞음)
      if (record.imageUrl) {
        try {
          const url = record.imageUrl;
          if (url.includes('studyCerts%2F')) {
            const pathMatch = url.match(/studyCerts%2F[^?]+/);
            if (pathMatch) {
              const filePath = decodeURIComponent(pathMatch[0].replace(/%2F/g, '/'));
              const imgRef = ref(storage, filePath);
              await deleteObject(imgRef);
            }
          }
        } catch (err) {
          console.warn('이미지 삭제 실패(무시 가능):', err);
        }
      }

      Alert.alert('완료', '삭제되었습니다.');
    } catch (err: any) {
      console.error('삭제 에러:', err);
      Alert.alert('에러', '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderRecord = (r: StudyRecord) => {
    const timeText = `${r.hours}시간 ${r.minutes}분`;
    const modeText =
      r.studyMode === 'group'
        ? `다같이 공부 (${r.groupName || '그룹명 없음'})` // 그룹명 표시
        : '혼자 공부';

    const isMyPost = user?.uid && r.uid === user.uid;

    return (
      <View key={r.id} style={styles.card}>
        {/* 작성자 정보 */}
        <View style={styles.cardTop}>
          <View style={styles.userInfoRow}>
            <View style={styles.userAvatarPlaceholder}>
              {r.userPhotoURL && !r.userPhotoURL.startsWith('blob:') ? (
                <Image
                  source={{uri: r.userPhotoURL}}
                  style={{width: 32, height: 32, borderRadius: 16}}
                />
              ) : (
                <View style={{width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee'}} />
              )}
            </View>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.userName}>{r.userDisplayName || '사용자'}</Text>
                {r.studyMode === 'group' && r.groupName && (
                  <Text style={styles.groupNameText}>@{r.groupName}</Text>
                )}
              </View>
              <Text style={styles.dateTextSmall}>{r.studyDateDisplay}</Text>
            </View>
          </View>
          {isMyPost && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => confirmDelete(r)}
              disabled={deletingId === r.id}>
              <Text style={styles.moreBtnText}>{deletingId === r.id ? '...' : '삭제'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 공부 모드 & 시간 */}
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{modeText}</Text>
          </View>
          <Text style={styles.timeText}>{timeText}</Text>
        </View>

        {/* 본문: 이미지 + 설명 */}
        <View style={styles.cardBody}>
          {r.imageUrl && <Image source={{uri: r.imageUrl}} style={styles.photo} />}
          <Text style={styles.descText}>{r.description}</Text>
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
          onPress={() =>
            router.push(
              `/study-cert?mode=${
                filterMode === 'group' ? 'group' : 'solo'
              }&returnFilter=${filterMode}`,
            )
          }>
          <Text style={styles.headerBtnText}>＋ 인증하기</Text>
        </TouchableOpacity>
      </View>

      {/* 필터 탭 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'all' && styles.filterBtnActive]}
            onPress={() => setFilterMode('all')}>
            <Text style={[styles.filterText, filterMode === 'all' && styles.filterTextActive]}>
              전체 피드
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'group' && styles.filterBtnActive]}
            onPress={() => setFilterMode('group')}>
            <Text style={[styles.filterText, filterMode === 'group' && styles.filterTextActive]}>
              내 그룹 피드
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'my' && styles.filterBtnActive]}
            onPress={() => setFilterMode('my')}>
            <Text style={[styles.filterText, filterMode === 'my' && styles.filterTextActive]}>
              내 공부 기록
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>표시할 인증 내용이 없어요.</Text>
          {filterMode === 'group' && (
            <Text style={styles.emptyTextSub}>
              가입한 그룹이 없거나, 그룹에 올라온 글이 없어요.
            </Text>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}>
          {records.map(renderRecord)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIGHT_BG,
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
    color: '#000',
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
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  filterBtn: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: LIGHT_CARD,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterBtnActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  filterText: {
    fontSize: 13,
    color: GRAY,
    fontWeight: '600',
  },
  filterTextActive: {
    color: WHITE,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: LIGHT_CARD,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarPlaceholder: {
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  groupNameText: {
    fontSize: 14,
    color: BLUE,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateTextSmall: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },
  moreBtnText: {
    fontSize: 12,
    color: '#FF5555',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '700',
  },
  cardBody: {
    marginTop: 0,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    resizeMode: 'cover',
  },
  descText: {
    color: TEXT_DARK,
    fontSize: 14,
    lineHeight: 20,
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
    marginTop: 40,
  },
  emptyText: {
    color: '#000',
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  emptyTextSub: {
    color: GRAY,
    fontSize: 14,
    textAlign: 'center',
  },
});
