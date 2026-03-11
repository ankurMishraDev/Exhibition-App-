import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getExhibitorBookings } from '@/lib/services/bookingService';
import { BookingModel, BookingStatus } from '@/lib/models/booking.model';

type HistorySection = { title: string; data: BookingModel[] };

const COMPLETED_STATUSES: BookingStatus[] = ['approved', 'rejected', 'cancelled'];

export default function HistoryScreen() {
  const { user, isVisitor } = useAuth();
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isVisitor) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const bookings = await getExhibitorBookings(user.uid);
        const completed = bookings.filter((b) =>
          COMPLETED_STATUSES.includes(b.status)
        );
        // Group by month/year
        const groupMap = new Map<string, BookingModel[]>();
        for (const booking of completed) {
          const date = new Date(booking.createdAt);
          const key = date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          });
          if (!groupMap.has(key)) groupMap.set(key, []);
          groupMap.get(key)!.push(booking);
        }
        const grouped: HistorySection[] = Array.from(groupMap.entries()).map(
          ([title, data]) => ({ title, data })
        );
        setSections(grouped);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isVisitor]);

  if (isVisitor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenHeaderTitle}>History</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Exhibitor Feature</Text>
          <Text style={styles.emptySubtitle}>Booking history is only available for exhibitors.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenHeaderTitle}>History</Text>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Completed, approved, or rejected bookings will appear here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => <HistoryCard booking={item} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── HistoryCard ──────────────────────────────────────────────────────────────

function HistoryCard({ booking }: { booking: BookingModel }) {
  const { color, bg, icon, label } = getStatusStyle(booking.status);
  const createdDate = new Date(booking.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.statusIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon as never} size={20} color={color} />
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardTopRow}>
          <Text style={styles.stallCode}>{booking.stallCode}</Text>
          <View style={[styles.statusPill, { backgroundColor: bg }]}>
            <Text style={[styles.statusPillText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.hallName}>{booking.hallName}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{createdDate}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={[styles.metaText, styles.price]}>
            ₹{booking.totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>
        {booking.adminNotes && (
          <Text style={styles.adminNote} numberOfLines={2}>
            {`"${booking.adminNotes}"`}
          </Text>
        )}
      </View>
    </View>
  );
}

function getStatusStyle(status: BookingStatus) {
  switch (status) {
    case 'approved':
      return { color: Colors.available, bg: Colors.availableLight, icon: 'checkmark-circle', label: 'Approved' };
    case 'rejected':
      return { color: Colors.error, bg: '#FEE2E2', icon: 'close-circle', label: 'Rejected' };
    case 'cancelled':
      return { color: Colors.textMuted, bg: Colors.surfaceVariant, icon: 'ban', label: 'Cancelled' };
    default:
      return { color: Colors.textMuted, bg: Colors.surfaceVariant, icon: 'help-circle', label: status };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screenHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenHeaderTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  listContent: { padding: Spacing.base },
  sectionHeader: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionHeaderText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    ...Shadow.sm,
  },
  cardLeft: { paddingTop: 2 },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRight: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stallCode: {
    fontSize: Typography.size.base,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusPillText: { fontSize: Typography.size.xs, fontWeight: '700' },
  hallName: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.size.xs, color: Colors.textMuted },
  metaDot: { color: Colors.textMuted },
  price: { color: Colors.primary, fontWeight: '700' },
  adminNote: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
