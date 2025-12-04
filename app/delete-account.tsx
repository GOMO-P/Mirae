import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import useAuth from '@/hooks/useAuth';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

const REASONS = [
  {id: 'unused', label: '사용하지 않는 앱'},
  {id: 'not_useful', label: '유용하지 않아요'},
  {id: 'hard_to_join', label: '스터디 가입이 어려워요'},
  {id: 'privacy_concern', label: '개인정보가 두려워요'},
  {id: 'other', label: '기타'},
];

export default function DeleteAccountScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {deleteAccount, logout, loading, error} = useAuth();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');

  const handleDelete = () => {
    if (!selectedReason) {
      Alert.alert('알림', '탈퇴 사유를 선택해주세요.');
      return;
    }

    if (selectedReason === 'other' && !otherReason.trim()) {
      Alert.alert('알림', '기타 사유를 입력해주세요.');
      return;
    }

    Alert.alert('회원탈퇴', '정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.', [
      {text: '취소', style: 'cancel'},
      {
        text: '탈퇴하기',
        style: 'destructive',
        onPress: async () => {
          const errorMsg = await deleteAccount();
          if (errorMsg === null) {
            // Success: Immediate redirect
            router.replace('/sign-in');
          } else if (errorMsg.includes('log in again')) {
            // Re-auth required: Force logout
            Alert.alert(
              '재로그인 필요',
              '보안을 위해 계정 삭제 전 본인 확인이 필요합니다.\n로그아웃됩니다. 다시 로그인 후 시도해주세요.',
              [
                {
                  text: '확인',
                  onPress: async () => {
                    await logout();
                    router.replace('/sign-in');
                  },
                },
              ],
            );
          } else {
            Alert.alert('오류', errorMsg);
          }
        },
      },
    ]);
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const cardBackgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>회원탈퇴</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Title */}
        <Text style={[styles.title, {color: textColor}]}>탈퇴하는 이유가 무엇인가요?</Text>

        {/* Reasons */}
        <View style={styles.reasonsContainer}>
          {REASONS.map(reason => (
            <TouchableOpacity
              key={reason.id}
              style={styles.reasonItem}
              onPress={() => setSelectedReason(reason.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.radioButton,
                  {borderColor: selectedReason === reason.id ? Colors.primary[500] : '#D1D5DB'},
                ]}>
                {selectedReason === reason.id && (
                  <View style={[styles.radioButtonInner, {backgroundColor: Colors.primary[500]}]} />
                )}
              </View>
              <Text style={[styles.reasonText, {color: secondaryTextColor}]}>{reason.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Reason Input */}
        {selectedReason === 'other' && (
          <View style={[styles.inputContainer, {borderColor}]}>
            <TextInput
              style={[styles.input, {color: textColor}]}
              value={otherReason}
              onChangeText={setOtherReason}
              multiline
              textAlignVertical="top"
              placeholder="사유를 입력해주세요"
              placeholderTextColor={secondaryTextColor}
            />
          </View>
        )}

        {/* Error Message */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, {backgroundColor}]}>
        <TouchableOpacity
          style={[styles.deleteButton, {opacity: loading ? 0.7 : 1}]}
          onPress={handleDelete}
          disabled={loading}>
          <Text style={styles.deleteButtonText}>{loading ? '처리중...' : '탈퇴하기'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
    width: 44,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.md,
  },
  reasonsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: Typography.fontSize.base,
  },
  inputContainer: {
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 150,
    marginTop: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
  },
  errorText: {
    color: Colors.error.main,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
  },
  deleteButton: {
    backgroundColor: Colors.error.main, // Red color for delete action
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});
