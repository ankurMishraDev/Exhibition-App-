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
import type { Payment } from '@/types';

export default function PaymentReceiptScreen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    fetchPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('payments')
        .select(`
          *,
          booking:booking_id (
            *,
            event:event_id (*),
            stall:stall_id (*)
          )
        `)
        .eq('id', paymentId)
        .single();

      if (err) throw err;
      setPayment(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (amount: number, currency = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : currency;
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  };

  const getMethodIcon = (method?: string): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'card': return 'card-outline';
      case 'upi': return 'phone-portrait-outline';
      case 'netbanking': return 'business-outline';
      case 'wallet': return 'wallet-outline';
      default: return 'cash-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
      case 'paid': return AppTheme.primary;
      case 'pending':
      case 'created': return BrandColors.orange?.[500] ?? '#F97316';
      case 'failed':
      case 'refunded': return '#EF4444';
      default: return BrandColors.gray[500];
    }
  };

  const handleShare = async () => {
    if (!payment) return;
    const txnId = payment.razorpay_payment_id ?? payment.id.slice(0, 12).toUpperCase();
    const booking = payment.booking as (typeof payment.booking & { event?: { title?: string; location?: string; start_date?: string }; stall?: { stall_number?: string; hall_id?: string } }) | undefined;

    try {
      await Share.share({
        title: 'Payment Receipt – Exhibition Hub',
        message: [
          '💳 EXHIBITION HUB – PAYMENT RECEIPT',
          '════════════════════════════════════',
          `Transaction ID : ${txnId}`,
          `Status         : ${payment.status.toUpperCase()}`,
          `Method         : ${payment.method ? payment.method.toUpperCase() : 'N/A'}`,
          '',
          '💰 AMOUNT',
          `Amount Paid    : ${formatPrice(payment.amount, payment.currency)}`,
          `Currency       : ${payment.currency ?? 'INR'}`,
          '',
          '📋 BOOKING REFERENCE',
          `Booking ID     : #${payment.booking_id.slice(0, 8).toUpperCase()}`,
          `Event          : ${booking?.event?.title ?? 'N/A'}`,
          `Location       : ${booking?.event?.location ?? 'N/A'}`,
          `Event Date     : ${formatDate(booking?.event?.start_date)}`,
          `Stall No.      : ${booking?.stall?.stall_number ?? 'N/A'}`,
          `Hall           : ${booking?.stall?.hall_id ?? 'N/A'}`,
          '',
          `Transaction On : ${formatDateTime(payment.created_at)}`,
          '════════════════════════════════════',
          'Thank you for your payment!',
          'Exhibition Hub',
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
          <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppTheme.deepTeal} />
        </View>
      </ThemedView>
    );
  }

  if (error || !payment) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={[AppTheme.deepTeal, AppTheme.deepTealLight]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.center}>
          <ThemedText style={{ color: '#EF4444', marginBottom: 16 }}>{error ?? 'Payment not found'}</ThemedText>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: AppTheme.deepTeal }]} onPress={fetchPayment}>
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const statusColor = getStatusColor(payment.status);
  const txnId = payment.razorpay_payment_id ?? payment.id.slice(0, 12).toUpperCase();
  const bookingData = payment.booking as (typeof payment.booking & {
    event?: { title?: string; location?: string; start_date?: string; end_date?: string };
    stall?: { stall_number?: string; hall_id?: string; features?: string[] };
  }) | undefined;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[AppTheme.deepTeal, AppTheme.deepTealLight]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Payment Receipt</ThemedText>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero amount card */}
        <LinearGradient
          colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}30`, borderColor: `${statusColor}60`, borderWidth: 1 }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusChipText, { color: statusColor }]}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </ThemedText>
          </View>
          <ThemedText style={styles.heroAmount}>{formatPrice(payment.amount, payment.currency)}</ThemedText>
          <ThemedText style={styles.heroLabel}>Amount Paid</ThemedText>
          <View style={styles.methodRow}>
            <Ionicons name={getMethodIcon(payment.method)} size={16} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.methodText}>
              {payment.method ? payment.method.toUpperCase() : 'N/A'}
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Transaction Details */}
        <SectionTitle icon="receipt-outline" label="Transaction Details" />
        <View style={[styles.card, { backgroundColor: card }]}>
          <Row label="Transaction ID" value={txnId} isDark={isDark} monospace />
          {payment.razorpay_order_id && (
            <Row label="Order ID" value={payment.razorpay_order_id.slice(0, 20) + '...'} isDark={isDark} />
          )}
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <Row icon="calendar-outline" label="Date & Time" value={formatDateTime(payment.created_at)} isDark={isDark} />
          <Row icon="cash-outline" label="Currency" value={payment.currency ?? 'INR'} isDark={isDark} />
        </View>

        {/* Booking Reference */}
        <SectionTitle icon="bookmark-outline" label="Booking Reference" />
        <View style={[styles.card, { backgroundColor: card }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="ticket" size={22} color={AppTheme.deepTeal} />
            </View>
            <View>
              <ThemedText style={[styles.cardLabel, { color: BrandColors.gray[400] }]}>Booking ID</ThemedText>
              <ThemedText style={[styles.bookingId, { color: AppTheme.deepTeal }]}>
                #{payment.booking_id.slice(0, 8).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          {bookingData?.event && (
            <>
              <View style={[styles.divider, { backgroundColor: divider }]} />
              <ThemedText style={styles.eventTitle}>{bookingData.event.title ?? 'N/A'}</ThemedText>
              <Row icon="location-outline" label="Location" value={bookingData.event.location ?? 'N/A'} isDark={isDark} />
              <Row icon="calendar-outline" label="Event Date" value={formatDate(bookingData.event.start_date)} isDark={isDark} />
            </>
          )}
          {bookingData?.stall && (
            <>
              <View style={[styles.divider, { backgroundColor: divider }]} />
              <View style={styles.stallRow}>
                <View style={[styles.stallBadge, { backgroundColor: AppTheme.deepTealSoft }]}>
                  <ThemedText style={[styles.stallBadgeText, { color: AppTheme.deepTeal }]}>
                    Stall #{bookingData.stall.stall_number ?? 'N/A'}
                  </ThemedText>
                </View>
                <View style={[styles.stallBadge, { backgroundColor: '#E0F9E7' }]}>
                  <ThemedText style={[styles.stallBadgeText, { color: AppTheme.primary }]}>
                    Hall {bookingData.stall.hall_id ?? 'N/A'}
                  </ThemedText>
                </View>
              </View>
              {bookingData.stall.features && bookingData.stall.features.length > 0 && (
                <View style={styles.featuresWrap}>
                  <ThemedText style={[styles.rowLabel, { color: BrandColors.gray[400] }]}>Features</ThemedText>
                  <View style={styles.featureChips}>
                    {bookingData.stall.features.map((f, i) => (
                      <View key={i} style={[styles.chip, { backgroundColor: AppTheme.deepTealSoft }]}>
                        <ThemedText style={[styles.chipText, { color: AppTheme.deepTeal }]}>{f}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Share CTA */}
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
          Thank you for your payment · Exhibition Hub
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

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
  monospace = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isDark: boolean;
  monospace?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <Ionicons name={icon} size={14} color={BrandColors.gray[400]} style={{ marginRight: 4 }} />}
        <ThemedText style={[styles.rowLabel, { color: BrandColors.gray[400] }]}>{label}</ThemedText>
      </View>
      <ThemedText
        style={[
          styles.rowValue,
          { color: isDark ? '#fff' : BrandColors.gray[800] },
          monospace && { fontFamily: 'monospace', fontSize: 12 },
        ]}
        numberOfLines={2}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },

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

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: 13, fontWeight: '700' },
  heroAmount: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: 12 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

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
  eventTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  divider: { height: 1, marginVertical: 10 },

  stallRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stallBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  stallBadgeText: { fontSize: 14, fontWeight: '700' },

  featuresWrap: { marginTop: 8 },
  featureChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipText: { fontSize: 11, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 4 },
  sectionTitleText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

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
