import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { PaymentsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setPayments([]);
      return;
    }
    
    try {
      setError(null);
      const response = await PaymentsAPI.getPaymentHistory(user.id);
      
      if (response.data) {
        setPayments(response.data);
      } else if (response.error) {
        console.error('Failed to fetch payments:', response.error);
        setError(response.error);
        setPayments([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      setError(error.message || 'An unexpected error occurred');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPayments();

    // Setup Realtime subscription for new payments
    if (!user) return;

    const channel = supabase
      .channel('user-payments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[Realtime] New payment created, refreshing history');
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
        return AppTheme.primary;
      case 'failed':
        return '#EF4444';
      case 'refunded':
        return BrandColors.orange[500];
      default:
        return BrandColors.gray[500];
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'captured':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'refunded':
        return 'refresh-circle';
      default:
        return 'time';
    }
  };

  const getPaymentMethodIcon = (method?: string): string => {
    switch (method) {
      case 'upi':
        return 'phone-portrait';
      case 'card':
        return 'card';
      case 'netbanking':
        return 'business';
      case 'wallet':
        return 'wallet';
      case 'mock':
        return 'flask';
      default:
        return 'cash';
    }
  };

  const renderPaymentCard = (payment: Payment) => (
    <TouchableOpacity
      key={payment.id}
      style={[styles.paymentCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}
      onPress={() => {
        router.push({ pathname: '/payment-receipt', params: { paymentId: payment.id } });
      }}
    >
      <View style={styles.paymentHeader}>
        <View style={[styles.paymentIconContainer, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
          <Ionicons name={getStatusIcon(payment.status) as any} size={24} color={getStatusColor(payment.status)} />
        </View>
        <View style={styles.paymentInfo}>
          <ThemedText style={[styles.amount, { color: getStatusColor(payment.status) }]}>
            {formatPrice(payment.amount)}
          </ThemedText>
          <ThemedText style={[styles.paymentLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
            {payment.booking?.event?.title || 'Event'} - Stall #{payment.booking?.stall?.stall_number || 'N/A'}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
          <ThemedText style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name={getPaymentMethodIcon(payment.method) as any} size={16} color={isDark ? BrandColors.gray[400] : BrandColors.gray[500]} />
          <ThemedText style={[styles.detailLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
            {payment.method ? payment.method.toUpperCase() : 'N/A'}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="receipt-outline" size={16} color={isDark ? BrandColors.gray[400] : BrandColors.gray[500]} />
          <ThemedText style={[styles.detailLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]} numberOfLines={1}>
            {payment.razorpay_payment_id || payment.id.slice(0, 12) + '...'}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={isDark ? BrandColors.gray[400] : BrandColors.gray[500]} />
          <ThemedText style={[styles.detailLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
            {formatDate(payment.created_at)}
          </ThemedText>
        </View>
      </View>

      {payment.status === 'failed' && (
        <View style={[styles.failedNotice, { backgroundColor: isDark ? '#3F1D1D' : '#FEF2F2' }]}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <ThemedText style={styles.failedText}>
            Payment failed. Please try again or contact support.
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  const calculateTotalSpent = () => {
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return 0;
    }
    return payments
      .filter(p => p.status === 'captured')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getSuccessfulPayments = () => {
    if (!payments || !Array.isArray(payments)) {
      return 0;
    }
    return payments.filter(p => p.status === 'captured').length;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff', paddingTop: insets.top + 8 }]}>
        <ThemedText style={styles.headerTitle}>
          Payment History
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
          Track all your exhibition payments
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppTheme.primary} />
          <ThemedText style={[styles.loadingText, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
            Loading payment history...
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorState}>
              <View style={[styles.errorIconContainer, { backgroundColor: BrandColors.orange[50] }]}>
                <Ionicons name="warning" size={40} color={BrandColors.orange[500]} />
              </View>
              <ThemedText style={[styles.errorTitle, { color: BrandColors.orange[600] }]}>{error}</ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: AppTheme.primary }]}
                onPress={onRefresh}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Summary Stats */}
              {payments && payments.length > 0 && (
                <View style={[styles.summaryCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <View style={[styles.statIconContainer, { backgroundColor: AppTheme.primarySoft }]}>
                        <Ionicons name="wallet" size={24} color={AppTheme.primary} />
                      </View>
                      <ThemedText style={[styles.statValue, { color: AppTheme.primary }]}>
                        {formatPrice(calculateTotalSpent())}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                        Total Spent
                      </ThemedText>
                    </View>
                    
                    <View style={styles.statItem}>
                      <View style={[styles.statIconContainer, { backgroundColor: AppTheme.secondarySoft }]}>
                        <Ionicons name="checkmark-done" size={24} color={AppTheme.secondary} />
                      </View>
                      <ThemedText style={[styles.statValue, { color: AppTheme.secondary }]}>
                        {getSuccessfulPayments()}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                        Successful
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}

              {/* Payment History */}
              {payments && payments.length > 0 ? (
                payments.map(renderPaymentCard)
              ) : (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: AppTheme.primarySoft }]}>
                    <Ionicons name="card-outline" size={48} color={AppTheme.primary} />
                  </View>
                  <ThemedText style={styles.emptyTitle}>No Payment History</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                    Your completed payments will appear here
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  paymentCard: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentLabel: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
  },
  failedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  failedText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});