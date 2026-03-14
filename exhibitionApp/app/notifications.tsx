import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

// Placeholder notifications — in V2 this will be driven by Firestore FCM
const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    type: 'booking',
    title: 'Booking Request Received',
    body: 'Your booking request for stall A-12 has been received and is under review.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'approval',
    title: 'Booking Approved!',
    body: 'Congratulations! Your stall B-05 booking has been approved by the admin.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '3',
    type: 'event',
    title: 'PlastPack Event Update',
    body: 'New halls have been added to PlastPack. Browse Hall G and Hall H for stall availability.',
    time: '3 days ago',
    read: true,
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Reminder',
    body: 'A partial payment for stall C-03 is pending. Please contact us to arrange payment.',
    time: '5 days ago',
    read: true,
  },
];

const NOTIFICATION_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  booking: { name: 'receipt-outline', color: Colors.primary, bg: Colors.primarySurface },
  approval: { name: 'checkmark-circle-outline', color: Colors.available, bg: Colors.availableLight },
  event: { name: 'calendar-outline', color: '#7C3AED', bg: '#EDE9FE' },
  payment: { name: 'card-outline', color: '#D97706', bg: '#FEF3C7' },
};

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Recent</Text>

        {SAMPLE_NOTIFICATIONS.map((n) => {
          const iconStyle = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.event;
          return (
            <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
              {!n.read && <View style={styles.unreadDot} />}
              <View style={[styles.iconWrap, { backgroundColor: iconStyle.bg }]}>
                <Ionicons name={iconStyle.name as never} size={20} color={iconStyle.color} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.title, !n.read && styles.titleUnread]}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.fcmNote}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.fcmNoteText}>
            Push notifications will be enabled in a future update. You&apos;ll receive real-time alerts for bookings, approvals, and event announcements.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: { padding: Spacing.base },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    ...Shadow.sm,
  },
  cardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  titleUnread: { fontWeight: '800' },
  body: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: { fontSize: Typography.size.xs, color: Colors.textMuted },
  fcmNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
  },
  fcmNoteText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
