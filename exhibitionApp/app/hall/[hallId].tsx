import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppTheme, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { HallService } from '@/services/hallService';
import { StallService } from '@/services/stallService';
import type { Hall, Stall, StallStatus } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STALL_SIZE = (SCREEN_WIDTH - 16 * 2 - 3 * 8) / 4; // 4 cols, 8px gap

const STATUS_COLORS: Record<StallStatus, string> = {
  available: '#22C55E',
  reserved: '#EAB308',
  booked: '#9CA3AF',
};

export default function HallDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { hallId } = useLocalSearchParams<{ hallId: string }>();
  const { isExhibitor } = useAuth();

  const [hall, setHall] = useState<Hall | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [mapModal, setMapModal] = useState<'hall' | 'event' | null>(null);

  useEffect(() => {
    if (!hallId) return;

    HallService.getHall(hallId).then(setHall);

    const unsubscribe = StallService.subscribeToHallStalls(hallId, (updated) => {
      setStalls(updated);
      setLoading(false);
    });
    return unsubscribe;
  }, [hallId]);

  const stats = stalls.reduce(
    (acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; },
    { available: 0, reserved: 0, booked: 0 } as Record<StallStatus, number>
  );

  const renderStall = useCallback(
    ({ item }: { item: Stall }) => {
      const isAvailable = item.status === 'available';
      return (
        <TouchableOpacity
          style={[
            styles.stallCell,
            {
              backgroundColor: STATUS_COLORS[item.status],
              opacity: item.status === 'booked' ? 0.65 : 1,
            },
          ]}
          onPress={() => isAvailable && setSelectedStall(item)}
          activeOpacity={isAvailable ? 0.75 : 1}
          disabled={item.status === 'booked'}
        >
          <ThemedText style={styles.stallCode}>{item.stallCode}</ThemedText>
          <ThemedText style={styles.stallSize}>
            {item.length}×{item.breadth}
          </ThemedText>
        </TouchableOpacity>
      );
    },
    []
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.hallName}>{hall?.hallName ?? 'Loading...'}</ThemedText>
            <ThemedText style={styles.hallSub}>Tap an available stall to proceed</ThemedText>
          </View>
        </View>

        {/* Map buttons */}
        <View style={styles.mapBtns}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => setMapModal('event')}
            disabled={!hall?.eventMap}
          >
            <Ionicons name="map-outline" size={14} color="#fff" />
            <ThemedText style={styles.mapBtnText}>Event Map</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => setMapModal('hall')}
            disabled={!hall?.hallMap}
          >
            <Ionicons name="grid-outline" size={14} color="#fff" />
            <ThemedText style={styles.mapBtnText}>Hall Map</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {(['available', 'reserved', 'booked'] as StallStatus[]).map((s) => (
            <View key={s} style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: STATUS_COLORS[s] }]} />
              <ThemedText style={styles.statCount}>{stats[s]}</ThemedText>
              <ThemedText style={styles.statLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</ThemedText>
            </View>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppTheme.deepTeal} />
        </View>
      ) : (
        <FlatList
          data={stalls}
          renderItem={renderStall}
          keyExtractor={(item) => item.id}
          numColumns={4}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Stall Detail Bottom Sheet ── */}
      <Modal
        visible={!!selectedStall}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStall(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetDismiss} onPress={() => setSelectedStall(null)} />
          {selectedStall && (
            <View style={[styles.sheet, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <ThemedText style={styles.sheetTitle}>Stall {selectedStall.stallCode}</ThemedText>
                <TouchableOpacity onPress={() => setSelectedStall(null)}>
                  <Ionicons name="close" size={22} color={BrandColors.gray[400]} />
                </TouchableOpacity>
              </View>

              {/* Stall details */}
              <View style={[styles.detailGrid, { borderColor: isDark ? BrandColors.gray[700] : BrandColors.gray[100] }]}>
                {[
                  { label: 'Hall', value: hall?.hallName ?? '–' },
                  { label: 'Stall Code', value: selectedStall.stallCode },
                  { label: 'Dimensions', value: `${selectedStall.length}m × ${selectedStall.breadth}m` },
                  { label: 'Space Type', value: selectedStall.spaceType },
                  { label: 'Status', value: 'Available' },
                  {
                    label: 'Price',
                    value: `₹${selectedStall.price.toLocaleString('en-IN')}`,
                    highlight: true,
                  },
                ].map(({ label, value, highlight }) => (
                  <View key={label} style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: BrandColors.gray[400] }]}>
                      {label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.detailValue,
                        highlight && { color: AppTheme.deepTeal, fontWeight: '700' },
                      ]}
                    >
                      {value}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Features */}
              {selectedStall.features?.length > 0 && (
                <View style={styles.featuresRow}>
                  {selectedStall.features.map((f) => (
                    <View key={f} style={[styles.featureTag, { backgroundColor: 'rgba(0,128,128,0.1)' }]}>
                      <ThemedText style={[styles.featureText, { color: AppTheme.deepTeal }]}>{f}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {isExhibitor && selectedStall.status === 'available' && (
                <TouchableOpacity
                  style={styles.proceedBtn}
                  onPress={() => {
                    setSelectedStall(null);
                    router.push(`/exhibitor-details?stallId=${selectedStall.id}&hallId=${hallId}`);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proceedGradient}
                  >
                    <ThemedText style={styles.proceedText}>Proceed to Booking</ThemedText>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* ── Full-screen Map Modal ── */}
      <Modal
        visible={!!mapModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setMapModal(null)}
      >
        <View style={[styles.mapFull, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.mapCloseBtn} onPress={() => setMapModal(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.mapFullTitle}>
            {mapModal === 'event' ? 'PlastPack 2026 — Event Map' : `${hall?.hallName} — Floor Plan`}
          </ThemedText>
          {(mapModal === 'event' ? hall?.eventMap : hall?.hallMap) ? (
            <Image
              source={{ uri: mapModal === 'event' ? hall!.eventMap! : hall!.hallMap! }}
              style={styles.mapImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color={BrandColors.gray[400]} />
              <ThemedText style={{ color: BrandColors.gray[400], marginTop: 12 }}>
                Map not yet uploaded
              </ThemedText>
            </View>
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  hallName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  hallSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  mapBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  mapBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { width: 10, height: 10, borderRadius: 5 },
  statCount: { fontSize: 13, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: 16, paddingBottom: 40 },
  gridRow: { gap: 8 },
  stallCell: {
    width: STALL_SIZE, height: STALL_SIZE,
    borderRadius: 8, justifyContent: 'center',
    alignItems: 'center', marginBottom: 8,
  },
  stallCode: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stallSize: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Bottom sheet
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetDismiss: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BrandColors.gray[300],
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  detailGrid: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  featureTag: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  featureText: { fontSize: 12, fontWeight: '600' },
  proceedBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  proceedGradient: {
    height: 54, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  proceedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Map modal
  mapFull: { flex: 1, backgroundColor: '#000' },
  mapCloseBtn: {
    position: 'absolute', top: 12, right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapFullTitle: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    textAlign: 'center', marginTop: 56, marginBottom: 12,
  },
  mapImage: { flex: 1, width: '100%' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
