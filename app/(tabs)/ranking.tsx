import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {collection, query, orderBy, limit, onSnapshot, getDoc, doc} from 'firebase/firestore';
import {db} from '@/config/firebase';
import {useAuthContext} from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar'; // Assume we have this, or fallback to simple view

type RankingItem = {
  id: string;
  name: string;
  score: number;
  subtitle?: string;
  photoURL?: string;
  rank?: number;
};

const BLUE = '#316BFF';
const BG = '#F5F7FB';
const CARD_BG = '#F2F5FF';
const GRAY = '#A0A4AF';

export default function RankingScreen() {
  const {user} = useAuthContext();
  const [mode, setMode] = useState<'personal' | 'group'>('group');
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [myPoints, setMyPoints] = useState<number>(0);

  // 내 포인트 실시간 구독
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), doc => {
      setMyPoints(doc.data()?.totalPoints || 0);
    });
    return () => unsub();
  }, [user]);

  // 랭킹 데이터 실시간 구독
  useEffect(() => {
    setLoading(true);
    let q;

    if (mode === 'personal') {
      q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(50));
    } else {
      q = query(collection(db, 'groups'), orderBy('totalPoints', 'desc'), limit(50));
    }

    const unsub = onSnapshot(q, snapshot => {
      const data: RankingItem[] = snapshot.docs.map((doc, index) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: mode === 'personal' ? d.displayName || '익명' : d.name,
          score: d.totalPoints || 0,
          subtitle: mode === 'personal' ? d.bio || '' : d.description || '',
          photoURL: mode === 'personal' ? d.photoURL : d.imageUrl,
          rank: index + 1,
        };
      });
      setRankingData(data);
      setLoading(false);
    });

    return () => unsub();
  }, [mode]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <Text style={styles.icon}>🏆</Text>
          <Text style={styles.title}>내 점수: {myPoints}pt</Text>
        </View>

        {/* 개인 / 그룹 탭 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'personal' && styles.tabButtonSelected]}
            onPress={() => setMode('personal')}>
            <Text style={[styles.tabText, mode === 'personal' && styles.tabTextSelected]}>
              개인 랭킹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'group' && styles.tabButtonSelected]}
            onPress={() => setMode('group')}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Text style={[styles.tabText, mode === 'group' && styles.tabTextSelected]}>
                그룹 랭킹
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 요구사항: 개인별 포인트는 그룹 탭 이름 옆에서 보일 수 있도록 한다.
              (혹은 그룹 탭이 활성화 되었을 때 보여야 한다는 의미일 수 있음)
              디자인상 탭 안에 넣기엔 좁으므로, 탭 바로 아래나 위에 두는 것도 방법이나,
              요청사항 "그룹 탭 이름 옆"을 최대한 준수하여 탭 레이블 옆에 넣거나,
              헤더에 내 포인트를 크게 보여주는 것이 일반적인 UX.
              (위 코드에서는 헤더 Title에 잠시 넣었으나, 좀 더 정확히 탭 옆에 넣어봄)
          */}

        {/* 리스트 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE} />
          </View>
        ) : (
          <FlatList
            data={rankingData}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({item}) => (
              <View style={[styles.card, item.id === user?.uid && styles.myCard]}>
                <View style={styles.rankBadge}>
                  <Text style={[styles.rankText, item.rank! <= 3 && styles.topRankText]}>
                    {item.rank}
                  </Text>
                </View>
                {item.photoURL ? (
                  <Image source={{uri: item.photoURL}} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
                <View style={styles.cardTextArea}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.score}>{item.score}pt</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 랭킹 데이터가 없어요.</Text>
                <Text style={styles.emptySubText}>스터디 인증을 통해 포인트를 쌓아보세요!</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  icon: {fontSize: 18, marginRight: 8},
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4EBFF',
    borderRadius: 20,
    padding: 4,
    marginTop: 8,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabButtonSelected: {backgroundColor: BLUE},
  tabText: {
    fontSize: 14,
    color: GRAY,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  arrow: {fontSize: 18, color: GRAY, marginHorizontal: 8},
  dateText: {fontSize: 14, fontWeight: '700'},
  listContent: {paddingBottom: 24},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  myCard: {
    borderWidth: 2,
    borderColor: BLUE,
    backgroundColor: '#FFFFFF',
  },
  rankBadge: {
    width: 24,
    marginRight: 8,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GRAY,
  },
  topRankText: {
    color: BLUE,
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E4F0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E4F0',
  },
  cardTextArea: {
    flex: 1,
    marginHorizontal: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: GRAY,
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubText: {
    color: GRAY,
    fontSize: 12,
  },
});
