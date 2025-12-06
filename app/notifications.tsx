import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  const [chatNotification, setChatNotification] = useState(true);
  const [followNotification, setFollowNotification] = useState(true);
  const [groupJoinNotification, setGroupJoinNotification] = useState(true);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>알림 설정</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {/* 채팅 알림 */}
          <View style={[styles.menuItem, {borderBottomColor: borderColor}]}>
            <Text style={[styles.menuText, {color: textColor}]}>채팅 알림</Text>
            <Switch
              value={chatNotification}
              onValueChange={setChatNotification}
              trackColor={{false: '#767577', true: Colors.primary[500]}}
              thumbColor={chatNotification ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* 팔로우 알림 */}
          <View style={[styles.menuItem, {borderBottomColor: borderColor}]}>
            <Text style={[styles.menuText, {color: textColor}]}>팔로우 알림</Text>
            <Switch
              value={followNotification}
              onValueChange={setFollowNotification}
              trackColor={{false: '#767577', true: Colors.primary[500]}}
              thumbColor={followNotification ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* 그룹 스터디 가입 알림 */}
          <View style={[styles.menuItem, {borderBottomColor: borderColor, borderBottomWidth: 0}]}>
            <Text style={[styles.menuText, {color: textColor}]}>그룹 스터디 가입 알림</Text>
            <Switch
              value={groupJoinNotification}
              onValueChange={setGroupJoinNotification}
              trackColor={{false: '#767577', true: Colors.primary[500]}}
              thumbColor={groupJoinNotification ? '#fff' : '#f4f3f4'}
            />
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
  menuContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
  },
});
