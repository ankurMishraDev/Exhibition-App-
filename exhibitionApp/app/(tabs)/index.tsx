import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EventsAPI } from '@/lib/api';
import { Event } from '@/types';

export default function EventsScreen() {
  const colorScheme = useColorScheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setError(null);
      setErrorMessage(null);
      
      const response = await EventsAPI.getEvents();
      
      if (response.data) {
        setEvents(response.data);
      } else if (response.error) {
        console.error('Failed to fetch events:', response.error);
        setError(response.error);
        setErrorMessage(response.message || null);
        setEvents([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      setError('Unexpected error occurred');
      setErrorMessage(error.message || 'Please try again');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const renderEventCard = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}
      onPress={() => router.push(`/event/${event.id}`)}
    >
      <LinearGradient
        colors={[BrandColors.purple[500], BrandColors.orange[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.eventGradient}
      />
      
      <View style={styles.eventContent}>
        <ThemedText type="subtitle" style={styles.eventTitle}>
          {event.title}
        </ThemedText>
        
        <ThemedText style={[styles.eventDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
          {event.description}
        </ThemedText>
        
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <ThemedText style={[styles.eventLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              📍 {event.location}
            </ThemedText>
          </View>
          
          <View style={styles.eventDetailRow}>
            <ThemedText style={[styles.eventLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              📅 {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </ThemedText>
          </View>
          
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.green[600] }]}>
                {event.available_stalls}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Available
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.purple[600] }]}>
                {formatPrice(event.price_per_stall)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Per Stall
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.purple[600], BrandColors.purple[800]]}
          style={styles.header}
        >
          <ThemedText type="title" style={styles.headerTitle}>
            Exhibition Events
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: BrandColors.purple[100] }]}>
            Book your stall for upcoming exhibitions
          </ThemedText>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.purple[600]} />
          <ThemedText style={styles.loadingText}>Loading events...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[BrandColors.purple[600], BrandColors.purple[800]]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          Exhibition Events
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: BrandColors.purple[100] }]}>
          Book your stall for upcoming exhibitions
        </ThemedText>
      </LinearGradient>
      
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
            {errorMessage && (
              <ThemedText style={[styles.errorMessage, { color: Colors[colorScheme ?? 'light'].icon }]}>
                {errorMessage}
              </ThemedText>
            )}
            {error.includes('Database not set up') && (
              <View style={styles.setupInstructions}>
                <ThemedText style={[styles.instructionTitle, { color: BrandColors.orange[600] }]}>
                  Setup Required:
                </ThemedText>
                <ThemedText style={[styles.instructionText, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  1. Open Supabase Dashboard{'\n'}
                  2. Go to SQL Editor{'\n'}
                  3. Run migrations from:{'\n'}
                     supabase/migrations/
                </ThemedText>
              </View>
            )}
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: BrandColors.purple[600] }]}
              onPress={onRefresh}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📅</ThemedText>
            <ThemedText style={styles.emptyTitle}>No Events Available</ThemedText>
            <ThemedText style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].icon }]}>
              No upcoming exhibitions at the moment.{'\n'}
              Check back soon for new events!
            </ThemedText>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: BrandColors.purple[600] }]}
              onPress={onRefresh}
            >
              <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          events.map(renderEventCard)
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
  eventCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  eventGradient: {
    height: 4,
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    marginBottom: 8,
  },
  eventDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLabel: {
    fontSize: 14,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray[200],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  refreshButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 8,
    textAlign: 'center',
    color: BrandColors.orange[600],
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  setupInstructions: {
    backgroundColor: BrandColors.orange[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
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
