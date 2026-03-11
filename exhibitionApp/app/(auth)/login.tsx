import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginWithEmail } from '@/lib/services/authService';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      // AuthGate in _layout.tsx will redirect to /(tabs)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Login failed', mapFirebaseError(msg));
    } finally {
      setLoading(false);
    }
  }

  function handleSocialPlaceholder(provider: string) {
    Alert.alert(
      'Coming Soon',
      `${provider} sign-in requires credentials configuration. Please use email/password for now.`
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.header}
          >
            <View style={styles.headerIcon}>
              <Ionicons name="storefront" size={36} color={Colors.white} />
            </View>
            <Text style={styles.appName}>PlastPack</Text>
            <Text style={styles.tagline}>Exhibition App</Text>
          </LinearGradient>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Please enter your details to sign in.
            </Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPlaceholder('Google')}
              >
                <Ionicons name="logo-google" size={22} color="#EA4335" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPlaceholder('Apple')}
              >
                <Ionicons name="logo-apple" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPlaceholder('Facebook')}
              >
                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => handleSocialPlaceholder('Twitter / X')}
              >
                <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mapFirebaseError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'Invalid email or password. Please try again.';
  if (msg.includes('too-many-requests'))
    return 'Too many failed attempts. Please try again later.';
  if (msg.includes('email-not-verified'))
    return 'Please verify your email before signing in.';
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: Colors.background },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    marginTop: -Radius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    flex: 1,
  },
  welcomeTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },

  // Form
  inputGroup: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    height: '100%',
  },
  passwordInput: { paddingRight: Spacing.sm },
  eyeBtn: { padding: Spacing.xs },

  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.lg },
  forgotText: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Buttons
  signInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  disabledBtn: { opacity: 0.65 },
  signInText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
});
