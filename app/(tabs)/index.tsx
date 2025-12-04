import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthContext} from '@/contexts/AuthContext';
import {useRouter} from 'expo-router';
import GroupCard from '@/components/ui/GroupCard';
import SearchBar from '@/components/ui/SearchBar';
import {Colors, Typography, Spacing} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

// Mock data for groups
const MOCK_GROUPS_MONTHLY = [
  {
    id: '1',
    name: '일상생활에서 자유롭게',
    description: '일상기록, 여행, 취미 공유',
    memberCount: 20,
    category: '커뮤니티',
  },
  {
    id: '2',
    name: '독서 모임',
    description: '책을 읽고 토론하는 모임',
    memberCount: 10,
    category: '독서',
  },
];

const MOCK_GROUPS_POPULAR = [
  {
    id: '3',
    name: '넥슨게임 팀원구해요',
    description: '넥슨게임 팀원 모집',
    memberCount: 48,
    category: '게임',
  },
  {
    id: '4',
    name: '경기자치대학 동아리',
    description: '경기자치대학 학생 모임',
    memberCount: 27,
    category: '학교',
  },
  {
    id: '5',
    name: '해외 음악 감상 사랑',
    description: '해외음악 감상',
    memberCount: 27,
    category: '음악',
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {user} = useAuthContext();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  const handleGroupPress = (groupId: string) => {
    // Navigate to group detail screen (to be implemented)
    console.log('Group pressed:', groupId);
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: textColor}]}>Explore</Text>
          <TouchableOpacity onPress={handleCreateGroup} style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color={Colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <SearchBar
          placeholder="그룹 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleSearchPress}
          style={styles.searchBar}
        />

        {/* 이달의 그룹 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>이달의 그룹</Text>
            <TouchableOpacity>
              <Text style={[styles.seeMore, {color: Colors.primary[600]}]}>See more</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupList}>
            {MOCK_GROUPS_MONTHLY.map(group => (
              <GroupCard key={group.id} {...group} onPress={() => handleGroupPress(group.id)} />
            ))}
          </ScrollView>
        </View>

        {/* 인기있는 그룹 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>인기있는 그룹</Text>
            <TouchableOpacity>
              <Text style={[styles.seeMore, {color: Colors.primary[600]}]}>See more</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupList}>
            {MOCK_GROUPS_POPULAR.map(group => (
              <GroupCard key={group.id} {...group} onPress={() => handleGroupPress(group.id)} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  addButton: {
    padding: Spacing.sm,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  seeMore: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  groupList: {
    paddingLeft: Spacing.lg,
  },
});
