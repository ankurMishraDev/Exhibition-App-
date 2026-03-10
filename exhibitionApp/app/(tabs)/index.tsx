import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HallService } from '@/services/hallService';
import type { Hall } from '@/types';

// PlastPack 2026 event details — single event, static config
const PLASTPACK_EVENT = {
  name: 'PlastPack 2026',
  tagline: 'South Asia\'s Premier Plastics & Packaging Exhibition',
  dates: 'Feb 20 – Feb 24, 2026',
  venue: 'India Expo Centre, Greater Noida',
  description:
    'PlastPack 2026 brings together the global plastics and packaging industry. Showcase your products, connect with buyers, and explore cutting-edge innovations.',
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { appUser, isExhibitor } = useAuth();

  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHalls = async () => {
    try {
      const data = await HallService.getAllHalls();
      setHalls(data);
    } catch (e) {
      console.error('Failed to fetch halls:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHalls();
    setRefreshing(false);
  };

  const totalStalls = halls.reduce((sum, h) => sum + (h.stallCount ?? 0), 0);

  return (
    <ThemedView style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.greeting}>
              Hello, {appUser?.displayName?.split(' ')[0] ?? 'Welcome'} 👋
            </ThemedText>
            <ThemedText style={styles.headerTag}>
              {isExhibitor ? 'Exhibitor Account' : 'Visitor Account'}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Event name banner */}
        <View style={styles.eventBanner}>
          <ThemedText style={styles.eventName}>{PLASTPACK_EVENT.name}</ThemedText>
          <ThemedText style={styles.eventTagline}>{PLASTPACK_EVENT.tagline}</ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.deepTeal} />}
      >
        {/* ── Event Info Card ── */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={AppTheme.deepTeal} />
            <ThemedText style={[styles.infoText, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[700] }]}>
              {PLASTPACK_EVENT.dates}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={AppTheme.deepTeal} />
            <ThemedText style={[styles.infoText, { color: isDark ? BrandColors.gray[300] : BrandColors.gray[700] }]}>
              {PLASTPACK_EVENT.venue}
            </ThemedText>
          </View>
          <ThemedText style={[styles.eventDesc, { color: isDark ? BrandColors.gray[400] : BrandColors.gray[500] }]}>
            {PLASTPACK_EVENT.description}
          </ThemedText>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
            <Ionicons name="grid-outline" size={22} color={AppTheme.deepTeal} />
            <ThemedText style={[styles.statVal, { color: AppTheme.deepTeal }]}>{halls.length || '–'}</ThemedText>
            <ThemedText style={[styles.statLbl, { color: BrandColors.gray[400] }]}>Halls</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}>
            <Ionicons name="storefront-outline" size={22} color={AppTheme.primary} />
            <ThemedText style={[styles.statVal, { color: AppTheme.primary }]}>{totalStalls || '–'}</ThemedText>
            <ThemedText style={[styles.statLbl, { color: BrandColors.gray[400] }]}>Total Stalls</ThemedText>
          </View>
        </View>

        {/* ── Book Stall CTA — Exhibitor only ── */}
        {isExhibitor && (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push('/hall-selection/index')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookGradient}
            >
              <View style={styles.bookBtnLeft}>
                <Ionicons name="storefront" size={28} color="#fff" />
                <View>
                  <ThemedText style={styles.bookBtnTitle}>Book a Stall</ThemedText>
                  <ThemedText style={styles.bookBtnSub}>Choose hall & select your stall</ThemedText>
                </View>
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Halls Preview ── */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Exhibition Halls</ThemedText>
          {isExhibitor && (
            <TouchableOpacity onPress={() => router.push('/hall-selection/index')}>
              <ThemedText style={[styles.seeAll, { color: AppTheme.deepTeal }]}>View All</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={AppTheme.deepTeal} style={{ marginTop: 16 }} />
        ) : halls.length === 0 ? (
          <View style={[styles.emptyHalls, { backgroundColor: isDark ? BrandColors.gray[800] : BrandColors.gray[50] }]}>
            <Ionicons name="business-outline" size={36} color={BrandColors.gray[400]} />
            <ThemedText style={[styles.emptyText, { color: BrandColors.gray[400] }]}>
              Halls will be published soon
            </ThemedText>
          </View>
        ) : (
          halls.map((hall) => (
            <TouchableOpacity
              key={hall.id}
              style={[styles.hallCard, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}
              onPress={() => isExhibitor && router.push(`/hall/${hall.id}`)}
              activeOpacity={isExhibitor ? 0.7 : 1}
            >
              <View style={styles.hallAccent} />
              <View style={styles.hallCardBody}>
                <View style={styles.hallCardTop}>
                  <View style={[styles.hallIconBg, { backgroundColor: AppTheme.deepTealSoft ?? 'rgba(0,128,128,0.1)' }]}>
                    <Ionicons name="business" size={20} color={AppTheme.deepTeal} />
                  </View>
                  <View style={styles.hallInfo}>
                    <ThemedText style={styles.hallName}>{hall.hallName}</ThemedText>
                    {hall.stallCount !== undefined && (
                      <ThemedText style={[styles.hallStallCount, { color: BrandColors.gray[400] }]}>
                        {hall.stallCount} stalls
                      </ThemedText>
                    )}
                  </View>
                  {isExhibitor && (
                    <Ionicons name="chevron-forward" size={18} color={BrandColors.gray[400]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decoCircle2: {
    position: 'absolute', bottom: -20, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerTag: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  notifBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  eventBanner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14,
  },
  eventName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  eventTagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  infoCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, fontWeight: '500' },
  eventDesc: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 12 },
  bookBtn: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 24,
    shadowColor: AppTheme.deepTeal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  bookGradient: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  bookBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bookBtnTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bookBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  emptyHalls: {
    borderRadius: 16, padding: 32, alignItems: 'center', gap: 10,
  },
  emptyText: { fontSize: 14 },
  hallCard: {
    borderRadius: 14, marginBottom: 10, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  hallAccent: { width: 4, backgroundColor: AppTheme.deepTeal },
  hallCardBody: { flex: 1, padding: 14 },
  hallCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hallIconBg: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  hallInfo: { flex: 1 },
  hallName: { fontSize: 15, fontWeight: '600' },
  hallStallCount: { fontSize: 12, marginTop: 2 },
});
