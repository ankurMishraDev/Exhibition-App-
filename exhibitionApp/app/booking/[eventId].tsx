import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { PaymentModal, SuccessModal } from '@/components/BookingModals';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { EventsAPI, ExhibitorAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Event, Stall } from '@/types';
import hallLayoutsData from '@/constants/hallLayouts.json';

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    eventId, 
    selectedStallId, 
    selectedStallNumber, 
    selectedStallPrice,
    selectedHallId: returnedHallId 
  } = useLocalSearchParams<{ 
    eventId: string; 
    selectedStallId?: string;
    selectedStallNumber?: string;
    selectedStallPrice?: string;
    selectedHallId?: string;
  }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hall selection
  const [selectedHall, setSelectedHall] = useState<string>('H2');
  const [availableHalls, setAvailableHalls] = useState<string[]>([]);
  
  // Payment modal states
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    bookingId: string;
    stallNumber: string;
    amount: number;
  } | null>(null);

  const fetchEventDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const eventResponse = await EventsAPI.getEvent(eventId);
      if (eventResponse.error) {
        setError(eventResponse.error);
        setLoading(false);
        return;
      }

      if (eventResponse.data) {
        setEvent(eventResponse.data);
      }

      // Fetch stalls to get available halls
      const stallsResponse = await EventsAPI.getEventStalls(eventId);
      if (stallsResponse.data) {
        const hallIds = [...new Set(stallsResponse.data.map(s => s.hall_id).filter(Boolean))] as string[];
        setAvailableHalls(hallIds);
        if (hallIds.length > 0 && !returnedHallId) {
          setSelectedHall(hallIds[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId, returnedHallId]);

  // Handle selected stall from hall-selection page
  useEffect(() => {
    if (selectedStallId && selectedStallNumber && selectedStallPrice) {
      const fetchStallDetails = async () => {
        const { data, error } = await supabase
          .from('stalls')
          .select('*')
          .eq('id', selectedStallId)
          .single();
        
        if (data && !error) {
          setSelectedStall(data);
          if (data.hall_id) {
            setSelectedHall(data.hall_id);
          }
        }
      };
      fetchStallDetails();
    }
    
    // Update selected hall if returned from hall-selection
    if (returnedHallId) {
      setSelectedHall(returnedHallId);
    }
  }, [selectedStallId, selectedStallNumber, selectedStallPrice, returnedHallId]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to book a stall', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') }
      ]);
      return;
    }

    fetchEventDetails();

    const channel = supabase
      .channel(`booking-stalls-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stalls',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
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
  }, [fetchEventDetails, user, eventId]);

  const handleSelectStall = () => {
    if (!event) return;
    router.push({
      pathname: '/hall-selection/[eventId]',
      params: { 
        eventId: event.id,
        hallId: selectedHall 
      }
    } as any);
  };

  const handleProceedToPayment = async () => {
    if (!selectedStall || !event || !user) return;
    
    try {
      const response = await ExhibitorAPI.canBookStall(user.id);
      const canBook = response.data;
      
      if (!canBook) {
        Alert.alert(
          'Complete Your Profile',
          'Please complete your exhibitor profile before booking a stall.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete Profile', onPress: () => router.push('/exhibitor-details') }
          ]
        );
        return;
      }
      
      setPaymentModalVisible(true);
    } catch (error) {
      console.error('Failed to check profile:', error);
      Alert.alert('Error', 'Failed to verify profile. Please try again.');
    }
  };

  const handlePaymentConfirm = async () => {
    if (!selectedStall || !event || !user) return;

    try {
      setProcessingPayment(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: bookingResponse, error: bookingError } = await supabase.rpc('create_booking_with_lock', {
        p_event_id: event.id,
        p_stall_id: selectedStall.id,
        p_user_id: user.id,
        p_amount: selectedStall.price
      });

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to create booking');
      }

      if (!bookingResponse || !bookingResponse.success) {
        throw new Error(bookingResponse?.error || 'Booking creation failed');
      }

      const bookingId = bookingResponse.booking_id;
      
      if (!bookingId) {
        throw new Error('Booking created but no ID returned');
      }

      await supabase
        .from('bookings')
        .update({ status: 'confirmed', payment_status: 'paid' })
        .eq('id', bookingId);

      await supabase
        .from('stalls')
        .update({ status: 'booked' })
        .eq('id', selectedStall.id);

      await supabase.from('payments').insert({
        booking_id: bookingId,
        user_id: user.id,
        amount: selectedStall.price,
        currency: 'INR',
        method: 'mock',
        status: 'captured',
      });

      setBookingDetails({
        bookingId: bookingId,
        stallNumber: selectedStall.stall_number,
        amount: selectedStall.price,
      });

      setPaymentModalVisible(false);
      setProcessingPayment(false);
      setSelectedStall(null);
      setSuccessModalVisible(true);

    } catch (err: any) {
      setProcessingPayment(false);
      setPaymentModalVisible(false);
      Alert.alert('Booking Failed', err.message || 'An error occurred. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handlePaymentCancel = () => setPaymentModalVisible(false);
  const handleSuccessClose = () => { setSuccessModalVisible(false); setBookingDetails(null); };
  const handleViewBookings = () => { setSuccessModalVisible(false); setBookingDetails(null); router.push('/(tabs)/bookings'); };

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getHallName = (hallId: string) => {
    const hall = hallLayoutsData.halls.find(h => h.id === hallId);
    return hall?.name || hallId;
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText>Please login to access booking</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading event details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !event) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error || 'Event not found'}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchEventDetails}>
            <ThemedText style={{ color: 'white', fontWeight: '600' }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#111' : '#dcfce7', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Book Your Stall</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: isDark ? '#888' : '#666' }]}>
            {event?.title}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <ThemedText style={styles.cardTitle}>📅 Event Details</ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Location</ThemedText>
            <ThemedText style={styles.infoValue}>{event.location}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Date</ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Available Stalls</ThemedText>
            <ThemedText style={[styles.infoValue, { color: BrandColors.green[600], fontWeight: '700' }]}>
              {event.available_stalls} / {event.total_stalls}
            </ThemedText>
          </View>
        </View>

        {/* Hall Selection Card */}
        <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <ThemedText style={styles.cardTitle}>🏛️ Select Hall</ThemedText>
          <ThemedText style={[styles.cardDescription, { color: isDark ? '#888' : '#666' }]}>
            Choose a hall to view available stalls
          </ThemedText>
          
          {availableHalls.length > 0 && (
            <View style={[styles.pickerContainer, { borderColor: isDark ? '#333' : '#E0E0E0' }]}>
              <Picker
                selectedValue={selectedHall}
                onValueChange={(value) => {
                  setSelectedHall(value);
                  setSelectedStall(null);
                }}
                style={[styles.picker, { color: isDark ? '#fff' : '#000' }]}
                dropdownIconColor={isDark ? '#fff' : '#000'}
              >
                {availableHalls.map((hallId) => (
                  <Picker.Item key={hallId} label={getHallName(hallId)} value={hallId} />
                ))}
              </Picker>
            </View>
          )}
          
          <TouchableOpacity style={styles.viewLayoutBtn} onPress={handleSelectStall}>
            <LinearGradient
              colors={[BrandColors.purple[500], BrandColors.purple[700]]}
              style={styles.viewLayoutBtnGradient}
            >
              <Ionicons name="grid-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText style={styles.viewLayoutBtnText}>
                {selectedStall ? 'Change Stall Selection' : 'View Hall Layout & Select Stall'}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Selected Stall Card */}
        {selectedStall && (
          <View style={[styles.card, styles.selectedCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <View style={styles.selectedHeader}>
              <ThemedText style={styles.cardTitle}>✅ Selected Stall</ThemedText>
              <TouchableOpacity onPress={() => setSelectedStall(null)}>
                <ThemedText style={{ color: BrandColors.orange[600], fontWeight: '500' }}>Clear</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.stallInfoGrid}>
              <View style={styles.stallInfoItem}>
                <ThemedText style={styles.stallInfoLabel}>Stall Number</ThemedText>
                <ThemedText style={[styles.stallInfoValue, { color: BrandColors.purple[600] }]}>
                  {selectedStall.stall_number}
                </ThemedText>
              </View>
              <View style={styles.stallInfoItem}>
                <ThemedText style={styles.stallInfoLabel}>Hall</ThemedText>
                <ThemedText style={styles.stallInfoValue}>{selectedStall.hall_id}</ThemedText>
              </View>
              <View style={styles.stallInfoItem}>
                <ThemedText style={styles.stallInfoLabel}>Price</ThemedText>
                <ThemedText style={[styles.stallInfoValue, { color: BrandColors.green[600] }]}>
                  {formatPrice(selectedStall.price)}
                </ThemedText>
              </View>
            </View>

            {selectedStall.features && selectedStall.features.length > 0 && (
              <View style={styles.featuresContainer}>
                <ThemedText style={styles.stallInfoLabel}>Features</ThemedText>
                <View style={styles.featuresList}>
                  {selectedStall.features.map((feature, index) => (
                    <View key={index} style={[styles.featureTag, { backgroundColor: BrandColors.green[100] }]}>
                      <ThemedText style={{ color: BrandColors.green[700], fontSize: 12 }}>{feature}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Pricing Summary */}
        {selectedStall && (
          <View style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <ThemedText style={styles.cardTitle}>💰 Payment Summary</ThemedText>
            
            <View style={styles.pricingRow}>
              <ThemedText style={styles.pricingLabel}>Stall Price</ThemedText>
              <ThemedText style={styles.pricingValue}>{formatPrice(selectedStall.price)}</ThemedText>
            </View>
            
            <View style={styles.pricingRow}>
              <ThemedText style={styles.pricingLabel}>Taxes & Fees</ThemedText>
              <ThemedText style={styles.pricingValue}>Included</ThemedText>
            </View>
            
            <View style={[styles.pricingRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
              <ThemedText style={styles.totalValue}>{formatPrice(selectedStall.price)}</ThemedText>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      {selectedStall && (
        <View style={[styles.bottomBar, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceedToPayment}>
            <LinearGradient colors={[BrandColors.green[500], BrandColors.green[700]]} style={styles.proceedBtnGradient}>
              <ThemedText style={styles.proceedBtnText}>
                Proceed to Payment • {formatPrice(selectedStall.price)}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <PaymentModal
        visible={paymentModalVisible}
        amount={selectedStall?.price || 0}
        stallNumber={selectedStall?.stall_number || ''}
        onConfirm={handlePaymentConfirm}
        onCancel={handlePaymentCancel}
        processing={processingPayment}
      />

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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  content: { flex: 1, padding: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: { borderWidth: 2, borderColor: BrandColors.green[400] },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  cardDescription: { fontSize: 13, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '500' },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  viewLayoutBtn: { borderRadius: 12, overflow: 'hidden' },
  viewLayoutBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  viewLayoutBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stallInfoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  stallInfoItem: { alignItems: 'center' },
  stallInfoLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  stallInfoValue: { fontSize: 16, fontWeight: '700' },
  featuresContainer: { marginTop: 16 },
  featuresList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  featureTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pricingLabel: { fontSize: 14, color: '#666' },
  pricingValue: { fontSize: 14, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: BrandColors.green[700] },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  proceedBtn: { borderRadius: 14, overflow: 'hidden' },
  proceedBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  proceedBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: BrandColors.green[600], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
});
