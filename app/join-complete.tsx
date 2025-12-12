import React, {useLayoutEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useNavigation} from 'expo-router';
import Button from '@/components/ui/Button';
import GroupListItem from '@/components/ui/GroupListItem';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

export default function JoinCompleteScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // 헤더 숨김
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleContinue = () => {
    // 홈(Explore)으로 돌아가기
    router.dismissAll();
    router.replace('/(tabs)');
  };

  const handleCancel = () => {
    router.dismissAll();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>참가 완료</Text>
        <View style={{width: 50}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stepper (단계 표시) */}
        <View style={styles.stepperContainer}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>지원서 작성</Text>
          </View>

          {/* Line */}
          <View style={styles.stepLine} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>참가 완료</Text>
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.mainMessage}>정상적으로 스터디 지원이 완료되었어요 ✅</Text>
          <Text style={styles.subMessage}>스터디 가입 완료되었어요!</Text>
        </View>

        {/* Recommendation Section */}
        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>이런 스터디 그룹은 어떠세요?</Text>

          {RECOMMENDED_GROUPS.map(group => (
            <GroupListItem
              key={group.id}
              group={group}
              onPress={() => {}} // 추천 그룹 클릭 시 동작 (필요 시 구현)
              isDark={false} // 배경이 흰색이므로 라이트 모드 스타일 적용
            />
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + Spacing.md}]}>
        <Button title="Continue" onPress={handleContinue} fullWidth size="md" />
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
  cancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary[600],
    fontWeight: '500',
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['4xl'],
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    backgroundColor: '#E0E0E0',
  },
  stepActive: {
    backgroundColor: Colors.primary[600], // 파란색 활성화
    // 스크린샷처럼 체크 아이콘 배경색
  },
  stepText: {
    fontSize: Typography.fontSize.xs,
    color: '#999',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F0F0F0',
    marginHorizontal: -10, // 원 뒤로 선이 지나가도록 조정하거나 간격 좁힘
    marginBottom: 20, // 텍스트 높이 고려하여 위로 올림
    maxWidth: 80, // 선 길이 제한
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  mainMessage: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#333',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subMessage: {
    fontSize: Typography.fontSize.base,
    color: '#888',
    textAlign: 'center',
  },
  recommendationSection: {
    marginTop: Spacing.lg,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    color: '#333',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
