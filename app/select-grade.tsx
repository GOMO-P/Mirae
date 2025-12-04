import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, useColorScheme} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

const GRADES = [
  {id: '1', label: '1학년'},
  {id: '2', label: '2학년'},
  {id: '3', label: '3학년'},
  {id: '4', label: '4학년'},
  {id: 'grad', label: '대학원생'},
];

export default function SelectGradeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedGrade) {
      router.push({
        pathname: '/sign-up',
        params: {grade: selectedGrade},
      });
    }
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;
  const cardBackgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      <View style={styles.content}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, {backgroundColor: Colors.primary[500]}]} />
          <View
            style={[styles.progressBarBackground, {backgroundColor: isDark ? '#333' : '#E5E7EB'}]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, {color: textColor}]}>학년을 선택해주세요</Text>
          <Text style={[styles.subtitle, {color: secondaryTextColor}]}>Choose your grade.</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {GRADES.map(grade => {
            const isSelected = selectedGrade === grade.id;
            return (
              <TouchableOpacity
                key={grade.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#1A2F4B'
                        : '#EBF5FF'
                      : cardBackgroundColor,
                    borderColor: isSelected ? Colors.primary[500] : borderColor,
                  },
                ]}
                onPress={() => setSelectedGrade(grade.id)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? (isDark ? '#60A5FA' : '#1F2937') : textColor,
                    },
                  ]}>
                  {grade.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={20} color={Colors.primary[500]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <View style={styles.footer}>
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!selectedGrade}
            fullWidth
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 6,
    marginBottom: Spacing['2xl'],
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%', // Assuming this is step 1 of 2 (or similar)
    borderRadius: 3,
    zIndex: 1,
  },
  progressBarBackground: {
    flex: 1,
    borderRadius: 3,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'], // Slightly smaller than 3xl to match design
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
  },
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  footer: {
    marginTop: 'auto',
  },
  nextButton: {
    height: 56, // Match design button height
  },
});
