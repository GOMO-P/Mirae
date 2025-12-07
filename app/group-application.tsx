import React, {useState, useLayoutEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useNavigation, useLocalSearchParams} from 'expo-router';
import Button from '@/components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import {useGroupContext} from '@/contexts/GroupContext';
import {useAuthContext} from '@/contexts/AuthContext';

const DAYS = [
  {id: 'mon', en: 'MO', kr: '월'},
  {id: 'tue', en: 'TU', kr: '화'},
  {id: 'wed', en: 'WE', kr: '수'},
  {id: 'thu', en: 'TH', kr: '목'},
  {id: 'fri', en: 'FR', kr: '금'},
  {id: 'sat', en: 'SA', kr: '토'},
  {id: 'sun', en: 'SU', kr: '일'},
];

export default function GroupApplicationScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {id} = useLocalSearchParams<{id: string}>();
  const {joinGroup} = useGroupContext();
  const {user} = useAuthContext();

  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [intro, setIntro] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSubmit = async () => {
    if (!name || !major || !intro) {
      Alert.alert('알림', '모든 정보를 입력해주세요.');
      return;
    }

    if (!id) {
      Alert.alert('오류', '그룹 정보를 찾을 수 없습니다.');
      return;
    }

    if (!user) {
      Alert.alert('로그인 필요', '지원서를 제출하려면 로그인이 필요합니다.');
      return;
    }

    setLoading(true);

    try {
      const {addDoc, collection, serverTimestamp} = await import('firebase/firestore');
      const {db} = await import('@/config/firebase');

      await addDoc(collection(db, 'groupApplications'), {
        groupId: id,
        userId: user.uid,
        name: name,
        major: major,
        intro: intro,
        availableDays: selectedDays,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert('제출 완료', '지원서가 제출되었습니다. 승인을 기다려주세요.');
      router.back();
    } catch (error) {
      console.error('지원서 제출 실패:', error);
      setLoading(false);
      Alert.alert('오류', '지원서 제출에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스터디 지원서</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={Colors.primary[300]} />
            <View style={styles.plusIcon}>
              <Ionicons name="add" size={16} color="white" />
            </View>
          </View>

          <View style={styles.inputColumn}>
            <View style={styles.smallInputWrapper}>
              <TextInput
                style={styles.smallInput}
                placeholder="이름"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.smallInputWrapper}>
              <TextInput
                style={styles.smallInput}
                placeholder="학과/트랙"
                value={major}
                onChangeText={setMajor}
              />
            </View>
          </View>
        </View>

        {/* Days Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>활동 참여 가능 요일</Text>
          <View style={styles.daysContainer}>
            {DAYS.map(day => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => toggleDay(day.id)}>
                  <Text style={[styles.dayEn, isSelected && styles.dayTextSelected]}>{day.en}</Text>
                  <Text style={[styles.dayKr, isSelected && styles.dayTextSelected]}>{day.kr}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>소개</Text>
          <TextInput
            style={styles.introInput}
            placeholder="본인에 대한 소개를 해주세요!"
            multiline
            textAlignVertical="top"
            value={intro}
            onChangeText={setIntro}
          />
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + Spacing.md}]}>
        <Button title="지원하기" onPress={handleSubmit} fullWidth loading={loading} size="md" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#333',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    position: 'relative',
  },
  plusIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  smallInputWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  smallInput: {
    fontSize: Typography.fontSize.base,
    color: '#333',
    padding: 0,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary[600],
    borderRadius: 20,
  },
  dayEn: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
  },
  dayKr: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
  },
  introInput: {
    borderWidth: 1,
    borderColor: Colors.primary[600],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 200,
    fontSize: Typography.fontSize.base,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
