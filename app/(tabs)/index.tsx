import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import GroupCard from '@/components/ui/GroupCard';
import SearchBar from '@/components/ui/SearchBar';
import {Colors, Typography, Spacing} from '@/constants/design-tokens';

// ✅ Context Hook 추가
import {useGroupContext} from '@/contexts/GroupContext';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Context에서 데이터 가져오기
  const {getMonthlyGroups, getPopularGroups} = useGroupContext();

  // 실제 데이터 로드
  const monthlyGroups = getMonthlyGroups();
  const popularGroups = getPopularGroups();

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;

  // 그룹 상세 페이지로 이동
  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/group-detail',
      params: {id: groupId},
    });
  };

  // 검색 페이지로 이동
  const handleSearchPress = () => {
    router.push({
      pathname: '/group-list',
      params: {title: '미래관 그룹 가입'},
    });
  };

  // 그룹 생성 페이지로 이동
  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  // 'See more' 클릭 시 목록 페이지로 이동 (기능 보강)
  const handleSeeMore = (title: string, type: 'monthly' | 'popular') => {
    router.push({
      pathname: '/group-list',
      params: {type, title},
    });
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
          onFocus={handleSearchPress} // 포커스 시 검색 페이지로 이동
          style={styles.searchBar}
        />

        {/* 이달의 그룹 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>이달의 그룹</Text>
            <TouchableOpacity onPress={() => handleSeeMore('이달의 그룹', 'monthly')}>
              <Text style={[styles.seeMore, {color: Colors.primary[600]}]}>See more</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupList}>
            {monthlyGroups && monthlyGroups.length > 0 ? (
              monthlyGroups.map(group => (
                <GroupCard
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  description={group.description}
                  // ✅ Firebase 데이터 필드 매핑
                  memberCount={group.currentMembers || 0}
                  // 카테고리가 배열이므로 첫 번째 요소를 가져오고, 없으면 '기타' 표시
                  category={group.categories?.[0] || '기타'}
                  onPress={() => handleGroupPress(group.id)}
                />
              ))
            ) : (
              // 데이터가 없을 때 표시할 UI (선택사항)
              <Text style={{marginLeft: Spacing.lg, color: Colors.text.secondary.light}}>
                등록된 그룹이 없습니다.
              </Text>
            )}
          </ScrollView>
        </View>

        {/* 인기있는 그룹 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>인기있는 그룹</Text>
            <TouchableOpacity onPress={() => handleSeeMore('인기있는 그룹', 'popular')}>
              <Text style={[styles.seeMore, {color: Colors.primary[600]}]}>See more</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupList}>
            {popularGroups && popularGroups.length > 0 ? (
              popularGroups.map(group => (
                <GroupCard
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  description={group.description}
                  // ✅ Firebase 데이터 필드 매핑
                  memberCount={group.currentMembers || 0}
                  category={group.categories?.[0] || '기타'}
                  onPress={() => handleGroupPress(group.id)}
                />
              ))
            ) : (
              <Text style={{marginLeft: Spacing.lg, color: Colors.text.secondary.light}}>
                인기 그룹이 없습니다.
              </Text>
            )}
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
    paddingBottom: Spacing.md, // 기존 스타일 유지
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
