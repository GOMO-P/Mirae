import {Tabs} from 'expo-router';
import React from 'react';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({color}) => <IconSymbol size={28} name="safari" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({color}) => <IconSymbol size={28} name="message" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Group',
          tabBarIcon: ({color}) => <IconSymbol size={28} name="person.3" color={color} />,
        }}
        />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({color}) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({color}) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="memo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-cert"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-feed"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
