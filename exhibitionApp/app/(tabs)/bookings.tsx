import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { BookingsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types';

export default function BookingsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await BookingsAPI.getUserBookings(user.id);
      if (response.error) {
        console.error('Failed to fetch bookings:', response.error);
        setBookings([]);
      } else if (response.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();

    // Setup Realtime subscription for new bookings
    if (!user) return;

    const channel = supabase
      .channel('user-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[Realtime] New booking created, refreshing list');
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
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
      case 'confirmed':
        return BrandColors.green[500];
      case 'pending':
        return BrandColors.orange[500];
      case 'cancelled':
        return BrandColors.gray[500];
      default:
        return BrandColors.purple[500];
    }
  };

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={[styles.bookingCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}
      onPress={() => {
        // TODO: Navigate to booking details
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <ThemedText type="subtitle" style={styles.eventTitle}>
            {booking.event?.title}
          </ThemedText>
          <ThemedText style={[styles.stallNumber, { color: BrandColors.purple[600] }]}>
            Stall: {booking.stall?.stall_number}
          </ThemedText>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <ThemedText style={styles.statusText}>
            {booking.status.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            📍 Location
          </ThemedText>
          <ThemedText style={styles.value}>
            {booking.event?.location}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            📅 Event Date
          </ThemedText>
          <ThemedText style={styles.value}>
            {formatDate(booking.event?.start_date || '')}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
            💰 Amount
          </ThemedText>
          <ThemedText style={[styles.value, { color: BrandColors.green[600], fontWeight: '600' }]}>
            {formatPrice(booking.amount)}
          </ThemedText>
        </View>

        {booking.stall?.features && (
          <View style={styles.featuresContainer}>
            <ThemedText style={[styles.label, { color: Colors[colorScheme ?? 'light'].icon }]}>
              ✨ Features
            </ThemedText>
            <View style={styles.features}>
              {booking.stall.features.map((feature, index) => (
                <View key={index} style={[styles.featureTag, { backgroundColor: BrandColors.purple[100] }]}>
                  <ThemedText style={[styles.featureText, { color: BrandColors.purple[700] }]}>
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.bookingFooter}>
        <ThemedText style={[styles.bookingDate, { color: Colors[colorScheme ?? 'light'].icon }]}>
          Booked on {formatDate(booking.booking_date)}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[BrandColors.green[600], BrandColors.green[800]]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          My Bookings
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: BrandColors.green[100] }]}>
          Manage your exhibition stall bookings
        </ThemedText>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {bookings.length > 0 ? (
          bookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].icon }]}>
              No bookings found
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Book your first stall to see it here
            </ThemedText>
          </View>
        )}
      </ScrollView>
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
  bookingCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  eventTitle: {
    marginBottom: 4,
  },
  stallNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 12,
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
    flex: 1,
  },
  featuresContainer: {
    marginTop: 8,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray[200],
  },
  bookingDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});