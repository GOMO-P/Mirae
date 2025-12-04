import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import GroupListItem from '@/components/ui/GroupListItem';
import CategoryChip from '@/components/ui/CategoryChip';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/constants/design-tokens';
import {useGroupContext} from '@/contexts/GroupContext';

// 필터링에 사용할 카테고리 목록
const FILTER_CATEGORIES = [
  '커뮤니티',
  '독서',
  '게임',
  '학교',
  '음악',
  '자격증',
  '취미',
  '갓생',
  '열공',
  '생활',
  '음식',
  '토익',
];

export default function GroupListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams<{type: string; title: string}>();

  // ✅ Context에서 전체 그룹과 필터 함수 가져오기
  const {groups, getMonthlyGroups, getPopularGroups} = useGroupContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [baseGroups, setBaseGroups] = useState<any[]>([]); // 타입 필터링 된 원본 데이터
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]); // 검색/카테고리 필터링 된 최종 데이터

  const screenTitle = params.title || '그룹 목록';

  // 1단계: URL 파라미터(type)에 따른 기본 리스트 설정
  useEffect(() => {
    let data = groups;

    if (params.type === 'monthly') {
      // '이달의 그룹' See more 클릭 시
      data = getMonthlyGroups();
    } else if (params.type === 'popular') {
      // '인기있는 그룹' See more 클릭 시
      data = getPopularGroups();
    }
    // '미래관 그룹 가입' 또는 다른 경로 -> 전체 리스트 (groups)

    setBaseGroups(data);
  }, [groups, params.type, getMonthlyGroups, getPopularGroups]);

  // 2단계: 검색 및 카테고리 필터링
  useEffect(() => {
    const newFilteredGroups = baseGroups.filter(group => {
      // 1. 검색어 필터링
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. 카테고리 필터링
      const matchesCategory = selectedCategory
        ? group.categories && group.categories.includes(selectedCategory)
        : true;

      return matchesSearch && matchesCategory;
    });

    setFilteredGroups(newFilteredGroups);
  }, [baseGroups, searchQuery, selectedCategory]);

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const iconColor = isDark ? Colors.text.primary.dark : Colors.primary[600];

  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/group-detail',
      params: {id: groupId},
    });
  };

  const renderItem = ({item}: {item: any}) => (
    <GroupListItem group={item} onPress={() => handleGroupPress(item.id)} isDark={isDark} />
  );

  const searchContainerBackgroundColor = isDark ? Colors.background.paper.dark : '#F5F5F5';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
        <Stack.Screen options={{headerShown: false}} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>{screenTitle}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: searchContainerBackgroundColor,
            },
          ]}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.text.secondary[isDark ? 'dark' : 'light']}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {color: textColor}]}
            placeholder="Search"
            placeholderTextColor={Colors.text.secondary[isDark ? 'dark' : 'light']}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>

        {/* 카테고리 필터 (가로 스크롤) */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContent}>
            {/* '전체' 칩 */}
            <CategoryChip
              label="전체"
              selected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {/* 나머지 카테고리 칩들 */}
            {FILTER_CATEGORIES.map(cat => (
              <CategoryChip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Group List */}
        <FlatList
          data={filteredGroups}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  {color: Colors.text.secondary[isDark ? 'dark' : 'light']},
                ]}>
                검색 결과가 없습니다.
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  backButton: {
    paddingRight: Spacing.md,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  placeholder: {width: 28},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
  },
  searchIcon: {marginRight: Spacing.sm},
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    paddingVertical: 0,
  },
  categoryContainer: {
    marginBottom: Spacing.sm,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
    gap: 4, // 카테고리 칩 간격
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: Spacing.sm,
  },
  emptyContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
});
