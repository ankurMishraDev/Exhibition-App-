import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleToken(id_token);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(idToken);
    if (error) {
      Alert.alert('Google Sign-In Error', error);
    } else {
      router.replace('/(tabs)');
    }
    setGoogleLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert('Login Error', error);
    } else {
      router.replace('/(tabs)');
    }
    setIsLoading(false);
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Deep Teal Branding Header */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.brandHeader, { paddingTop: insets.top + 8 }]}
      >
        {/* Decorative circles */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        <View style={styles.brandContent}>
          <View style={styles.logoIcon}>
            <Ionicons name="business" size={32} color={AppTheme.deepTeal} />
          </View>
          <ThemedText style={styles.brandTitle}>Exhibition Hub</ThemedText>
          <ThemedText style={styles.brandSubtitle}>Book your perfect exhibition stall</ThemedText>
        </View>
      </LinearGradient>

      {/* Form Card */}
      <ScrollView
        style={styles.formScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formCard, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>
          <ThemedText style={styles.welcomeTitle}>Welcome Back</ThemedText>
          <ThemedText style={[styles.welcomeSubtitle, { color: BrandColors.gray[400] }]}>
            Sign in to continue managing your exhibitions
          </ThemedText>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[600] }]}>
              Email Address
            </ThemedText>
            <View style={[styles.inputWrapper, {
              backgroundColor: isDark ? BrandColors.gray[800] : BrandColors.gray[50],
              borderColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200],
            }]}>
              <Ionicons name="mail-outline" size={18} color={BrandColors.gray[400]} />
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                value={email}
                onChangeText={setEmail}
                placeholder="hello@example.com"
                placeholderTextColor={BrandColors.gray[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[600] }]}>
              Password
            </ThemedText>
            <View style={[styles.inputWrapper, {
              backgroundColor: isDark ? BrandColors.gray[800] : BrandColors.gray[50],
              borderColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200],
            }]}>
              <Ionicons name="lock-closed-outline" size={18} color={BrandColors.gray[400]} />
              <TextInput
                style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={BrandColors.gray[400]}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={BrandColors.gray[400]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[
                styles.checkbox,
                rememberMe && { backgroundColor: AppTheme.deepTeal, borderColor: AppTheme.deepTeal },
              ]}>
                {rememberMe && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <ThemedText style={styles.rememberText}>Remember me</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Password reset will be implemented soon!')}>
              <ThemedText style={[styles.forgotText, { color: AppTheme.deepTeal }]}>
                Forgot password?
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
            <LinearGradient
              colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInGradient}
            >
              {isLoading ? (
                <ThemedText style={styles.signInText}>Signing In...</ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.signInText}>Sign In</ThemedText>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200] }]} />
            <ThemedText style={[styles.dividerText, { color: BrandColors.gray[400] }]}>or continue with</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200] }]} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200], backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}
            onPress={() => googlePromptAsync()}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            <Image source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }} style={styles.googleIcon} />
            <ThemedText style={[styles.googleText, { color: isDark ? '#fff' : BrandColors.gray[700] }]}>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </ThemedText>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <ThemedText style={[styles.registerText, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
              Don&apos;t have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={navigateToRegister}>
              <ThemedText style={[styles.registerLink, { color: AppTheme.deepTeal }]}>
                Create Account
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Brand Header
  brandHeader: {
    paddingTop: 70,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  brandContent: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  // Form
  formScroll: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: BrandColors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 13,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signInBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  signInGradient: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    gap: 12,
    marginBottom: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
  },
});