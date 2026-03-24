import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { NotificationModel } from '@/lib/models/notification.model';
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToExhibitorNotifications,
} from '@/lib/services/notificationService';

function formatRelativeTime(value: unknown): string {
  if (!value || typeof value !== 'object' || typeof (value as { toDate?: unknown }).toDate !== 'function') {
    return 'Now';
  }
  const date = (value as { toDate: () => Date }).toDate();
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));

  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-IN');
}

const NOTIFICATION_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  booking_approved: { name: 'checkmark-circle-outline', color: Colors.available, bg: Colors.availableLight },
  payment_updated: { name: 'card-outline', color: '#D97706', bg: '#FEF3C7' },
  generic: { name: 'notifications-outline', color: Colors.primary, bg: Colors.primarySurface },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToExhibitorNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    }, (message) => {
      setLoading(false);
      Alert.alert('Notifications Error', message);
    });

    return unsubscribe;
  }, [user?.uid]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  async function handleRead(notification: NotificationModel) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead(notifications);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? <Text style={styles.unreadCount}>{unreadCount} new</Text> : null}
        </View>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllBtnText, unreadCount === 0 && styles.markAllBtnTextDisabled]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Recent Updates</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="notifications-off-outline" size={26} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>You will receive updates when bookings are approved and payments are updated.</Text>
          </View>
        ) : (
          notifications.map((n) => {
            const iconStyle = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.generic;
            return (
              <TouchableOpacity key={n.id} style={[styles.card, !n.read && styles.cardUnread]} onPress={() => void handleRead(n)} activeOpacity={0.85}>
                {!n.read && <View style={styles.unreadDot} />}
                <View style={[styles.iconWrap, { backgroundColor: iconStyle.bg }]}>
                  <Ionicons name={iconStyle.name as never} size={20} color={iconStyle.color} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.title, !n.read && styles.titleUnread]}>{n.title}</Text>
                  <Text style={styles.body}>{n.body}</Text>
                  <Text style={styles.time}>{formatRelativeTime(n.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.fcmNote}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.fcmNoteText}>
            These notifications are now live from admin actions and update automatically.
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
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unreadCount: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '700',
  },
  markAllBtn: {
    minWidth: 56,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  markAllBtnText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: '700',
  },
  markAllBtnTextDisabled: {
    color: Colors.textMuted,
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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
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
