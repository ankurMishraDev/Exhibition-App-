import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { EventsAPI } from '@/lib/api';
import { Event } from '@/types';

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    if (percentage > 50) return BrandColors.green[500];
    if (percentage > 20) return BrandColors.orange[500];
    return BrandColors.purple[500];
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.purple[600], BrandColors.purple[800]]}
          style={styles.loadingHeader}
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
          colors={[BrandColors.orange[600], BrandColors.orange[800]]}
          style={styles.loadingHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorTitle}>
            {error || 'Event not found'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: BrandColors.purple[600] }]}
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
      <ScrollView  showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {event.image_url && (
          <Image
            source={{ uri: event.image_url }}
            style={[styles.heroImage]}
            contentFit="cover"
          />
        )}

        {/* Header with gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.headerOverlay}
        >
          
        </LinearGradient>

        <View style={styles.content}>
          {/* Event Title */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={[styles.eventTitle, { marginTop: 20 }]}>
              {event.title}
            </ThemedText>
            
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getAvailabilityColor() }]} />
              <ThemedText style={[styles.statusText, { color: getAvailabilityColor() }]}>
                {event.available_stalls > 0 ? `${event.available_stalls} Available` : 'Sold Out'}
              </ThemedText>
            </View>
          </View>

          {/* Event Details */}
          <View style={[styles.detailsCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                📍 Location
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {event.location}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                📅 Start Date
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(event.start_date)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                🏁 End Date
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(event.end_date)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                💰 Price per Stall
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: BrandColors.green[600], fontWeight: '600' }]}>
                {formatPrice(event.price_per_stall)}
              </ThemedText>
            </View>
          </View>

          {/* Statistics */}
          <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <ThemedText type="subtitle" style={styles.statsTitle}>
              Event Statistics
            </ThemedText>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: BrandColors.purple[600] }]}>
                  {event.total_stalls}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Total Stalls
                </ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: getAvailabilityColor() }]}>
                  {event.available_stalls}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Available
                </ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: BrandColors.orange[600] }]}>
                  {event.total_stalls - event.available_stalls}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Booked
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={[styles.descriptionCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <ThemedText type="subtitle" style={styles.descriptionTitle}>
              About This Event
            </ThemedText>
            <ThemedText style={[styles.descriptionText, { color: Colors[colorScheme ?? 'light'].icon }]}>
              {event.description}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            { 
              backgroundColor: event.available_stalls > 0 ? BrandColors.purple[600] : BrandColors.gray[400]
            }
          ]}
          onPress={handleBookStall}
          disabled={event.available_stalls === 0}
        >
          <LinearGradient
            colors={
              event.available_stalls > 0
                ? [BrandColors.purple[500], BrandColors.purple[700]]
                : [BrandColors.gray[400], BrandColors.gray[500]]
            }
            style={styles.bookButtonGradient}
          >
            <ThemedText style={styles.bookButtonText}>
              {event.available_stalls > 0 ? 'Book Your Stall' : 'Sold Out'}
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
  heroImage: {
    width: '100%',
    height: 300,
   
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
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
  titleSection: {
    marginBottom: 20,
  },
  eventTitle: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  descriptionTitle: {
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 22,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
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
});