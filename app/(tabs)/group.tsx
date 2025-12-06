import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useGroupContext} from '@/contexts/GroupContext';
import {Ionicons} from '@expo/vector-icons';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import Avatar from '@/components/ui/Avatar';

export default function GroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {getMyGroups} = useGroupContext();
  const myGroups = getMyGroups();

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/group-chat',
      params: {id: groupId},
    });
  };

  const renderGroupItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={[styles.groupCard, {backgroundColor: isDark ? Colors.background.paper.dark : '#FFFFFF'}]}
      onPress={() => handleGroupPress(item.id)}
      activeOpacity={0.7}>
      <Avatar name={item.name} imageUri={item.imageUrl} size="md" />
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, {color: textColor}]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.groupDescription, {color: secondaryTextColor}]} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={[styles.memberCount, {color: secondaryTextColor}]}>
          {item.currentMembers}명
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: textColor}]}>내 그룹</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/group-list')}>
          <Ionicons name="add" size={28} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* 그룹 목록 */}
      {myGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={secondaryTextColor} />
          <Text style={[styles.emptyText, {color: secondaryTextColor}]}>
            참여 중인 그룹이 없습니다
          </Text>
          <TouchableOpacity
            style={styles.findGroupButton}
            onPress={() => router.push('/group-list')}>
            <Text style={styles.findGroupButtonText}>그룹 찾아보기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myGroups}
          renderItem={renderGroupItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  addButton: {
    padding: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs / 2,
  },
  groupInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  groupName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: Typography.fontSize.xs,
    marginBottom: 2,
  },
  memberCount: {
    fontSize: Typography.fontSize.xs,
  },
  separator: {
    height: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  findGroupButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  findGroupButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
