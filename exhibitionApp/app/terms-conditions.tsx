import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppTheme, BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsConditionsScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the Exhibition App, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: '2. Booking and Cancellation Policy',
      content: `• Stall bookings are subject to availability.\n• Once a booking is confirmed and payment is made, the stall is reserved for your use during the exhibition period.\n• Cancellations made 30 days before the event are eligible for a 75% refund.\n• Cancellations made 15-30 days before the event are eligible for a 50% refund.\n• No refunds for cancellations made less than 15 days before the event.`
    },
    {
      title: '3. Payment Terms',
      content: `• All payments must be made in full at the time of booking.\n• We accept payments through various digital payment methods including UPI, credit/debit cards, and net banking.\n• All prices are inclusive of applicable taxes unless stated otherwise.\n• Payment confirmation will be sent via email and SMS.`
    },
    {
      title: '4. User Responsibilities',
      content: `• You are responsible for maintaining the confidentiality of your account credentials.\n• You agree to provide accurate and complete information when creating your profile.\n• You must comply with all applicable laws and regulations while using the platform.\n• Any misuse of booked stalls or violation of exhibition rules may result in termination of services.`
    },
    {
      title: '5. Exhibitor Guidelines',
      content: `• Exhibitors must set up their stalls within the designated area only.\n• All products and services displayed must comply with local laws and regulations.\n• Exhibitors are responsible for the safety and security of their own goods.\n• Any damage to exhibition property will be charged to the exhibitor.`
    },
    {
      title: '6. Privacy Policy',
      content: `• We collect and process personal data in accordance with our Privacy Policy.\n• Your data will be used to facilitate bookings and improve our services.\n• We do not sell or share your personal information with third parties without consent.\n• You have the right to access, modify, or delete your personal data.`
    },
    {
      title: '7. Limitation of Liability',
      content: `• The Exhibition App is provided "as is" without warranties of any kind.\n• We are not liable for any indirect, incidental, or consequential damages.\n• Our total liability shall not exceed the amount paid by you for the services.\n• We are not responsible for any losses due to technical failures or force majeure events.`
    },
    {
      title: '8. Modifications to Terms',
      content: `• We reserve the right to modify these terms at any time.\n• Changes will be effective immediately upon posting on the app.\n• Continued use of the service after changes constitutes acceptance of new terms.\n• We will notify users of significant changes via email or in-app notification.`
    },
    {
      title: '9. Contact Information',
      content: `For any questions or concerns regarding these terms, please contact us at:\n\n📧 Email: support@exhibitionapp.com\n📞 Phone: +91 1234567890\n📍 Address: Exhibition Hub, Business District, India`
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <ThemedText type="title" style={styles.headerTitle}>Terms & Conditions</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Last updated: January 2026</ThemedText>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.introCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={[styles.introIconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
            <Ionicons name="document-text-outline" size={28} color={AppTheme.deepTeal} />
          </View>
          <ThemedText style={styles.introText}>
            Please read these terms and conditions carefully before using our services.
          </ThemedText>
        </View>

        {sections.map((section, index) => (
          <View 
            key={index} 
            style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}
          >
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {section.title}
            </ThemedText>
            <ThemedText style={[styles.sectionContent, { color: Colors[colorScheme ?? 'light'].text }]}>
              {section.content}
            </ThemedText>
          </View>
        ))}

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: Colors[colorScheme ?? 'light'].icon }]}>
            By using the Exhibition App, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  introIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
