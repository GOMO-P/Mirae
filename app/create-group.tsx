import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {storage} from '@/config/firebase';

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
  const [groupImage, setGroupImage] = useState<string>('');
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
    setGroupImage('');
  };

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    try {
      // URI에서 blob 생성
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 고유한 파일명 생성
      const filename = `group-images/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);
      
      // Firebase Storage에 업로드
      await uploadBytes(storageRef, blob);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  };

  const handlePickImage = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) {
      Alert.alert('필수 입력', '그룹 이름과 설명을 입력해주세요.');
      return;
    }

    console.log('🚀 그룹 생성 시작');
    setLoading(true);

    try {
      let imageUrl = '';
      
      // 이미지가 선택되었다면 Firebase Storage에 업로드
      if (groupImage) {
        console.log('📸 이미지 업로드 중...');
        imageUrl = await uploadImageToStorage(groupImage);
        console.log('✅ 이미지 업로드 완료:', imageUrl);
      }

      await addGroup({
        name: groupName,
        description: groupDescription,
        categories: selectedCategories,
        maxMembers: 50,
        isMonthly: false,
        imageUrl: imageUrl,
      });

      console.log('✅ 그룹 생성 완료, 가입 완료 화면으로 이동');

      // 가입 완료 화면으로 이동
      router.push('/join-complete');
    } catch (e) {
      console.error('❌ handleCreateGroup 에러:', e);
      Alert.alert('오류', '그룹 생성 중 오류가 발생했습니다.');
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
        {/* 그룹 이미지 선택 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>그룹 이미지</Text>
          <TouchableOpacity style={styles.imagePickerContainer} onPress={handlePickImage}>
            {groupImage ? (
              <Image source={{uri: groupImage}} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={Colors.neutral[400]} />
                <Text style={styles.imagePlaceholderText}>이미지 선택</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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
          </View>
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
  imagePickerContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[500],
  },
});
