import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextLink from '@/components/ui/TextLink';
import useAuth from '@/hooks/useAuth';
import {Colors, Typography, Spacing, BorderRadius} from '@/constants/design-tokens';
import {Ionicons} from '@expo/vector-icons';

const {width} = Dimensions.get('window');

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const {signIn, loading, error, clearError} = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = (): boolean => {
    const errors = {
      email: '',
      password: '',
    };

    let isValid = true;

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
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSignIn = async () => {
    // Clear previous errors
    clearError();
    setFormErrors({email: '', password: ''});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Attempt sign in
    const user = await signIn({
      email: formData.email,
      password: formData.password,
    });

    if (user) {
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
    <SafeAreaView style={[styles.container, {backgroundColor}]} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          {/* Header Image */}
          <Image
            source={require('@/assets/images/login-header.jpg')}
            style={styles.headerImage}
            resizeMode="cover"
          />

          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, {color: textColor}]}>안녕하세요👋!</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                placeholder="Email Address"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                type="email"
                error={formErrors.email}
                style={styles.input}
              />

              <Input
                placeholder="Password"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                type="password"
                error={formErrors.password}
                rightIcon="eye-off-outline"
                style={styles.input}
              />

              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
              </TouchableOpacity>

              {/* Firebase error message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Sign In Button */}
              <Button
                title="Login"
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                fullWidth
                style={styles.signInButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, {color: secondaryTextColor}]}>
                회원이 아니신가요?{' '}
              </Text>
              <TextLink href="/select-grade">지금 가입하기.</TextLink>
            </View>
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
    paddingBottom: Spacing.xl,
  },
  headerImage: {
    width: width,
    height: 300,
    marginBottom: Spacing.xl,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
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
  signInButton: {
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  socialText: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
