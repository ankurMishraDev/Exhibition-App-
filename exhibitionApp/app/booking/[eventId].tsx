import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { PaymentModal, SuccessModal } from '@/components/BookingModals';
import SkiaSeatMap from '@/components/SkiaSeatMap';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { EventsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Event, Stall } from '@/types';

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stallsReady, setStallsReady] = useState(false);
  
  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    bookingId: string;
    stallNumber: string;
    amount: number;
  } | null>(null);

  const fetchEventAndStalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event details
      const eventResponse = await EventsAPI.getEvent(eventId);
      if (eventResponse.error) {
        setError(eventResponse.error);
        setLoading(false);
        return;
      }

      if (eventResponse.data) {
        setEvent(eventResponse.data);
      }

      // Fetch stalls for this event
      const stallsResponse = await EventsAPI.getEventStalls(eventId);
      if (stallsResponse.error) {
        setError(stallsResponse.error);
        Alert.alert('Error', stallsResponse.message || 'Failed to load stalls');
        setStallsReady(false);
      } else if (stallsResponse.data) {
        // Validate stalls data before setting
        const validStalls = stallsResponse.data.filter(stall => 
          stall &&
          stall.id &&
          typeof stall.position_x === 'number' &&
          typeof stall.position_y === 'number' &&
          !isNaN(stall.position_x) &&
          !isNaN(stall.position_y)
        );

        if (validStalls.length > 0) {
          console.log('[BookingScreen] Setting stalls ready:', validStalls.length, 'valid stalls');
          setStalls(validStalls);
          setStallsReady(true);
        } else {
          console.log('[BookingScreen] No valid stalls found');
          setError('No valid stalls found for this event');
          setStallsReady(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to book a stall', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') }
      ]);
      return;
    }

    fetchEventAndStalls();

    // Setup Realtime subscription for stall updates
    const channel = supabase
      .channel(`stalls-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stalls',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('[Realtime] Stall update:', payload);
          
          // Update local stall status
          setStalls(prevStalls =>
            prevStalls.map(stall =>
              stall.id === payload.new.id
                ? { ...stall, status: payload.new.status }
                : stall
            )
          );

          // Clear selection if the selected stall was booked by someone else
          setSelectedStall(prev => {
            if (prev?.id === payload.new.id && payload.new.status !== 'available') {
              Alert.alert(
                'Stall Unavailable',
                'This stall was just booked by another user. Please select another stall.',
                [{ text: 'OK' }]
              );
              return null;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEventAndStalls, user, eventId]);

  const handleStallSelect = (stall: Stall) => {
    if (stall.status === 'available') {
      setSelectedStall(stall);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedStall || !event) return;
    setPaymentModalVisible(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedStall || !event || !user) return;

    try {
      setProcessingPayment(true);

      // Mock payment processing - 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call create_booking_with_lock RPC function
      // Note: This function returns UUID directly, not {booking_id: uuid}
      const { data: bookingId, error: bookingError } = await supabase.rpc('create_booking_with_lock', {
        p_event_id: event.id,
        p_stall_id: selectedStall.id,
        p_user_id: user.id,
        p_amount: selectedStall.price
      });

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to create booking');
      }

      if (!bookingId) {
        throw new Error('Booking created but no ID returned');
      }

      console.log('[Payment] Booking created:', bookingId);

      // Update booking status to confirmed
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid'
        })
        .eq('id', bookingId);

      if (updateBookingError) {
        console.error('Failed to update booking status:', updateBookingError);
      }

      // Update stall status to booked (RPC sets it to 'reserved')
      const { error: updateStallError } = await supabase
        .from('stalls')
        .update({ status: 'booked' })
        .eq('id', selectedStall.id);

      if (updateStallError) {
        console.error('Failed to update stall status:', updateStallError);
      }

      // Create mock payment record
      const paymentId = `fake_pay_${Date.now()}`;
      const { error: paymentError } = await supabase.from('payments').insert({
        id: paymentId,
        booking_id: bookingId,
        user_id: user.id,
        amount: selectedStall.price,
        currency: 'INR',
        method: 'mock',
        status: 'captured',
        razorpay_payment_id: paymentId,
        razorpay_order_id: `fake_order_${Date.now()}`,
      });

      if (paymentError) {
        console.error('Payment record creation error:', paymentError);
        // Don't fail the whole booking for payment record error
      }

      // Store booking details for success modal
      setBookingDetails({
        bookingId: bookingId,
        stallNumber: selectedStall.stall_number,
        amount: selectedStall.price,
      });

      // Update local stall status
      setStalls(prevStalls => 
        prevStalls.map(s => 
          s.id === selectedStall.id 
            ? { ...s, status: 'booked' as const } 
            : s
        )
      );

      // Close payment modal, show success modal
      setPaymentModalVisible(false);
      setProcessingPayment(false);
      setSelectedStall(null);
      setSuccessModalVisible(true);

    } catch (err: any) {
      setProcessingPayment(false);
      setPaymentModalVisible(false);
      
      Alert.alert(
        'Booking Failed',
        err.message || 'An error occurred while processing your booking. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePaymentCancel = () => {
    setPaymentModalVisible(false);
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    setBookingDetails(null);
  };

  const handleViewBookings = () => {
    setSuccessModalVisible(false);
    setBookingDetails(null);
    router.push('/(tabs)/bookings');
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  console.log('[BookingScreen] Render state:', { 
    loading, 
    error: !!error, 
    stallsReady, 
    stallsCount: stalls.length,
    hasEvent: !!event 
  });

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please login to access booking</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.green[600], BrandColors.green[800]]}
          style={styles.loadingHeader}
        >
          <ThemedText style={styles.loadingText}>Loading stall layout...</ThemedText>
        </LinearGradient>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.orange[600], BrandColors.orange[800]]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Error Loading Event
          </ThemedText>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorTitle}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: BrandColors.green[600] }]}
            onPress={fetchEventAndStalls}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[BrandColors.green[600], BrandColors.green[800]]}
        style={styles.header}
      >
       
        
        <ThemedText type="title" style={styles.headerTitle}>
          Select Your Stall
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: BrandColors.green[100] }]}>
          {event?.title}
        </ThemedText>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seat Map */}
        <View style={styles.seatMapSection}>
          {stallsReady && stalls.length > 0 ? (
            <SkiaSeatMap
              key={`stalls-${stalls.length}-${stallsReady}`}
              eventId={eventId}
              stalls={stalls}
              onStallSelect={handleStallSelect}
              selectedStallId={selectedStall?.id}
            />
          ) : (
            <View style={styles.noStallsContainer}>
              <ThemedText style={styles.noStallsIcon}>🎫</ThemedText>
              <ThemedText style={styles.noStallsTitle}>No Stalls Available</ThemedText>
              <ThemedText style={styles.noStallsText}>
                {error || 'Stall layout data is not available for this event.'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Selected Stall Details */}
        {selectedStall && (
          <View style={[styles.selectedStallCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <View style={styles.stallHeader}>
              <ThemedText type="subtitle">Selected Stall</ThemedText>
              <TouchableOpacity onPress={() => setSelectedStall(null)}>
                <ThemedText style={[styles.clearSelection, { color: BrandColors.orange[600] }]}>
                  Clear Selection
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.stallDetails}>
              <View style={styles.stallDetailRow}>
                <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Stall Number
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: BrandColors.purple[600], fontWeight: '600' }]}>
                  {selectedStall.stall_number}
                </ThemedText>
              </View>

              <View style={styles.stallDetailRow}>
                <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Price
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: BrandColors.green[600], fontWeight: '600' }]}>
                  {formatPrice(selectedStall.price)}
                </ThemedText>
              </View>

              {selectedStall.features && (
                <View style={styles.featuresSection}>
                  <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                    Features
                  </ThemedText>
                  <View style={styles.features}>
                    {selectedStall.features.map((feature, index) => (
                      <View key={index} style={[styles.featureTag, { backgroundColor: BrandColors.green[100] }]}>
                        <ThemedText style={[styles.featureText, { color: BrandColors.green[700] }]}>
                          {feature}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Button */}
      {selectedStall && (
        <View style={[styles.bottomButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: BrandColors.green[600] }]}
            onPress={handleProceedToPayment}
          >
            <LinearGradient
              colors={[BrandColors.green[500], BrandColors.green[700]]}
              style={styles.proceedButtonGradient}
            >
              <ThemedText style={styles.proceedButtonText}>
                Proceed to Payment - {formatPrice(selectedStall.price)}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Confirmation Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        amount={selectedStall?.price || 0}
        stallNumber={selectedStall?.stall_number || ''}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
        processing={processingPayment}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        bookingId={bookingDetails?.bookingId || ''}
        stallNumber={bookingDetails?.stallNumber || ''}
        amount={bookingDetails?.amount || 0}
        eventName={event?.title || ''}
        onClose={handleSuccessClose}
        onViewBookings={handleViewBookings}
      />
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
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  loadingHeader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  seatMapSection: {
    backgroundColor: 'white',
  },
  selectedStallCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  stallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearSelection: {
    fontSize: 14,
    fontWeight: '500',
  },
  stallDetails: {
    gap: 12,
  },
  stallDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
  },
  featuresSection: {
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
  bottomButton: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  proceedButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proceedButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
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
  noStallsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  noStallsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noStallsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noStallsText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});