import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {AuthProvider} from '@/contexts/AuthContext';

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

  useEffect(() => {
    if (loading) return;

    const inAuthGroup =
      segments[0] === '(auth)' ||
      segments[0] === 'sign-in' ||
      segments[0] === 'sign-up' ||
      segments[0] === 'select-grade';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // If not logged in and trying to access protected route, redirect to sign-in
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      // If logged in and trying to access auth screens, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen name="sign-in" options={{headerShown: false}} />
        <Stack.Screen name="sign-up" options={{headerShown: false}} />
        <Stack.Screen name="select-grade" options={{headerShown: false}} />
        <Stack.Screen name="profile-management" options={{headerShown: false}} />
        <Stack.Screen name="delete-account" options={{headerShown: false}} />
        <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
