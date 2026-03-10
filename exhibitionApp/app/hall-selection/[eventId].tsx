import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HallH2Layout, HallH3Layout, HallH7Layout } from '@/components/HallLayouts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { EventsAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Event, Stall } from '@/types';
import hallLayoutsData from '@/constants/hallLayouts.json';

export default function HallSelectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { eventId, hallId } = useLocalSearchParams<{ eventId: string; hallId?: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
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
        const validStalls = stallsResponse.data.filter(
          (stall) => stall && stall.id && stall.stall_number
        );
        setStalls(validStalls);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please login to book a stall', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') },
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
          setStalls((prevStalls) =>
            prevStalls.map((stall) =>
              stall.id === payload.new.id
                ? { ...stall, status: payload.new.status }
                : stall
            )
          );

          setSelectedStall((prev) => {
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
      setSelectedStall((prev) => (prev?.id === stall.id ? null : stall));
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
      },
    } as any);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getHallName = (hId: string) => {
    const hall = hallLayoutsData.halls.find((h) => h.id === hId);
    return hall?.name || hId;
  };

  const hallStalls = stalls.filter((stall) => stall.hall_id === selectedHall);

  // Count stall statuses
  const availableCount = hallStalls.filter((s) => s.status === 'available').length;
  const bookedCount = hallStalls.filter((s) => s.status === 'booked' || s.status === 'reserved').length;

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

      {/* Header with deep teal gradient */}
      <LinearGradient
        colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Select Hall</ThemedText>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Hall Pill Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {hallLayoutsData.halls.map((hall) => {
          const isActive = selectedHall === hall.id;
          return (
            <TouchableOpacity
              key={hall.id}
              style={[
                styles.pill,
                isActive
                  ? { backgroundColor: AppTheme.deepTeal }
                  : { backgroundColor: isDark ? BrandColors.gray[800] : '#fff', borderWidth: 1, borderColor: BrandColors.gray[200] },
              ]}
              onPress={() => {
                router.setParams({ hallId: hall.id });
              }}
            >
              <ThemedText
                style={[
                  styles.pillText,
                  isActive ? { color: '#fff' } : { color: isDark ? BrandColors.gray[300] : BrandColors.gray[600] },
                ]}
              >
                {hall.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppTheme.primary }]} />
          <ThemedText style={styles.legendLabel}>Available ({availableCount})</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandColors.error }]} />
          <ThemedText style={styles.legendLabel}>Booked ({bookedCount})</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandColors.warning }]} />
          <ThemedText style={styles.legendLabel}>Selected</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandColors.gray[300] }]} />
          <ThemedText style={styles.legendLabel}>Blocked</ThemedText>
        </View>
      </View>

      {/* Hall Layout Container */}
      <View style={styles.layoutContainer}>{renderHallLayout()}</View>

      {/* Bottom Card - Selected Stall Info */}
      {selectedStall && (
        <View style={[styles.bottomCard, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>
          {/* Stall Info Row */}
          <View style={styles.stallInfoRow}>
            <View style={styles.stallInfoCol}>
              <ThemedText style={[styles.stallInfoLabel, { color: BrandColors.gray[400] }]}>Hall</ThemedText>
              <ThemedText style={styles.stallInfoValue}>{selectedStall.hall_id || 'H2'}</ThemedText>
            </View>
            <View style={[styles.stallInfoDivider, { backgroundColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200] }]} />
            <View style={styles.stallInfoCol}>
              <ThemedText style={[styles.stallInfoLabel, { color: BrandColors.gray[400] }]}>Stall No.</ThemedText>
              <ThemedText style={[styles.stallInfoValue, { color: AppTheme.primary }]}>
                {selectedStall.stall_number}
              </ThemedText>
            </View>
            <View style={[styles.stallInfoDivider, { backgroundColor: isDark ? BrandColors.gray[700] : BrandColors.gray[200] }]} />
            <View style={styles.stallInfoCol}>
              <ThemedText style={[styles.stallInfoLabel, { color: BrandColors.gray[400] }]}>Event</ThemedText>
              <ThemedText style={styles.stallInfoValue} numberOfLines={1}>
                {event?.title?.substring(0, 10)}
              </ThemedText>
            </View>
          </View>

          {/* Features Row */}
          {selectedStall.features && selectedStall.features.length > 0 && (
            <View style={styles.featuresRow}>
              <ThemedText style={[styles.featuresLabel, { color: BrandColors.gray[400] }]}>
                Facilities:
              </ThemedText>
              {selectedStall.features.map((f, i) => (
                <View key={i} style={[styles.featureChip, { backgroundColor: AppTheme.deepTealSoft }]}>
                  <ThemedText style={[styles.featureChipText, { color: AppTheme.deepTeal }]}>{f}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Price + Proceed */}
          <View style={styles.priceRow}>
            <View>
              <ThemedText style={[styles.priceLabel, { color: BrandColors.gray[400] }]}>Total Price</ThemedText>
              <ThemedText style={[styles.priceValue, { color: AppTheme.deepTeal }]}>
                {formatPrice(selectedStall.price)}
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed} activeOpacity={0.8}>
              <LinearGradient
                colors={[AppTheme.primary, AppTheme.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proceedGradient}
              >
                <ThemedText style={styles.proceedText}>Proceed</ThemedText>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  // Pill Selector
  pillRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: BrandColors.gray[500],
  },
  // Layout
  layoutContainer: {
    flex: 1,
  },
  // Bottom Card
  bottomCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  stallInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray[100],
  },
  stallInfoCol: {
    flex: 1,
    alignItems: 'center',
  },
  stallInfoDivider: {
    width: 1,
    height: 32,
  },
  stallInfoLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  stallInfoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Features
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  featuresLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Price Row
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  proceedBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  proceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  proceedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: BrandColors.green[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
