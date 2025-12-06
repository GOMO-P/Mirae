import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {AuthProvider} from '@/contexts/AuthContext';
// ✅ GroupProvider 추가
import {GroupProvider} from '@/contexts/GroupContext';
import {NotificationListener} from '@/components/NotificationListener';

import {useEffect} from 'react';
import {useSegments, useRouter} from 'expo-router';
import {useAuthContext} from '@/contexts/AuthContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const {user, loading} = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  // 기존 인증 보호 로직 유지
  useEffect(() => {
    if (loading) return;

    const inAuthGroup =
      segments[0] === 'sign-in' || segments[0] === 'sign-up' || segments[0] === 'select-grade';

    // segments[0] === '(tabs)' 확인 로직은 필요하다면 유지, 아니면 생략 가능
    // const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // 로그인이 안 되어 있는데 보호된 라우트에 접근 시
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      // 로그인이 되어 있는데 로그인/회원가입 화면 접근 시
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 기존 화면들 */}
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen name="sign-in" options={{headerShown: false}} />
        <Stack.Screen name="sign-up" options={{headerShown: false}} />
        <Stack.Screen name="select-grade" options={{headerShown: false}} />
        <Stack.Screen name="profile-management" options={{headerShown: false}} />
        <Stack.Screen name="delete-account" options={{headerShown: false}} />
        <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}} />

        {/* ✅ 추가된 그룹 관련 화면들 */}
        <Stack.Screen name="create-group" options={{headerShown: false}} />
        <Stack.Screen name="group-list" options={{headerShown: false}} />
        <Stack.Screen name="group-detail" options={{headerShown: false}} />
        <Stack.Screen name="chat/[id]" options={{headerShown: false}} />

        {/* ✅ 설정 관련 화면들 */}
        <Stack.Screen name="customer-center" options={{headerShown: false}} />
        <Stack.Screen name="notifications" options={{headerShown: false}} />
        <Stack.Screen name="privacy" options={{headerShown: false}} />
        <Stack.Screen name="language" options={{headerShown: false}} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* ✅ AuthProvider 안쪽에 GroupProvider 배치 (User 정보가 필요할 수 있으므로) */}
      <GroupProvider>
        <NotificationListener />
        <RootLayoutNav />
      </GroupProvider>
    </AuthProvider>
  );
}
