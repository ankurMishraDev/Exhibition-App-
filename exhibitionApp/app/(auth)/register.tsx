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
import { registerWithEmail } from '@/lib/services/authService';
import { UserRole } from '@/lib/models/user.model';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

type Step = 'role' | 'form';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole>('exhibitor');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    if (role === 'exhibitor' && !companyName.trim()) {
      Alert.alert('Missing field', 'Company name is required for exhibitors.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(
        email.trim().toLowerCase(),
        password,
        displayName.trim(),
        role
      );
      Alert.alert(
        'Verify your email',
        'A verification link has been sent to your email. Please verify before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      Alert.alert('Registration failed', mapFirebaseError(msg));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'role') {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>{"Choose how you'll use PlastPack"}</Text>
        </LinearGradient>

        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>I am a...</Text>
          <Text style={styles.roleSubtitle}>
            Select your account type to get started
          </Text>

          <TouchableOpacity
            style={[styles.roleOption, role === 'exhibitor' && styles.roleSelected]}
            onPress={() => setRole('exhibitor')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIconBox, role === 'exhibitor' && styles.roleIconBoxSelected]}>
              <Ionicons
                name="storefront"
                size={28}
                color={role === 'exhibitor' ? Colors.white : Colors.primary}
              />
            </View>
            <View style={styles.roleTextBox}>
              <Text style={[styles.roleLabel, role === 'exhibitor' && styles.roleLabelSelected]}>
                Exhibitor
              </Text>
              <Text style={styles.roleDesc}>
                Book stalls, manage your exhibit, track payments
              </Text>
            </View>
            {role === 'exhibitor' && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, role === 'visitor' && styles.roleSelected]}
            onPress={() => setRole('visitor')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIconBox, role === 'visitor' && styles.roleIconBoxSelected]}>
              <Ionicons
                name="person"
                size={28}
                color={role === 'visitor' ? Colors.white : Colors.primary}
              />
            </View>
            <View style={styles.roleTextBox}>
              <Text style={[styles.roleLabel, role === 'visitor' && styles.roleLabelSelected]}>
                Visitor
              </Text>
              <Text style={styles.roleDesc}>
                Explore the event, browse halls and exhibitors
              </Text>
            </View>
            {role === 'visitor' && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => setStep('form')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
          <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('role')}>
              <Ionicons name="arrow-back" size={22} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {role === 'exhibitor' ? 'Exhibitor Account' : 'Visitor Account'}
            </Text>
            <Text style={styles.headerSubtitle}>Fill in your details below</Text>
          </LinearGradient>

          <View style={styles.formCard}>
            {/* Role badge */}
            <View style={[styles.roleBadge, role === 'exhibitor' ? styles.roleBadgeExhibitor : styles.roleBadgeVisitor]}>
              <Ionicons
                name={role === 'exhibitor' ? 'storefront' : 'person'}
                size={14}
                color={role === 'exhibitor' ? Colors.primary : Colors.saffron}
              />
              <Text style={[styles.roleBadgeText, { color: role === 'exhibitor' ? Colors.primary : Colors.saffron }]}>
                {role === 'exhibitor' ? 'Exhibitor' : 'Visitor'}
              </Text>
            </View>

            <Field
              label="Full Name *"
              icon="person-outline"
              placeholder="Your full name"
              value={displayName}
              onChangeText={setDisplayName}
            />

            {role === 'exhibitor' && (
              <Field
                label="Company Name *"
                icon="business-outline"
                placeholder="Your company name"
                value={companyName}
                onChangeText={setCompanyName}
              />
            )}

            <Field
              label="Email Address *"
              icon="mail-outline"
              placeholder="you@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Field
              label="Password *"
              icon="lock-closed-outline"
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Field
              label="Confirm Password *"
              icon="lock-closed-outline"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />

            <Text style={styles.verifyNote}>
              <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
              {' '}A verification email will be sent after registration.
            </Text>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIconPress,
}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  rightIcon?: string;
  onRightIconPress?: () => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon as never} size={18} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.eyeBtn}>
            <Ionicons name={rightIcon as never} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function mapFirebaseError(msg: string): string {
  if (msg.includes('email-already-in-use'))
    return 'This email is already registered. Please sign in.';
  if (msg.includes('invalid-email'))
    return 'Please enter a valid email address.';
  if (msg.includes('weak-password'))
    return 'Password must be at least 6 characters.';
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: Colors.background },

  header: {
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  // Role selection card
  roleCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    marginTop: -Radius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    flex: 1,
  },
  roleTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    gap: Spacing.md,
  },
  roleSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  roleIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxSelected: { backgroundColor: Colors.primary },
  roleTextBox: { flex: 1 },
  roleLabel: {
    fontSize: Typography.size.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roleLabelSelected: { color: Colors.primary },
  roleDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: '700',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  loginText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '700' },

  // Form card
  formCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    marginTop: -Radius['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: 4,
    marginBottom: Spacing.xl,
  },
  roleBadgeExhibitor: { backgroundColor: Colors.primarySurface },
  roleBadgeVisitor: { backgroundColor: Colors.saffronLight },
  roleBadgeText: { fontSize: Typography.size.xs, fontWeight: '700' },

  // Input fields
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
  eyeBtn: { padding: Spacing.xs },

  verifyNote: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginVertical: Spacing.sm,
    lineHeight: 18,
  },

  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
    ...Shadow.md,
  },
  disabledBtn: { opacity: 0.65 },
  registerBtnText: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
});
