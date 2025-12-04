import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextLink from '@/components/ui/TextLink';
import useAuth from '@/hooks/useAuth';
import {Colors, Typography, Spacing} from '@/constants/design-tokens';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {grade} = useLocalSearchParams();
  const {signUp, loading, error, clearError} = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSignUp = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({name: '', email: '', password: '', confirmPassword: ''});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Attempt sign up
    const user = await signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });

    if (user) {
      // Navigate directly to home screen
      router.replace('/');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.primary.dark : Colors.text.primary.light;
  const secondaryTextColor = isDark ? Colors.text.secondary.dark : Colors.text.secondary.light;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, {color: textColor}]}>회원가입</Text>
            <Text style={[styles.subtitle, {color: secondaryTextColor}]}></Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={value => handleInputChange('name', value)}
              error={formErrors.name}
              leftIcon="person-outline"
              style={styles.input}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
              type="email"
              error={formErrors.email}
              leftIcon="mail-outline"
              style={styles.input}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={value => handleInputChange('password', value)}
              type="password"
              error={formErrors.password}
              leftIcon="lock-closed-outline"
              style={styles.input}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={value => handleInputChange('confirmPassword', value)}
              type="password"
              error={formErrors.confirmPassword}
              leftIcon="lock-closed-outline"
              style={styles.input}
            />

            {/* Firebase error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign Up Button */}
            <Button
              title="Sign Up"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.signUpButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, {color: secondaryTextColor}]}>
              Already have an account?{' '}
            </Text>
            <TextLink href="/(tabs)">Sign In</TextLink>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.lg,
  },
  errorContainer: {
    backgroundColor: Colors.error.light + '20',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.error.dark,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  signUpButton: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: Typography.fontSize.base,
  },
});
