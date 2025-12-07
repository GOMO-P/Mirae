import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useGroupContext} from '@/contexts/GroupContext';
import {useAuthContext} from '@/contexts/AuthContext';
import {Ionicons} from '@expo/vector-icons';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import Avatar from '@/components/ui/Avatar';
import {collection, query, where, onSnapshot} from 'firebase/firestore';
import {db} from '@/config/firebase';

export default function GroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {getMyGroups, groups} = useGroupContext();
  const {user} = useAuthContext();
  const myGroups = getMyGroups();
  const [applicationCounts, setApplicationCounts] = useState<{[groupId: string]: number}>({});

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  // 지원서 수 실시간 구독 (생성자인 그룹만)
  useEffect(() => {
    if (!user || myGroups.length === 0) return;

    const myCreatedGroups = myGroups.filter(g => g.createdBy === user.uid);
    if (myCreatedGroups.length === 0) return;

    const unsubscribes = myCreatedGroups.map(group => {
      const q = query(
        collection(db, 'groupApplications'),
        where('groupId', '==', group.id),
        where('status', '==', 'pending'),
      );

      return onSnapshot(q, snapshot => {
        setApplicationCounts(prev => ({
          ...prev,
          [group.id]: snapshot.size,
        }));
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, myGroups.length]);

  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/group-chat',
      params: {id: groupId},
    });
  };

  const renderGroupItem = ({item}: {item: any}) => {
    const isCreator = item.createdBy === user?.uid;
    const appCount = applicationCounts[item.id] || 0;
    
    return (
      <TouchableOpacity
        style={[styles.groupCard, {backgroundColor: isDark ? Colors.background.paper.dark : '#FFFFFF'}]}
        onPress={() => handleGroupPress(item.id)}
        activeOpacity={0.7}>
        <Avatar name={item.name} imageUri={item.imageUrl} size="md" />
        <View style={styles.groupInfo}>
          <View style={styles.groupNameRow}>
            <Text style={[styles.groupName, {color: textColor}]} numberOfLines={1}>
              {item.name}
            </Text>
            {isCreator && appCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{appCount}</Text>
              </View>
            )}
          </View>
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
  };

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
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  badge: {
    backgroundColor: Colors.primary[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
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
