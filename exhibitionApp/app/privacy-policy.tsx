import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

const sections = [
  {
    title: '1. Data We Collect',
    body: 'This placeholder section explains the categories of information collected, such as profile details, booking information, and app usage metadata.',
  },
  {
    title: '2. How Data Is Used',
    body: 'This placeholder section explains that data is used for account management, stall booking coordination, payment visibility, and support communication.',
  },
  {
    title: '3. Data Sharing',
    body: 'This placeholder section explains that relevant operational information may be shared with event administrators and authorized service providers.',
  },
  {
    title: '4. Retention and Security',
    body: 'This placeholder section describes retention windows, secure storage practices, and safeguards used to protect account and payment information.',
  },
  {
    title: '5. Your Rights',
    body: 'This placeholder section describes user rights for correction, export, and deletion requests, subject to legal and operational requirements.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Draft Version</Text>
          <Text style={styles.introText}>
            This is temporary placeholder content. Final privacy policy text will be provided later.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  introCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  introTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  introText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
