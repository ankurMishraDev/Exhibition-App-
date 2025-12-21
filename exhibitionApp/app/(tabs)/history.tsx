import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { PaymentsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/types';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
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
        return BrandColors.green[500];
      case 'failed':
        return '#EF4444';
      case 'refunded':
        return BrandColors.orange[500];
      default:
        return BrandColors.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'captured':
        return '✅';
      case 'failed':
        return '❌';
      case 'refunded':
        return '🔄';
      default:
        return '⏳';
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'upi':
        return '📱';
      case 'card':
        return '💳';
      case 'netbanking':
        return '🏦';
      case 'wallet':
        return '👛';
      case 'mock':
        return '🧪';
      default:
        return '💰';
    }
  };

  const renderPaymentCard = (payment: Payment) => (
    <TouchableOpacity
      key={payment.id}
      style={[styles.paymentCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}
      onPress={() => {
        // TODO: Navigate to payment details
      }}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.amountContainer}>
            <ThemedText type="subtitle" style={[styles.amount, { color: getStatusColor(payment.status) }]}>
              {formatPrice(payment.amount)}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
              <ThemedText style={styles.statusText}>
                {getStatusIcon(payment.status)} {payment.status.toUpperCase()}
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={[styles.paymentId, { color: Colors[colorScheme ?? 'light'].icon }]}>
            {payment.booking?.event?.title || 'Event'} - Stall {payment.booking?.stall?.stall_number || 'N/A'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            {getPaymentMethodIcon(payment.method)} Payment Method
          </ThemedText>
          <ThemedText style={styles.value}>
            {payment.method ? payment.method.toUpperCase() : 'N/A'}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            🆔 Transaction ID
          </ThemedText>
          <ThemedText style={styles.value} numberOfLines={1} ellipsizeMode="middle">
            {payment.razorpay_payment_id || payment.id.slice(0, 16)}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            📅 Transaction Date
          </ThemedText>
          <ThemedText style={styles.value}>
            {formatDate(payment.created_at)}
          </ThemedText>
        </View>
      </View>

      {payment.status === 'failed' && (
        <View style={styles.failedNotice}>
          <ThemedText style={[styles.failedText, { color: '#EF4444' }]}>
            ⚠️ Payment failed. Please try again or contact support.
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
      <LinearGradient
        colors={[BrandColors.orange[600], BrandColors.orange[800]]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          Payment History
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: BrandColors.orange[100] }]}>
          Track all your exhibition payments
        </ThemedText>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.orange[600]} />
          <ThemedText style={styles.loadingText}>Loading payment history...</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorState}>
              <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
              <ThemedText style={styles.errorTitle}>{error}</ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: BrandColors.orange[600] }]}
                onPress={onRefresh}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Summary Stats */}
              {payments && payments.length > 0 && (
                <View style={[styles.summaryCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
                  <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: BrandColors.green[600] }]}>
                        {formatPrice(calculateTotalSpent())}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                        Total Spent
                      </ThemedText>
                    </View>
                    
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: BrandColors.purple[600] }]}>
                        {getSuccessfulPayments()}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                        Successful Payments
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
                  <ThemedText style={styles.emptyIcon}>💳</ThemedText>
                  <ThemedText style={styles.emptyTitle}>No Payment History</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].icon }]}>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    marginBottom: 24,
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
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  paymentCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentHeader: {
    marginBottom: 16,
  },
  paymentInfo: {
    gap: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  paymentId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  failedNotice: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  failedText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: BrandColors.orange[600],
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});