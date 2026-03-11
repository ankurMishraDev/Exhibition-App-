import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToExhibitorBookings } from '@/lib/services/bookingService';
import { BookingModel, BookingStatus } from '@/lib/models/booking.model';

const STATUS_FILTERS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { user, isExhibitor, isVisitor } = useAuth();
  const [bookings, setBookings] = useState<BookingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    if (!user || isVisitor) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToExhibitorBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user, isVisitor]);

  const filtered =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filter);

  if (isVisitor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenHeaderTitle}>My Bookings</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Exhibitor Feature</Text>
          <Text style={styles.emptySubtitle}>
            Bookings are available for exhibitors.{'\n'}Register as an exhibitor to book stalls.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenHeaderTitle}>My Bookings</Text>
        <View style={styles.bookingCount}>
          <Text style={styles.bookingCountText}>{bookings.length}</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === 'all'
              ? bookings.length
              : bookings.filter((b) => b.status === f.value).length;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
              onPress={() => setFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f.value && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    filter === f.value && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      filter === f.value && styles.filterBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? 'Browse halls and book your stall for PlastPack'
              : 'Try a different filter to see other bookings'}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => router.push('/hall-selection')}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.bookNowBtnText}>Book a Stall</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => {/* detail screen future */}} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onPress,
}: {
  booking: BookingModel;
  onPress: () => void;
}) {
  const { color, bg, icon, label } = getStatusStyle(booking.status);
  const date = new Date(booking.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Card top */}
      <View style={styles.cardTop}>
        <View style={styles.stallCodeWrap}>
          <Text style={styles.stallCode}>{booking.stallCode}</Text>
          <Text style={styles.hallName}>{booking.hallName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Ionicons name={icon as never} size={12} color={color} />
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      {/* Card details */}
      <View style={styles.cardDetails}>
        <CardDetail icon="calendar-outline" text={`Booked on ${date}`} />
        <CardDetail
          icon="pricetag-outline"
          text={`₹${booking.totalAmount.toLocaleString('en-IN')}`}
          highlight
        />
      </View>

      {/* Admin notes if rejected */}
      {booking.status === 'rejected' && booking.adminNotes && (
        <View style={styles.adminNote}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.error} />
          <Text style={styles.adminNoteText}>{booking.adminNotes}</Text>
        </View>
      )}

      {/* Approved confirmation */}
      {booking.status === 'approved' && (
        <View style={styles.approvedNote}>
          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.available} />
          <Text style={styles.approvedNoteText}>
            Booking confirmed.{booking.approvedAt
              ? ` Approved on ${new Date(booking.approvedAt).toLocaleDateString('en-IN')}`
              : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CardDetail({
  icon,
  text,
  highlight,
}: {
  icon: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.cardDetailRow}>
      <Ionicons
        name={icon as never}
        size={14}
        color={highlight ? Colors.primary : Colors.textMuted}
      />
      <Text style={[styles.cardDetailText, highlight && styles.cardDetailTextHighlight]}>
        {text}
      </Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: BookingStatus) {
  switch (status) {
    case 'pending_approval':
      return {
        color: '#D97706',
        bg: '#FEF3C7',
        icon: 'time-outline',
        label: 'Pending',
      };
    case 'approved':
      return {
        color: Colors.available,
        bg: Colors.availableLight,
        icon: 'checkmark-circle-outline',
        label: 'Approved',
      };
    case 'rejected':
      return {
        color: Colors.error,
        bg: '#FEE2E2',
        icon: 'close-circle-outline',
        label: 'Rejected',
      };
    case 'cancelled':
      return {
        color: Colors.textMuted,
        bg: Colors.surfaceVariant,
        icon: 'ban-outline',
        label: 'Cancelled',
      };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenHeaderTitle: {
    flex: 1,
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bookingCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  bookingCountText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: { color: Colors.white },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: {
    fontSize: Typography.size.xs - 1,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterBadgeTextActive: { color: Colors.white },

  listContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stallCodeWrap: { flex: 1 },
  stallCode: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  hallName: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: Typography.size.xs, fontWeight: '700' },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  cardDetails: { flexDirection: 'row', gap: Spacing.base },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardDetailText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  cardDetailTextHighlight: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: Typography.size.base,
  },
  adminNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.sm,
  },
  adminNoteText: { flex: 1, fontSize: Typography.size.xs, color: Colors.error },
  approvedNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.availableLight,
    borderRadius: Radius.sm,
  },
  approvedNoteText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.available,
    fontWeight: '500',
  },

  // Empty
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
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  bookNowBtnText: { color: Colors.white, fontWeight: '700', fontSize: Typography.size.sm },
});
