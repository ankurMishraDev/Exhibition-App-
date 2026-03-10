import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { BookingService } from '@/services/bookingService';
import { PaymentService } from '@/services/paymentService';
import type { Booking, Payment } from '@/types';
import { AppTheme, BrandColors } from '@/constants/theme';
import type { Unsubscribe } from 'firebase/firestore';

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending_approval: { color: '#F59E0B', icon: 'time-outline',           label: 'Pending Approval' },
  approved:         { color: AppTheme.primary, icon: 'checkmark-circle', label: 'Approved' },
  rejected:         { color: '#EF4444', icon: 'close-circle-outline',   label: 'Rejected' },
  cancelled:        { color: '#9CA3AF', icon: 'ban-outline',            label: 'Cancelled' },
};

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isExhibitor } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const subscribe = () => {
    if (!user) return;
    unsubscribeRef.current?.();
    unsubscribeRef.current = BookingService.subscribeToExhibitorBookings(
      user.uid,
      (data) => {
        setBookings(data);
        setLoading(false);
        // Fetch payment for each booking
        data.forEach((b) => {
          PaymentService.getPaymentByBooking(b.id).then((p) => {
            if (p) setPayments((prev) => ({ ...prev, [b.id]: p }));
          });
        });
      }
    );
  };

  useEffect(() => {
    subscribe();
    return () => { unsubscribeRef.current?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    subscribe();
    setTimeout(() => setRefreshing(false), 800);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderPaymentBar = (booking: Booking) => {
    const pmt = payments[booking.id];
    if (!pmt) return null;
    const paidPct = booking.totalAmount > 0
      ? Math.min((pmt.paidAmount / booking.totalAmount) * 100, 100)
      : 0;
    return (
      <View style={styles.paymentBarWrapper}>
        <View style={styles.paymentBarRow}>
          <Text style={styles.paymentBarLabel}>
            Payment  ₹{pmt.paidAmount.toLocaleString('en-IN')} / ₹{booking.totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.paymentBarLabel, { color: pmt.status === 'paid' ? AppTheme.primary : '#F59E0B' }]}>
            {pmt.status === 'paid' ? 'Paid' : pmt.status === 'partial' ? 'Partial' : 'Pending'}
          </Text>
        </View>
        <View style={styles.paymentBar}>
          <View style={[styles.paymentBarFill, { width: `${paidPct}%` as any }]} />
        </View>
      </View>
    );
  };

  const renderCard = (booking: Booking) => {
    const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending_approval;
    return (
      <View key={booking.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.stallBadge}>
            <Ionicons name="grid-outline" size={16} color={AppTheme.primary} />
            <Text style={styles.stallCode}>  Stall {booking.stallCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
            <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>  {cfg.label}</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
          <Text style={styles.cardMeta}>
            {'  '}Total:{'  '}
            <Text style={{ fontWeight: '700', color: '#111827' }}>
              ₹{booking.totalAmount.toLocaleString('en-IN')}
            </Text>
          </Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.cardMeta}>{'  '}Booked on {formatDate(booking.bookingDate)}</Text>
        </View>

        {renderPaymentBar(booking)}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>PlastPack Exhibition</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AppTheme.primary} />
          </View>
        ) : !isExhibitor ? (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={56} color={AppTheme.primaryLight} />
            <Text style={styles.emptyTitle}>Visitor Account</Text>
            <Text style={styles.emptySub}>Bookings are for exhibitors only.</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={56} color={AppTheme.primaryLight} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySub}>Book a stall from the home screen to get started.</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.ctaBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bookings.map(renderCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: AppTheme.deepTeal,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
  },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  headerSub: { color: '#A7F3D0', fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stallBadge: { flexDirection: 'row', alignItems: 'center' },
  stallCode: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#6B7280' },
  paymentBarWrapper: { marginTop: 10 },
  paymentBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  paymentBarLabel: { fontSize: 11, color: '#6B7280' },
  paymentBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  paymentBarFill: { height: 6, backgroundColor: AppTheme.primary, borderRadius: 3 },
  emptyState: { paddingVertical: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center' },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: AppTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
