import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors as ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToExhibitorBookings } from '@/lib/services/bookingService';
import { subscribeToExhibitorPayments } from '@/lib/services/paymentService';
import { BookingModel, BookingStatus } from '@/lib/models/booking.model';
import { PaymentModel, PaymentRecord } from '@/lib/models/payment.model';

const STATUS_FILTERS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

// Reusing colors from Stitch UI payload
const Colors = {
  ...ThemeColors,
  magenta: '#9F1A71',
  softPink: '#FFF5F9',
  bgDark: '#1a0412',
  textHeader: '#FFF9FB',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatDateValue(value: unknown): string {
  if (!value || typeof value !== 'object') return 'N/A';
  const withToDate = value as { toDate?: () => Date };
  const dateObj = typeof withToDate.toDate === 'function' ? withToDate.toDate() : null;
  if (!dateObj || Number.isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isExhibitor, isVisitor } = useAuth();
  const [bookings, setBookings] = useState<BookingModel[]>([]);
  const [payments, setPayments] = useState<PaymentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  useEffect(() => {
    if (!user || isVisitor) {
      setLoading(false);
      return;
    }
    const unsubBookings = subscribeToExhibitorBookings(user.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });
    const unsubPayments = subscribeToExhibitorPayments(user.uid, (data) => {
      setPayments(data);
    });
    return () => {
      unsubBookings();
      unsubPayments();
    };
  }, [user, isVisitor]);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const paymentsByBooking = React.useMemo(() => {
    const map = new Map<string, PaymentModel>();
    payments.forEach((payment) => map.set(payment.bookingId, payment));
    return map;
  }, [payments]);

  // Aggregates
  const totalStalls = bookings.filter(b => b.status === 'approved' || b.status === 'pending_approval').length;
  const overallCost = bookings.filter(b => b.status === 'approved' || b.status === 'pending_approval').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  // Calculate paid amount from payments
  const paidAmount = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const remainingAmount = overallCost - paidAmount;

  if (isVisitor) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Exhibitor Feature</Text>
          <Text style={styles.emptySubtitle}>
            Bookings are available for exhibitors.{'\n'}Register as an exhibitor to book stalls.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stitch UI Magenta Header */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitleWhite}>My Bookings</Text>
        </View>
        
        <View style={styles.heroContent}>
          <Text style={styles.heroSubtitle}>OVERALL STALL COST</Text>
          <Text style={styles.heroAmount}>₹{overallCost.toLocaleString('en-IN')}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalStalls}</Text>
              <Text style={styles.statLabel}>Total Stalls</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{paidAmount.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Amount Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{remainingAmount.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {STATUS_FILTERS.map((f) => {
              const count = f.value === 'all'
                  ? bookings.length
                  : bookings.filter((b) => b.status === f.value).length;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                  onPress={() => setFilter(f.value)}
                >
                  <Text style={[styles.filterTabText, filter === f.value && styles.filterTabTextActive]}>
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.filterBadge, filter === f.value && styles.filterBadgeActive]}>
                      <Text style={[styles.filterBadgeText, filter === f.value && styles.filterBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.magenta} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No bookings yet' : `No ${filter.replace('_', ' ')} bookings`}
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
              <BookingCard
                booking={item}
                payment={paymentsByBooking.get(item.id) ?? null}
                onPress={() => router.push(`/booking-receipt?id=${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  payment,
  onPress,
}: {
  booking: BookingModel;
  payment: PaymentModel | null;
  onPress: () => void;
}) {
  const [showPayments, setShowPayments] = useState(false);
  const { color, icon, label } = getStatusStyle(booking.status);
  const date = formatDateValue(booking.createdAt);
  const paymentRecords = payment?.paymentRecords ?? [];
  const displayedRecords = showPayments ? paymentRecords : paymentRecords.slice(0, 2);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="storefront" size={24} color={Colors.magenta} />
        </View>
        <View style={styles.cardHeaderWrap}>
          <Text style={styles.stallCode}>{booking.stallCode || 'STALL'}</Text>
          <Text style={styles.hallName}>{booking.hallName || 'Exhibition Hall'}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={14} color={color} />
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Booking Date</Text>
          <Text style={styles.infoValue}>{date}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Amount</Text>
          <Text style={styles.infoValueHighlight}>₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {payment && (
        <View style={styles.paymentBox}>
          <View style={styles.paymentHeaderRow}>
            <Text style={styles.paymentHeaderTitle}>Payment History</Text>
            <Text style={styles.paymentHeaderMeta}>
              Paid ₹{(payment.paidAmount || 0).toLocaleString('en-IN')} / ₹{(payment.totalAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          {displayedRecords.length === 0 ? (
            <Text style={styles.emptyPaymentText}>No received payment entries yet.</Text>
          ) : (
            displayedRecords.map((record, index) => (
              <PaymentRecordRow
                key={`${booking.id}-${index}`}
                record={record}
                stallCode={booking.stallCode}
              />
            ))
          )}
          {paymentRecords.length > 2 && (
            <TouchableOpacity onPress={() => setShowPayments((value) => !value)} style={styles.togglePaymentBtn}>
              <Text style={styles.togglePaymentBtnText}>
                {showPayments ? 'Show Less' : `Show All (${paymentRecords.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.viewReceiptText}>View Full Receipt</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.magenta} />
      </View>
    </TouchableOpacity>
  );
}

function PaymentRecordRow({ record, stallCode }: { record: PaymentRecord; stallCode: string }) {
  const transactionId = record.transactionId || record.reference || 'N/A';
  const paymentDate = formatDateValue(record.date || record.addedAt);
  return (
    <View style={styles.paymentRecordRow}>
      <View style={styles.paymentRecordTop}>
        <Text style={styles.paymentAmount}>₹{(record.amount || 0).toLocaleString('en-IN')}</Text>
        <Text style={styles.paymentMethod}>{record.method || 'Unknown'}</Text>
      </View>
      <Text style={styles.paymentRecordMeta}>Date: {paymentDate}</Text>
      <Text style={styles.paymentRecordMeta}>Stall ID: {stallCode}</Text>
      <Text style={styles.paymentRecordMeta}>Transaction ID: {transactionId}</Text>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: BookingStatus): { color: string; icon: IoniconName; label: string } {
  switch (status) {
    case 'pending_approval':
      return { color: '#F59E0B', icon: 'time', label: 'Pending' };
    case 'approved':
      return { color: '#10B981', icon: 'checkmark-circle', label: 'Approved' };
    case 'rejected':
      return { color: '#EF4444', icon: 'close-circle', label: 'Rejected' };
    case 'cancelled':
      return { color: '#6B7280', icon: 'ban', label: 'Cancelled' };
    default:
      return { color: '#6B7280', icon: 'help-circle', label: 'Unknown' };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softPink },
  safe: { flex: 1, backgroundColor: Colors.white },
  
  heroHeader: {
    backgroundColor: Colors.magenta,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerTitleWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroAmount: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  contentArea: {
    flex: 1,
    marginTop: 4,
    zIndex: 5,
  },

  filterRow: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: Colors.magenta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabActive: {
    backgroundColor: Colors.magenta,
    borderColor: Colors.magenta,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: { color: Colors.white },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterBadgeTextActive: { color: Colors.white },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: Colors.magenta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.softPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderWrap: { flex: 1 },
  stallCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  hallName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  
  cardInfoRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoCol: { flex: 1 },
  infoLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  infoValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.magenta,
  },

  paymentBox: {
    backgroundColor: '#FDF2F8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  paymentHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#831843',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  paymentHeaderMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta,
  },
  emptyPaymentText: {
    fontSize: 12,
    color: '#64748B',
  },
  paymentRecordRow: {
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F5D0FE',
    padding: 10,
    marginBottom: 8,
  },
  paymentRecordTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4C1D95',
  },
  paymentMethod: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  paymentRecordMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  togglePaymentBtn: {
    alignSelf: 'center',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FCE7F3',
  },
  togglePaymentBtnText: {
    fontSize: 11,
    color: Colors.magenta,
    fontWeight: '700',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  viewReceiptText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.magenta,
  },

  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  topHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  bookNowBtn: { backgroundColor: Colors.magenta, padding: 12, borderRadius: 24, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookNowBtnText: { color: 'white', fontWeight: 'bold' },
});
