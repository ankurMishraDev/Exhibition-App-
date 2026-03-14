import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [notify, setNotify] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient 
          colors={['#A82379', '#631046']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.heroCard}
        >
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={12} color={Colors.white} />
            <Text style={styles.dateText}>Mar 15 - Mar 22, 2026</Text>
          </View>
          <Text style={styles.heroTitle}>India International{'\n'}Trade Fair 2026</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={Colors.white} />
            <Text style={styles.locationText}>Pragati Maidan, New Delhi</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="storefront" size={14} color={Colors.primary} />
              <Text style={styles.statLabel}>TOTAL STALLS</Text>
            </View>
            <Text style={styles.statValue}>250</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              <Text style={styles.statLabel}>AVAILABLE</Text>
            </View>
            <Text style={styles.statValue}>128</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconRow}>
              <Ionicons name="pricetag" size={14} color={Colors.primary} />
              <Text style={styles.statLabel}>PRICE</Text>
            </View>
            <Text style={styles.statValue}>₹15k+</Text>
          </View>
        </ScrollView>

        {/* Notification Toggle */}
        <View style={styles.notifyCard}>
          <View style={styles.notifyIcon}>
            <Ionicons name="notifications" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.notifyText}>Get notified when stalls{'\n'}become available</Text>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.aboutText}>
            Join the largest trade fair in South Asia. The India International Trade Fair (IITF) is a premier event organized by the India Trade Promotion Organisation (ITPO). This year&apos;s theme focuses on &quot;Sustainable Development and Digital Innovation&quot;, showcasing products from over 25 countries.
          </Text>
          <TouchableOpacity>
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>View full agenda</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={styles.timeText}>09:30 AM - 11:00 AM</Text>
                <Text style={styles.timelineTitle}>Inauguration Ceremony</Text>
                <Text style={styles.timelineSub}>Main Auditorium, Hall 1</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={[styles.timelineLine, { backgroundColor: Colors.border }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timeText}>11:30 AM - 01:00 PM</Text>
                <Text style={styles.timelineTitle}>Panel Discussion: Future of Trade</Text>
                <Text style={styles.timelineSub}>Conference Room A</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#CCD3DF' }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timeText, { color: '#8A94A6' }]}>02:00 PM - 05:00 PM</Text>
                <Text style={[styles.timelineTitle, { color: '#8A94A6' }]}>Networking Session</Text>
                <Text style={styles.timelineSub}>Exhibition Grounds</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapContainer}>
            <View style={{ flex: 1, backgroundColor: '#E5E7EB', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="map-outline" size={48} color={Colors.border} />
            </View>
            <TouchableOpacity style={styles.directionsBtn}>
              <Ionicons name="navigate" size={16} color={Colors.primary} />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Fixed Area */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/hall-selection')}>
          <Text style={styles.bookBtnText}>Select Hall & Book Stall</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  dateText: { color: Colors.white, fontSize: Typography.size.xs, fontWeight: '600', marginLeft: 6 },
  heroTitle: { color: Colors.white, fontSize: 24, fontWeight: '800', marginBottom: Spacing.sm, lineHeight: 32 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: Colors.white, fontSize: Typography.size.sm, marginLeft: 4, fontWeight: '500' },
  
  statsContainer: { gap: Spacing.sm, marginBottom: Spacing.lg, paddingRight: Spacing.lg },
  statCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    width: width * 0.28,
    borderWidth: 1,
    borderColor: '#FFF0F5',
  },
  statIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#666', marginLeft: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#FFF0F5',
  },
  notifyIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notifyText: { flex: 1, fontSize: Typography.size.sm, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  
  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  aboutText: { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  readMoreText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '700' },
  linkText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600' },

  timeline: { marginLeft: 8 },
  timelineItem: { flexDirection: 'row', marginBottom: Spacing.lg, position: 'relative' },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    position: 'absolute',
    left: -4,
    top: 4,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    backgroundColor: Colors.primary,
    position: 'absolute',
    left: 1,
    top: 16,
    bottom: -24,
  },
  timelineContent: { paddingLeft: 24, paddingRight: Spacing.md, flex: 1 },
  timeText: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  timelineTitle: { fontSize: Typography.size.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  timelineSub: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  mapContainer: {
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: { width: '100%', height: '100%', opacity: 0.5 },
  directionsBtn: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsText: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.textPrimary, marginLeft: 6 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  bookBtnText: { color: Colors.white, fontSize: Typography.size.md, fontWeight: '700' },
});
