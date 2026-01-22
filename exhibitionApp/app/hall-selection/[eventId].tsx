import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HallH2Layout, HallH3Layout, HallH7Layout } from '@/components/HallLayouts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { EventsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Event, Stall } from '@/types';
import hallLayoutsData from '@/constants/hallLayouts.json';

export default function HallSelectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { eventId, hallId } = useLocalSearchParams<{ eventId: string; hallId?: string }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  // Use hallId from params (selected on booking page)
  const selectedHall = hallId || 'H2';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEventAndStalls = useCallback(async () => {
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

      const stallsResponse = await EventsAPI.getEventStalls(eventId);
      if (stallsResponse.error) {
        setError(stallsResponse.error);
      } else if (stallsResponse.data) {
        const validStalls = stallsResponse.data.filter(stall => 
          stall && stall.id && stall.stall_number
        );
        setStalls(validStalls);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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

    const channel = supabase
      .channel(`hall-stalls-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stalls',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setStalls(prevStalls =>
            prevStalls.map(stall =>
              stall.id === payload.new.id
                ? { ...stall, status: payload.new.status }
                : stall
            )
          );

          setSelectedStall(prev => {
            if (prev?.id === payload.new.id && payload.new.status !== 'available') {
              Alert.alert('Stall Unavailable', 'This stall was just booked.');
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
      setSelectedStall(prev => prev?.id === stall.id ? null : stall);
    }
  };

  const handleProceed = () => {
    if (!selectedStall || !event) return;
    
    router.push({
      pathname: `/booking/${event.id}`,
      params: {
        selectedStallId: selectedStall.id,
        selectedStallNumber: selectedStall.stall_number,
        selectedStallPrice: selectedStall.price.toString(),
        selectedHallId: selectedStall.hall_id || 'H2',
      }
    } as any);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Get hall name from layout data
  const getHallName = (hallId: string) => {
    const hall = hallLayoutsData.halls.find(h => h.id === hallId);
    return hall?.name || hallId;
  };

  // Filter stalls for the selected hall
  const hallStalls = stalls.filter(stall => stall.hall_id === selectedHall);

  // Render the correct hall layout based on selectedHall
  const renderHallLayout = () => {
    const layoutProps = {
      hallId: selectedHall,
      hallName: getHallName(selectedHall),
      stalls: hallStalls,
      onStallSelect: handleStallSelect,
      selectedStallId: selectedStall?.id,
    };

    switch (selectedHall) {
      case 'H2':
        return <HallH2Layout {...layoutProps} />;
      case 'H3':
        return <HallH3Layout {...layoutProps} />;
      case 'H7':
        return <HallH7Layout {...layoutProps} />;
      default:
        return <HallH2Layout {...layoutProps} />;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ThemedText>Loading stalls...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !event) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ThemedText style={{ marginBottom: 16 }}>{error || 'Event not found'}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchEventAndStalls}>
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
      <View style={[styles.header, { backgroundColor: isDark ? '#111' : '#dcfce7' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Select Stall - {selectedHall}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Hall Layout Container */}
      <ScrollView 
        style={styles.layoutContainer}
        contentContainerStyle={styles.layoutContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHallLayout()}
      </ScrollView>

      {/* Bottom Card */}
      <View style={[styles.bottomCard, { backgroundColor: isDark ? '#111' : '#dcfce7' }]}>
        {selectedStall ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <ThemedText style={styles.infoLabel}>Hall</ThemedText>
                <ThemedText style={styles.infoValue}>{selectedStall.hall_id || 'H2'}</ThemedText>
              </View>
              <View style={styles.infoCol}>
                <ThemedText style={styles.infoLabel}>Selected Stall</ThemedText>
                <ThemedText style={[styles.infoValue, { color: BrandColors.green[600] }]}>
                  {selectedStall.stall_number}
                </ThemedText>
              </View>
              <View style={styles.infoCol}>
                <ThemedText style={styles.infoLabel}>Event</ThemedText>
                <ThemedText style={styles.infoValue} numberOfLines={1}>
                  {event?.title?.substring(0, 8)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View>
                <ThemedText style={styles.priceLabel}>Total Price</ThemedText>
                <ThemedText style={styles.priceValue}>{formatPrice(selectedStall.price)}</ThemedText>
              </View>
              <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                <Ionicons name="arrow-forward" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noSelection}>
            <ThemedText style={{ color: '#6B7280', fontSize: 15 }}>
              Tap on a green stall to select
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  layoutContainer: {
    flex: 1,
  },
  layoutContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomCard: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  infoCol: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: BrandColors.green[700],
  },
  proceedBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.green[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSelection: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: BrandColors.green[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
