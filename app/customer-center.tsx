import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';

export default function CustomerCenterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>앱 가이드</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {/* 1. 회원 관리 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>1. 회원 관리</Text>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>회원가입 및 로그인</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              학교 이메일(@대학교.ac.kr)을 사용하여 회원가입을 진행합니다. 가입 후 이메일과
              비밀번호로 로그인하여 서비스를 이용할 수 있습니다.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>프로필 관리</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              설정 탭의 '프로필 편집' 메뉴에서 닉네임과 프로필 사진을 변경할 수 있습니다. 닉네임은
              한글, 영문, 숫자를 조합하여 2~10자로 설정 가능합니다.
            </Text>
          </View>
        </View>

        {/* 2. 그룹 활동 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>2. 그룹 활동</Text>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>그룹 생성</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              홈 화면의 '+' 버튼을 눌러 새로운 챌린지나 스터디 그룹을 생성할 수 있습니다. 그룹 이름,
              설명, 최대 인원 등을 설정하여 동료를 모집해보세요.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>그룹 참여</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              탐색 탭에서 관심 있는 그룹을 검색하고 참여를 신청할 수 있습니다. 그룹장의 승인이
              완료되면 그룹원으로 활동을 시작하게 됩니다.
            </Text>
          </View>
        </View>

        {/* 3. 인증 시스템 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>3. 인증 시스템</Text>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>인증 게시</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              목표 달성을 증명하기 위해 사진과 텍스트로 인증글을 게시합니다. 꾸준한 인증은 달성률을
              높이고 랭킹에 반영됩니다.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>인증 피드</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              다른 그룹원들의 인증 현황을 피드에서 실시간으로 확인할 수 있습니다. 서로의 활동을
              응원하며 동기부여를 얻으세요.
            </Text>
          </View>
        </View>

        {/* 4. 소통 및 알림 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>4. 소통 및 알림</Text>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>그룹 채팅</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              그룹원들과 실시간 채팅을 통해 정보를 공유하고 소통할 수 있습니다. 중요한 공지사항은
              그룹장이 별도로 등록할 수 있습니다.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Text style={[styles.guideLabel, {color: textColor}]}>알림 설정</Text>
            <Text style={[styles.guideDesc, {color: secondaryTextColor}]}>
              설정의 '알림 설정' 메뉴에서 채팅, 팔로우, 그룹 가입 등 다양한 알림을 켜거나 끌 수
              있습니다.
            </Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: Spacing.sm,
  },
  guideItem: {
    marginBottom: Spacing.lg,
  },
  guideLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 6,
  },
  guideDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
  },
});
