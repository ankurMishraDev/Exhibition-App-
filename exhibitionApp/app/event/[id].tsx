import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventsAPI } from '@/lib/api';
import { Event } from '@/types';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await EventsAPI.getEvent(id);

      if (response.data) {
        setEvent(response.data);
      } else if (response.error) {
        setError(response.error);
        Alert.alert('Error', response.message || 'Failed to load event details');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleBookStall = () => {
    if (!event) return;

    if (event.available_stalls === 0) {
      Alert.alert('Sold Out', 'No stalls available for this event.');
      return;
    }

    router.push(`/booking/${event.id}`);
  };

  const getAvailabilityColor = () => {
    if (!event) return BrandColors.gray[500];

    const percentage = (event.available_stalls / event.total_stalls) * 100;
    if (percentage > 50) return AppTheme.primary;
    if (percentage > 20) return BrandColors.warning;
    return BrandColors.error;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
          style={[styles.loadingHeader, { paddingTop: insets.top + 8 }]}
        >
          <ThemedText style={styles.loadingText}>Loading event details...</ThemedText>
        </LinearGradient>
      </ThemedView>
    );
  }

  if (error || !event) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
          style={[styles.errorHeader, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.errorHeaderTitle}>Event Details</ThemedText>
          <View style={{ width: 36 }} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconBg, { backgroundColor: AppTheme.deepTealSoft }]}>
            <Ionicons name="alert-circle" size={48} color={AppTheme.deepTeal} />
          </View>
          <ThemedText style={styles.errorTitle}>
            {error || 'Event not found'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: AppTheme.primary }]}
            onPress={fetchEventDetails}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Header with Teal Gradient */}
        <LinearGradient
          colors={[AppTheme.deepTeal, AppTheme.deepTealLight, AppTheme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + 8 }]}
        >
          {/* Top Nav */}
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.heroBackBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <ThemedText style={styles.heroNavTitle}>Event Details</ThemedText>
            <TouchableOpacity style={styles.heroShareBtn}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Event Hero Info */}
          <ThemedText style={styles.heroEventTitle}>{event.title}</ThemedText>
          <View style={styles.heroDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.heroDetailText}>
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </ThemedText>
          </View>
          <View style={styles.heroDetailRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.heroDetailText}>{event.location}</ThemedText>
          </View>

          {/* Status Badge */}
          <View style={styles.heroStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: getAvailabilityColor() }]} />
            <ThemedText style={[styles.statusText, { color: getAvailabilityColor() === AppTheme.primary ? '#A7F3D0' : '#FBBF24' }]}>
              {event.available_stalls > 0 ? `${event.available_stalls} Stalls Available` : 'Sold Out'}
            </ThemedText>
          </View>
        </LinearGradient>

        {/* Stat Badges Row */}
        <View style={styles.statBadgesRow}>
          <View style={[styles.statBadge, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
            <Ionicons name="grid-outline" size={18} color={AppTheme.deepTeal} />
            <ThemedText style={styles.statBadgeValue}>{event.total_stalls}</ThemedText>
            <ThemedText style={[styles.statBadgeLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
              Total Stalls
            </ThemedText>
          </View>
          <View style={[styles.statBadge, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={AppTheme.primary} />
            <ThemedText style={[styles.statBadgeValue, { color: getAvailabilityColor() }]}>
              {event.available_stalls}
            </ThemedText>
            <ThemedText style={[styles.statBadgeLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
              Available
            </ThemedText>
          </View>
          <View style={[styles.statBadge, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
            <Ionicons name="pricetag-outline" size={18} color={AppTheme.secondary} />
            <ThemedText style={styles.statBadgeValue}>
              {formatPrice(event.price_per_stall)}
            </ThemedText>
            <ThemedText style={[styles.statBadgeLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
              From
            </ThemedText>
          </View>
        </View>

        {/* Notification Toggle Card */}
        <View style={[styles.notificationCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
          <View style={styles.notifLeft}>
            <Ionicons name="notifications-outline" size={20} color={AppTheme.deepTeal} />
            <ThemedText style={styles.notifText}>Get notified when stalls become available</ThemedText>
          </View>
          <Switch
            value={notifyEnabled}
            onValueChange={setNotifyEnabled}
            trackColor={{ false: BrandColors.gray[300], true: AppTheme.primaryLight }}
            thumbColor={notifyEnabled ? AppTheme.primary : '#fff'}
          />
        </View>

        {/* About Event Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
          <ThemedText style={styles.sectionTitle}>About Event</ThemedText>
          <ThemedText style={[styles.sectionBody, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[600] }]}>
            {event.description}
          </ThemedText>
        </View>

        {/* Schedule Section */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
          <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>
          
          {/* Timeline items */}
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: AppTheme.primary }]} />
              <View style={[styles.timelineLine, { backgroundColor: BrandColors.gray[200] }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineLabel}>Start Date</ThemedText>
                <ThemedText style={[styles.timelineValue, { color: isDark ? BrandColors.gray[200] : BrandColors.gray[800] }]}>
                  {formatFullDate(event.start_date)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: AppTheme.secondary }]} />
              <View style={styles.timelineContent}>
                <ThemedText style={styles.timelineLabel}>End Date</ThemedText>
                <ThemedText style={[styles.timelineValue, { color: isDark ? BrandColors.gray[200] : BrandColors.gray[800] }]}>
                  {formatFullDate(event.end_date)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Event Statistics Card */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
          <ThemedText style={styles.sectionTitle}>Event Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statsGridItem}>
              <ThemedText style={[styles.statsGridValue, { color: AppTheme.deepTeal }]}>
                {event.total_stalls}
              </ThemedText>
              <ThemedText style={[styles.statsGridLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                Total Stalls
              </ThemedText>
            </View>
            <View style={styles.statsGridItem}>
              <ThemedText style={[styles.statsGridValue, { color: getAvailabilityColor() }]}>
                {event.available_stalls}
              </ThemedText>
              <ThemedText style={[styles.statsGridLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                Available
              </ThemedText>
            </View>
            <View style={styles.statsGridItem}>
              <ThemedText style={[styles.statsGridValue, { color: BrandColors.warning }]}>
                {event.total_stalls - event.available_stalls}
              </ThemedText>
              <ThemedText style={[styles.statsGridLabel, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
                Booked
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomCTA, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleBookStall}
          disabled={event.available_stalls === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              event.available_stalls > 0
                ? [AppTheme.primary, AppTheme.secondary]
                : [BrandColors.gray[400], BrandColors.gray[500]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons
              name={event.available_stalls > 0 ? 'grid-outline' : 'close-circle-outline'}
              size={20}
              color="#fff"
            />
            <ThemedText style={styles.ctaText}>
              {event.available_stalls > 0 ? 'Select Hall & Book Stall' : 'Sold Out'}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Loading
  loadingHeader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  // Error
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  errorHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: BrandColors.orange[600],
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Hero
  heroGradient: {
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroNavTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  heroShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEventTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 30,
  },
  heroDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroDetailText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stat Badges
  statBadgesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -16,
    gap: 10,
  },
  statBadge: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statBadgeValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  statBadgeLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  notifText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  // Section Cards
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Timeline
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    bottom: 0,
    width: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: BrandColors.gray[400],
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsGridItem: {
    alignItems: 'center',
  },
  statsGridValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsGridLabel: {
    fontSize: 12,
  },
  // Bottom CTA
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray[100],
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});