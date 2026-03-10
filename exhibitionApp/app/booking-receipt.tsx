import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppTheme, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/types';

export default function BookingReceiptScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          *,
          event:event_id (*),
          stall:stall_id (*)
        `)
        .eq('id', bookingId)
        .single();

      if (err) throw err;
      setBooking(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return AppTheme.primary;
      case 'pending': return BrandColors.orange?.[500] ?? '#F97316';
      case 'cancelled': return '#EF4444';
      default: return BrandColors.gray[500];
    }
  };

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({
        title: 'Booking Receipt – Exhibition Hub',
        message: [
          '🎪 EXHIBITION HUB – BOOKING RECEIPT',
          '═══════════════════════════════',
          `Booking ID  : ${booking.id.slice(0, 8).toUpperCase()}`,
          `Status      : ${booking.status.toUpperCase()}`,
          '',
          '📍 EVENT DETAILS',
          `Event       : ${booking.event?.title ?? 'N/A'}`,
          `Location    : ${booking.event?.location ?? 'N/A'}`,
          `Start Date  : ${formatDate(booking.event?.start_date)}`,
          `End Date    : ${formatDate(booking.event?.end_date)}`,
          '',
          '🏪 STALL DETAILS',
          `Hall        : ${booking.stall?.hall_id ?? 'N/A'}`,
          `Stall No.   : ${booking.stall?.stall_number ?? 'N/A'}`,
          `Features    : ${(booking.stall?.features ?? []).join(', ') || 'None'}`,
          '',
          '💳 PAYMENT',
          `Amount      : ${formatPrice(booking.amount)}`,
          `Booked On   : ${formatDateTime(booking.created_at)}`,
          '═══════════════════════════════',
          'Thank you for booking with Exhibition Hub!',
        ].join('\n'),
      });
    } catch {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const card = isDark ? BrandColors.gray[900] : '#fff';
  const divider = isDark ? BrandColors.gray[800] : BrandColors.gray[100];

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[AppTheme.deepTeal, AppTheme.deepTealLight]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Booking Receipt</ThemedText>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppTheme.deepTeal} />
        </View>
      </ThemedView>
    );
  }

  if (error || !booking) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[AppTheme.deepTeal, AppTheme.deepTealLight]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Booking Receipt</ThemedText>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.center}>
          <ThemedText style={{ color: '#EF4444', marginBottom: 16 }}>{error ?? 'Booking not found'}</ThemedText>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: AppTheme.deepTeal }]} onPress={fetchBooking}>
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const statusColor = getStatusColor(booking.status);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[AppTheme.deepTeal, AppTheme.deepTealLight]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Booking Receipt</ThemedText>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '15', borderColor: statusColor + '40', borderWidth: 1 }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText style={[styles.statusLabel, { color: statusColor }]}>
            Booking {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </ThemedText>
          <View style={[styles.paymentBadge, { backgroundColor: booking.payment_status === 'paid' ? AppTheme.primary + '20' : BrandColors.orange?.[100] ?? '#FFF3E0' }]}>
            <ThemedText style={[styles.paymentBadgeText, { color: booking.payment_status === 'paid' ? AppTheme.primary : '#F97316' }]}>
              Payment: {booking.payment_status.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* Booking ID Card */}
        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="ticket" size={22} color={AppTheme.deepTeal} />
            </View>
            <View>
              <ThemedText style={[styles.cardLabel, { color: BrandColors.gray[400] }]}>Booking Reference</ThemedText>
              <ThemedText style={[styles.bookingId, { color: AppTheme.deepTeal }]}>
                #{booking.id.slice(0, 8).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <Row label="Booked On" value={formatDateTime(booking.created_at)} isDark={isDark} />
          <Row label="Expires At" value={booking.expires_at ? formatDateTime(booking.expires_at) : 'No expiry'} isDark={isDark} />
        </View>

        {/* Event Details Card */}
        <SectionTitle icon="calendar" label="Event Details" />
        <View style={[styles.card, { backgroundColor: card }]}>
          <ThemedText style={styles.cardTitle}>{booking.event?.title ?? 'N/A'}</ThemedText>
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <Row icon="location-outline" label="Location" value={booking.event?.location ?? 'N/A'} isDark={isDark} />
          <Row icon="calendar-outline" label="Start Date" value={formatDate(booking.event?.start_date)} isDark={isDark} />
          <Row icon="calendar" label="End Date" value={formatDate(booking.event?.end_date)} isDark={isDark} />
          <Row icon="people-outline" label="Total Stalls" value={String(booking.event?.total_stalls ?? 'N/A')} isDark={isDark} />
        </View>

        {/* Stall Details Card */}
        <SectionTitle icon="grid" label="Stall Details" />
        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.stallBadgeRow}>
            <View style={[styles.stallBadge, { backgroundColor: AppTheme.deepTealSoft }]}>
              <ThemedText style={[styles.stallBadgeNum, { color: AppTheme.deepTeal }]}>
                Stall #{booking.stall?.stall_number ?? 'N/A'}
              </ThemedText>
            </View>
            <View style={[styles.stallBadge, { backgroundColor: '#E0F9E7' }]}>
              <ThemedText style={[styles.stallBadgeNum, { color: AppTheme.primary }]}>
                Hall {booking.stall?.hall_id ?? 'N/A'}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <Row label="Stall Status" value={booking.stall?.status?.toUpperCase() ?? 'N/A'} isDark={isDark} />
          {booking.stall?.features && booking.stall.features.length > 0 && (
            <View style={styles.featuresWrap}>
              <ThemedText style={[styles.rowLabel, { color: BrandColors.gray[400] }]}>Features</ThemedText>
              <View style={styles.featureChips}>
                {booking.stall.features.map((f, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: AppTheme.deepTealSoft }]}>
                    <ThemedText style={[styles.chipText, { color: AppTheme.deepTeal }]}>{f}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
          {booking.exhibitor_snapshot && (
            <>
              <View style={[styles.divider, { backgroundColor: divider }]} />
              <Row label="Company" value={booking.exhibitor_snapshot.company_name} isDark={isDark} />
              <Row label="Executive" value={booking.exhibitor_snapshot.executive_name} isDark={isDark} />
              <Row label="Domain" value={booking.exhibitor_snapshot.company_domain} isDark={isDark} />
            </>
          )}
        </View>

        {/* Payment Summary */}
        <SectionTitle icon="card" label="Payment Summary" />
        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.amountLabel, { color: BrandColors.gray[400] }]}>Total Amount Paid</ThemedText>
            <ThemedText style={[styles.amountValue, { color: AppTheme.deepTeal }]}>
              {formatPrice(booking.amount)}
            </ThemedText>
          </View>
          {booking.payment_id && (
            <>
              <View style={[styles.divider, { backgroundColor: divider }]} />
              <Row label="Payment ID" value={booking.payment_id.slice(0, 16) + '...'} isDark={isDark} />
            </>
          )}
        </View>

        {/* Download / Share CTA */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleShare} activeOpacity={0.8}>
          <LinearGradient
            colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadGradient}
          >
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <ThemedText style={styles.downloadText}>Share / Download Receipt</ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        <ThemedText style={[styles.footer, { color: BrandColors.gray[400] }]}>
          Thank you for booking with Exhibition Hub
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

// Small helper components
function SectionTitle({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={16} color={AppTheme.deepTeal} />
      <ThemedText style={[styles.sectionTitleText, { color: AppTheme.deepTeal }]}>{label}</ThemedText>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  isDark,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <Ionicons name={icon} size={14} color={BrandColors.gray[400]} style={{ marginRight: 4 }} />}
        <ThemedText style={[styles.rowLabel, { color: BrandColors.gray[400] }]}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.rowValue, { color: isDark ? '#fff' : BrandColors.gray[800] }]} numberOfLines={2}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  paymentBadgeText: { fontSize: 11, fontWeight: '700' },

  // Card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 12, marginBottom: 2 },
  bookingId: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  divider: { height: 1, marginVertical: 10 },

  // Stall badge
  stallBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stallBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  stallBadgeNum: { fontSize: 15, fontWeight: '700' },

  // Features
  featuresWrap: { marginTop: 8 },
  featureChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: '600' },

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 4 },
  sectionTitleText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  // Amount
  amountRow: { alignItems: 'center', paddingVertical: 10 },
  amountLabel: { fontSize: 13, marginBottom: 6 },
  amountValue: { fontSize: 36, fontWeight: '800' },

  // Download
  downloadBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  downloadGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  downloadText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 12, marginBottom: 8 },
});
