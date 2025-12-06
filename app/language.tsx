import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';

export default function LanguageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  const languages = [
    {id: 'ko', label: '한국어'},
    {id: 'en', label: 'English'},
    {id: 'zh', label: '中文'},
    {id: 'ja', label: '日本語'},
    {id: 'pt', label: 'Português'},
    {id: 'es', label: 'Español'},
    {id: 'de', label: 'Deutsch'},
    {id: 'fr', label: 'Français'},
    {id: 'ar', label: 'العربية'},
  ];

  const handleLanguagePress = (label: string) => {
    Alert.alert('알림', '해당 서비스는 준비중입니다.');
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: textColor}]}>언어</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {languages.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {borderBottomColor: borderColor},
                index === languages.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleLanguagePress(item.label)}>
              <Text style={[styles.menuText, {color: textColor}]}>{item.label}</Text>
              {item.id === 'ko' && (
                <Ionicons name="checkmark" size={20} color={Colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
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
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
  },
});
