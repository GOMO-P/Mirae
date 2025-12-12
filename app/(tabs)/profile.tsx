import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthContext} from '@/contexts/AuthContext';
import {useRouter, usePathname} from 'expo-router';
import useAuth from '@/hooks/useAuth';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';
import * as Device from 'expo-device';
import {userService} from '@/services/userService';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {user} = useAuthContext();
  const {logout} = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);

  // 화면 진입 시 및 다른 화면에서 돌아올 때 프로필 로드
  useEffect(() => {
    if (user?.uid && pathname === '/profile') {
      loadUserProfile();
    }
  }, [user?.uid, pathname]);

  const loadUserProfile = async () => {
    if (!user?.uid) return;
    const profile = await userService.getUserProfile(user.uid);
    if (profile?.photoURL) {
      setPhotoURL(profile.photoURL);
    }
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  const userName = user?.displayName || 'user';
  const userTag = user?.email?.split('@')[0] || 'user';

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    const success = await logout();
    if (success) {
      router.replace('/sign-in');
    }
  };

  const menuItems = [
    {id: 'edit-profile', label: '프로필 편집', icon: 'chevron-forward'},
    {id: 'devices', label: '사용 중인 장치', icon: 'chevron-forward'},
    {id: 'notifications', label: '알림 설정', icon: 'chevron-forward'},
    {id: 'language', label: '언어', icon: 'chevron-forward'},
    {id: 'customer-center', label: '앱 가이드', icon: 'chevron-forward'},
    {id: 'privacy', label: '개인정보 및 보안', icon: 'chevron-forward'},
    {id: 'delete-account', label: '회원탈퇴', icon: 'chevron-forward'},
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: textColor}]}>설정</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={photoURL ? {uri: photoURL} : require('@/assets/images/react-logo.png')}
              style={styles.avatar}
            />
          </View>
          <Text style={[styles.userName, {color: textColor}]}>{userName}</Text>
          <Text style={[styles.userTag, {color: secondaryTextColor}]}>@{userTag}</Text>
        </View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {borderBottomColor: borderColor},
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => {
                if (item.id === 'delete-account') {
                  router.push('/delete-account');
                } else if (item.id === 'edit-profile') {
                  router.push('/profile-management');
                } else if (item.id === 'devices') {
                  setDeviceModalVisible(true);
                } else if (item.id === 'privacy') {
                  router.push('/privacy');
                } else if (item.id === 'language') {
                  router.push('/language');
                } else if (item.id === 'notifications') {
                  router.push('/notifications');
                } else if (item.id === 'customer-center') {
                  router.push('/customer-center');
                }
              }}>
              <Text style={[styles.menuText, {color: textColor}]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>로그아웃 하시겠어요?</Text>
            <Text style={styles.modalMessage}>
              로그아웃 하시면 앱을 사용하려면 다시{'\n'}로그인 해야해요!
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmLogout}>
                <Text style={styles.modalConfirmButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Device Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deviceModalVisible}
        onRequestClose={() => setDeviceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>내 기기 정보</Text>
            <View style={{marginBottom: 20, width: '100%'}}>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                <Text style={{color: '#666'}}>모델명</Text>
                <Text style={{fontWeight: '600'}}>{Device.modelName || 'Unknown'}</Text>
              </View>
              <View
                style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                <Text style={{color: '#666'}}>제조사</Text>
                <Text style={{fontWeight: '600'}}>{Device.manufacturer || 'Unknown'}</Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={{color: '#666'}}>OS</Text>
                <Text style={{fontWeight: '600'}}>
                  {Device.osName} {Device.osVersion}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={() => setDeviceModalVisible(false)}>
              <Text style={styles.modalConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E1E1E1', // Placeholder color
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[500],
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  userTag: {
    fontSize: Typography.fontSize.sm,
  },
  menuContainer: {
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
  },
  logoutContainer: {
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  logoutButton: {
    backgroundColor: Colors.error.main, // Red color
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: Spacing.xl,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    color: '#000',
  },
  modalMessage: {
    fontSize: Typography.fontSize.base,
    color: '#666',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary[500],
  },
  modalCancelButtonText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
