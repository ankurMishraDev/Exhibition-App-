import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { EVENT_DATE, EVENT_LOCATION, EVENT_NAME } from '@/constants/segments';

const { width } = Dimensions.get('window');

const EVENT_STATS = [
  { label: 'Total Stalls', value: '250+', icon: 'storefront-outline' },
  { label: 'Halls', value: '10', icon: 'business-outline' },
  { label: 'Price From', value: '₹15k', icon: 'pricetag-outline' },
];

const HIGHLIGHTS = [
  { icon: 'leaf-outline', color: '#22C55E', text: 'Sustainable Packaging Solutions' },
  { icon: 'flash-outline', color: '#F59E0B', text: 'Latest Plastics Technology' },
  { icon: 'people-outline', color: '#3B82F6', text: '500+ Exhibitors Expected' },
  { icon: 'globe-outline', color: '#8B5CF6', text: 'International Participation' },
];

export default function HomeScreen() {
  const { userModel, isExhibitor } = useAuth();
  const router = useRouter();
  const firstName = userModel?.displayName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ─── Header Banner ──────────────────────────────────── */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          {/* Indian tricolor stripe at top */}
          {/* <View style={styles.tricolorBar}>
            <View style={[styles.tricolorSegment, { backgroundColor: Colors.saffron }]} />
            <View style={[styles.tricolorSegment, { backgroundColor: Colors.white }]} />
            <View style={[styles.tricolorSegment, { backgroundColor: Colors.green }]} />
          </View> */}

          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View>
                <Text style={styles.greetingText}>Hello, {firstName}! 👋</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>{EVENT_LOCATION}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Event card */}
            <View style={styles.eventCard}>
              <View style={styles.eventCardTop}>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>LIVE EVENT</Text>
                </View>
                <Text style={styles.eventName}>{EVENT_NAME}</Text>
                <Text style={styles.eventDate}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
                  {'  '}{EVENT_DATE}
                </Text>
                <Text style={styles.eventLocation}>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                  {'  '}{EVENT_LOCATION}
                </Text>
              </View>

              <View style={styles.statsRow}>
                {EVENT_STATS.map((s) => (
                  <View key={s.label} style={styles.statBox}>
                    <Ionicons name={s.icon as never} size={18} color={Colors.primary} />
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {isExhibitor && (
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => router.push('/hall-selection')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="storefront" size={20} color={Colors.white} />
                  <Text style={styles.bookBtnText}>Book a Stall</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
              )}

              {!isExhibitor && (
                <View style={styles.visitorNote}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.visitorNoteText}>
                    Visitor mode — Browse halls and exhibitor listings
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* ─── Explore Halls ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event Highlights</Text>
          </View>
          <View style={styles.highlightGrid}>
            {HIGHLIGHTS.map((h) => (
              <View key={h.text} style={styles.highlightCard}>
                <View style={[styles.highlightIcon, { backgroundColor: h.color + '20' }]}>
                  <Ionicons name={h.icon as never} size={22} color={h.color} />
                </View>
                <Text style={styles.highlightText}>{h.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── About Event ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About PlastPack</Text>
          </View>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              {"PlastPack is India's premier plastics and packaging exhibition, bringing together manufacturers, suppliers, and innovators from across the globe. This year's event showcases groundbreaking advances in sustainable plastics, modern packaging technology, and industrial processing machinery."}
            </Text>
            <TouchableOpacity style={styles.readMoreBtn} onPress={() => router.push('/event/plastpack-2026' as never)}>
              <Text style={styles.readMoreText}>View Event Details</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Quick Actions (Exhibitors only) ──────────────── */}
        {isExhibitor && (
          <View style={[styles.section, { paddingBottom: Spacing['2xl'] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/hall-selection')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.primarySurface }]}>
                  <Ionicons name="map-outline" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.actionText}>Browse Halls</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/bookings')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.saffronLight }]}>
                  <Ionicons name="ticket-outline" size={24} color={Colors.saffron} />
                </View>
                <Text style={styles.actionText}>My Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.greenLight }]}>
                  <Ionicons name="person-outline" size={24} color={Colors.green} />
                </View>
                <Text style={styles.actionText}>My Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const cardWidth = (width - Spacing['2xl'] * 2 - Spacing.md) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },

  // Banner
  banner: { paddingBottom: Spacing['3xl'] },
  tricolorBar: { flexDirection: 'row', height: 4 },
  tricolorSegment: { flex: 1 },
  bannerContent: { padding: Spacing.base },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  greetingText: {
    fontSize: Typography.size.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: Typography.size.xs, color: 'rgba(255,255,255,0.8)' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Event Card
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.lg,
  },
  eventCardTop: { marginBottom: Spacing.md },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  eventBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  eventDate: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },

  // Book Stall button
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: '700',
  },
  visitorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
  },
  visitorNoteText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },

  // Sections
  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Highlights grid
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  highlightCard: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    fontSize: Typography.size.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // About
  aboutCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  aboutText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  readMoreText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
