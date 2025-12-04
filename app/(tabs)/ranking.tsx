import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type RankingItem = {
  id: string;
  name: string;
  score: number;
  subtitle?: string;
};

const personalData: RankingItem[] = [
  {id: '1', name: '맥날', score: 1800},
  {id: '2', name: '맘터', score: 1380},
  {id: '3', name: 'kfc', score: 1200},
  {id: '4', name: '버거킹', score: 1180},
  {id: '5', name: '롯리', score: 1000},
];

const groupData: RankingItem[] = [
  {id: '1', name: '맥사모 (맥도날드를 사랑하는 모임)', score: 1800},
  {id: '2', name: '맘사모', score: 1380},
  {id: '3', name: '전기기사자격증반', score: 1200},
  {id: '4', name: '버사모', score: 1180},
  {id: '5', name: '롯사모', score: 1000},
];

const BLUE = '#316BFF';
const BG = '#F5F7FB';
const CARD_BG = '#F2F5FF';
const GRAY = '#A0A4AF';

export default function RankingScreen() {
  const [mode, setMode] = React.useState<'personal' | 'group'>('group');
  const data = mode === 'personal' ? personalData : groupData;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <Text style={styles.icon}>{'<'}</Text>
          <Text style={styles.title}>랭킹 조회 🏆</Text>
          <Text style={styles.icon}>⋯</Text>
        </View>

        {/* 개인 / 그룹 탭 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              mode === 'personal' && styles.tabButtonSelected,
            ]}
            onPress={() => setMode('personal')}>
            <Text
              style={[
                styles.tabText,
                mode === 'personal' && styles.tabTextSelected,
              ]}>
              개인 랭킹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              mode === 'group' && styles.tabButtonSelected,
            ]}
            onPress={() => setMode('group')}>
            <Text
              style={[
                styles.tabText,
                mode === 'group' && styles.tabTextSelected,
              ]}>
              그룹 랭킹
            </Text>
          </TouchableOpacity>
        </View>

        {/* 날짜 영역 */}
        <View style={styles.dateRow}>
          <Text style={styles.arrow}>{'<'}</Text>
          <Text style={styles.dateText}>25.10.24~25.10.31</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </View>

        {/* 리스트 */}
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.avatar} />
              <View style={styles.cardTextArea}>
                <Text style={styles.name}>{item.name}</Text>
                {item.subtitle ? (
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                ) : null}
              </View>
              <Text style={styles.score}>{item.score}pt</Text>
            </View>
          )}
        />
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
  },
  icon: {fontSize: 18},
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4EBFF',
    borderRadius: 20,
    padding: 4,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
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
  avatar: {
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
});
