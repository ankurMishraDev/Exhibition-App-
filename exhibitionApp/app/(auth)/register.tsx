import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [role, setRole] = useState<UserRole>('exhibitor');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (role === 'exhibitor' && !companyName.trim()) {
      Alert.alert('Error', 'Company name is required for exhibitors');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const displayName = role === 'exhibitor' ? `${fullName} (${companyName})` : fullName;
    const { error } = await signUp(email, password, displayName, role);

    if (error) {
      Alert.alert('Registration Error', error);
    } else {
      Alert.alert(
        'Account Created!',
        'Please check your email and verify your account before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    setIsLoading(false);
  };

  const navigateToLogin = () => router.push('/(auth)/login');

  const inputBg = isDark ? BrandColors.gray[800] : BrandColors.gray[50];
  const inputBorder = isDark ? BrandColors.gray[700] : BrandColors.gray[200];
  const inputColor = isDark ? '#fff' : '#000';

  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    setValue: (t: string) => void,
    opts?: {
      keyboardType?: 'email-address' | 'phone-pad' | 'default';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      secureTextEntry?: boolean;
      showToggle?: boolean;
      isVisible?: boolean;
      onToggle?: () => void;
    }
  ) => (
    <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
      <Ionicons name={icon} size={18} color={BrandColors.gray[400]} />
      <TextInput
        style={[styles.input, { color: inputColor }]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={BrandColors.gray[400]}
        keyboardType={opts?.keyboardType ?? 'default'}
        autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
        secureTextEntry={opts?.secureTextEntry}
      />
      {opts?.showToggle && (
        <TouchableOpacity onPress={opts.onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={opts.isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={BrandColors.gray[400]}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.brandHeader, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />
        <TouchableOpacity style={styles.backBtn} onPress={navigateToLogin}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.brandContent}>
          <View style={styles.logoIcon}>
            <Ionicons name="person-add" size={28} color={AppTheme.deepTeal} />
          </View>
          <ThemedText style={styles.brandTitle}>Create Account</ThemedText>
          <ThemedText style={styles.brandSubtitle}>Join PlastPack 2026</ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formCard, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>

          {/* â”€â”€ Role Selection â”€â”€ */}
          <ThemedText style={[styles.sectionLabel, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[600] }]}>
            I am registering as
          </ThemedText>
          <View style={styles.roleRow}>
            {(['exhibitor', 'visitor'] as UserRole[]).map((r) => {
              const selected = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleCard,
                    {
                      borderColor: selected ? AppTheme.deepTeal : inputBorder,
                      backgroundColor: selected
                        ? (isDark ? 'rgba(0,128,128,0.15)' : 'rgba(0,128,128,0.06)')
                        : inputBg,
                    },
                  ]}
                  onPress={() => setRole(r)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={r === 'exhibitor' ? 'business' : 'person'}
                    size={26}
                    color={selected ? AppTheme.deepTeal : BrandColors.gray[400]}
                  />
                  <ThemedText
                    style={[
                      styles.roleLabel,
                      { color: selected ? AppTheme.deepTeal : (isDark ? BrandColors.gray[300] : BrandColors.gray[600]) },
                    ]}
                  >
                    {r === 'exhibitor' ? 'Exhibitor' : 'Visitor'}
                  </ThemedText>
                  <ThemedText style={[styles.roleDesc, { color: BrandColors.gray[400] }]}>
                    {r === 'exhibitor' ? 'Book stalls & exhibit' : 'Explore the event'}
                  </ThemedText>
                  {selected && (
                    <View style={[styles.roleCheck, { backgroundColor: AppTheme.deepTeal }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* â”€â”€ Fields â”€â”€ */}
          <View style={styles.inputGroup}>
            {renderInput('person-outline', 'Full Name *', fullName, setFullName, { autoCapitalize: 'words' })}
          </View>

          {role === 'exhibitor' && (
            <View style={styles.inputGroup}>
              {renderInput('business-outline', 'Company Name *', companyName, setCompanyName, { autoCapitalize: 'words' })}
            </View>
          )}

          <View style={styles.inputGroup}>
            {renderInput('mail-outline', 'Email Address *', email, setEmail, {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
          </View>

          <View style={styles.inputGroup}>
            {renderInput('lock-closed-outline', 'Password *', password, setPassword, {
              secureTextEntry: !showPassword,
              showToggle: true,
              isVisible: showPassword,
              onToggle: () => setShowPassword((v) => !v),
            })}
          </View>

          <View style={styles.inputGroup}>
            {renderInput('shield-checkmark-outline', 'Confirm Password *', confirmPassword, setConfirmPassword, {
              secureTextEntry: !showConfirmPassword,
              showToggle: true,
              isVisible: showConfirmPassword,
              onToggle: () => setShowConfirmPassword((v) => !v),
            })}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpGradient}
            >
              {isLoading ? (
                <ThemedText style={styles.signUpText}>Creating Account...</ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.signUpText}>Create Account</ThemedText>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <ThemedText style={[styles.loginText, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
              Already have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={navigateToLogin}>
              <ThemedText style={[styles.loginLink, { color: AppTheme.deepTeal }]}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandHeader: {
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decoCircle2: {
    position: 'absolute', bottom: -15, left: -25,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  brandContent: { alignItems: 'center' },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  brandSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  formScroll: { flex: 1, marginTop: -20 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  formCard: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1, borderWidth: 2, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 6, position: 'relative',
  },
  roleLabel: { fontSize: 15, fontWeight: '700' },
  roleDesc: { fontSize: 11, textAlign: 'center' },
  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  inputGroup: { marginBottom: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, height: 52, gap: 10,
  },
  input: { flex: 1, fontSize: 15, height: '100%' },
  signUpBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 6, marginBottom: 20 },
  signUpGradient: {
    height: 54, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  signUpText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});

