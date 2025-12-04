import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {Collapsible} from '@/components/ui/collapsible';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {useGroupContext} from '@/contexts/GroupContext';

// CategoryChip Component
const CategoryChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = selected ? Colors.primary[600] : isDark ? '#333' : '#F0F0F0';
  const textColor = selected ? '#FFF' : isDark ? '#FFF' : '#333';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: backgroundColor,
        marginRight: 8,
        marginBottom: 8,
      }}>
      <Text style={{color: textColor, fontSize: 14, fontWeight: '500'}}>{label}</Text>
    </TouchableOpacity>
  );
};

const CATEGORIES = [
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

export default function CreateGroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {addGroup} = useGroupContext();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;

  const handleToggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
    );
  };

  const handleCancel = () => {
    router.back();
  };

  const handleReset = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedCategories([]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) {
      Alert.alert('필수 입력', '그룹 이름과 설명을 입력해주세요.');
      return;
    }

    console.log('🚀 그룹 생성 시작');
    setLoading(true);

    try {
      await addGroup({
        name: groupName,
        description: groupDescription,
        categories: selectedCategories,
        maxMembers: 50,
        isMonthly: false,
        imageUrl: '',
      });

      console.log('✅ 그룹 생성 완료, 화면 이동');

      // Alert는 addGroup 내부에서 이미 표시되므로 제거
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('❌ handleCreateGroup 에러:', e);
      // 에러는 addGroup에서 이미 Alert로 표시됨
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      <Stack.Screen options={{headerShown: false}} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerButtonText, {color: Colors.primary[600]}]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>그룹 생성</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={[styles.headerButtonText, {color: Colors.primary[600]}]}>초기화</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          label="그룹 이름"
          placeholder="그룹 이름을 입력하세요"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />
        <Input
          label="그룹 소개"
          placeholder="어떤 그룹인지 자세히 설명해주세요"
          value={groupDescription}
          onChangeText={setGroupDescription}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <View style={styles.section}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>카테고리</Text>
            <View style={styles.categoryCountBadge}>
              <Text style={styles.categoryCountText}>{selectedCategories.length}</Text>
            </View>
          </View>

          <View style={styles.chipContainer}>
            {CATEGORIES.map(category => (
              <CategoryChip
                key={category}
                label={category}
                selected={selectedCategories.includes(category)}
                onPress={() => handleToggleCategory(category)}
              />
            ))}
            <TouchableOpacity style={styles.plusButton}>
              <Ionicons name="add" size={20} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Collapsible title="고급 설정">
            <Text style={[styles.collapsibleContent, {color: isDark ? '#999' : '#666'}]}>
              프라이빗 설정, 최대 인원수, 가입 승인 방식 등을 설정하는 영역입니다. (추후 구현)
            </Text>
          </Collapsible>
        </View>

        <View style={{height: Spacing.xl}} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor,
            paddingBottom: insets.bottom > 0 ? insets.bottom + Spacing.sm : Spacing.lg,
          },
        ]}>
        <Button
          title="그룹 생성"
          onPress={handleCreateGroup}
          loading={loading}
          fullWidth
          size="md"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.neutral[300],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  input: {marginBottom: Spacing.md},
  section: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.sm,
  },
  categoryCountBadge: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCountText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  collapsibleContent: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.neutral[300],
  },
});
