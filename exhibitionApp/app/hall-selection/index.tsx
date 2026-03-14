import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Modal,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllHalls } from '@/lib/services/hallService';
import { subscribeToHallStalls } from '@/lib/services/stallService';
import { HallModel } from '@/lib/models/hall.model';
import { StallModel, StallStatus } from '@/lib/models/stall.model';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const STALL_SIZE = (width - Spacing.base * 2 - Spacing.sm * 3) / 4;

export default function HallSelectionScreen() {
  const router = useRouter();
  const [halls, setHalls] = useState<HallModel[]>([]);
  const [selectedHall, setSelectedHall] = useState<HallModel | null>(null);
  const [stalls, setStalls] = useState<StallModel[]>([]);
  const [selectedStall, setSelectedStall] = useState<StallModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [showEventMap, setShowEventMap] = useState(false);
  const [showHallMap, setShowHallMap] = useState(false);
  const [showHallDropdown, setShowHallDropdown] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Load halls initially
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllHalls();
        setHalls(data);
        if (data.length > 0) setSelectedHall(data[0]);
      } catch {
        Alert.alert('Error', 'Could not load halls. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Subscribe to stalls of selected hall
  useEffect(() => {
    if (!selectedHall) return;
    setLoadingStalls(true);
    setSelectedStall(null);
    const unsubscribe = subscribeToHallStalls(selectedHall.id, (data) => {
      setStalls(data);
      setLoadingStalls(false);
    });
    return unsubscribe;
  }, [selectedHall]);

  // Bottom sheet animation
  const openBottomSheet = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [slideAnim]);

  const closeBottomSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSelectedStall(null));
  }, [slideAnim]);

  function handleStallPress(stall: StallModel) {
    if (stall.status === 'booked') return; // already booked
    setSelectedStall(stall);
    openBottomSheet();
  }

  function handleProceed() {
    if (!selectedStall || !selectedHall) return;
    closeBottomSheet();
    router.push({
      pathname: '/exhibitor-details',
      params: {
        stallId: selectedStall.id,
        hallId: selectedHall.id,
      },
    });
  }

  const availableCount = stalls.filter((s) => s.status === 'available').length;
  const bookedCount = stalls.filter((s) => s.status === 'booked').length;
  const reservedCount = stalls.filter((s) => s.status === 'reserved').length;

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading halls...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Hall</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Map Buttons */}
        <View style={styles.mapRow}>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => setShowEventMap(true)}
          >
            <Ionicons name="map-outline" size={16} color={Colors.primary} />
            <Text style={styles.mapBtnText}>Event Map</Text>
          </TouchableOpacity>
          {selectedHall?.hallMapUrl && (
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => setShowHallMap(true)}
            >
              <Ionicons name="grid-outline" size={16} color={Colors.primary} />
              <Text style={styles.mapBtnText}>Hall Map</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hall Dropdown */}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowHallDropdown(true)}
          >
            <Text style={styles.dropdownBtnText}>
              {selectedHall ? selectedHall.hallName : 'Select a Hall'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Hall Stats */}
        {selectedHall && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <View style={[styles.statusDot, { backgroundColor: Colors.available }]} />
              <Text style={styles.statText}>{availableCount} Available</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statusDot, { backgroundColor: Colors.reserved }]} />
              <Text style={styles.statText}>{reservedCount} Reserved</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statusDot, { backgroundColor: Colors.booked }]} />
              <Text style={styles.statText}>{bookedCount} Booked</Text>
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          {LEGEND_ITEMS.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Stall Grid */}
        <View style={[styles.gridContainer, { flex: 1 }]}>
          {loadingStalls ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginVertical: Spacing['3xl'] }}
            />
          ) : stalls.length === 0 ? (
            <View style={styles.emptyGrid}>
              <Ionicons name="grid-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyGridText}>No stalls configured for this hall yet</Text>
            </View>
          ) : (
            <FlatList
              data={stalls}
              keyExtractor={(item) => item.id}
              numColumns={4}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <StallCell
                  stall={item}
                  isSelected={selectedStall?.id === item.id}
                  onPress={() => handleStallPress(item)}
                />
              )}
            />
          )}
        </View>
      </View>

      {/* Bottom Sheet — Stall Detail */}
      {selectedStall && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeBottomSheet}
          />
          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetStallCode}>{selectedStall.stallCode}</Text>
                <Text style={styles.sheetHall}>{selectedHall?.hallName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedStall.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedStall.status) }]}>
                  {selectedStall.status.charAt(0).toUpperCase() + selectedStall.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.sheetDetails}>
              <DetailRow icon="resize-outline" label="Size" value={`${selectedStall.length}m × ${selectedStall.breadth}m (${selectedStall.area} sqm)`} />
              <DetailRow icon="layers-outline" label="Space Type" value={selectedStall.spaceType} />
              <DetailRow icon="cash-outline" label="Base Price" value={`₹${selectedStall.basePrice.toLocaleString('en-IN')}`} />
              <DetailRow icon="receipt-outline" label="GST (18%)" value={`₹${selectedStall.gstAmount.toLocaleString('en-IN')}`} />
              <DetailRow icon="pricetag-outline" label="Total Price" value={`₹${selectedStall.totalPrice.toLocaleString('en-IN')}`} highlight />
              {selectedStall.features.length > 0 && (
                <View style={styles.featuresRow}>
                  {selectedStall.features.map((f) => (
                    <View key={f} style={styles.featureChip}>
                      <Text style={styles.featureChipText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {selectedStall.status === 'available' && (
              <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
                <Text style={styles.proceedBtnText}>Proceed to Booking</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}

            {selectedStall.status === 'reserved' && (
              <View style={styles.notAvailableMsg}>
                <Ionicons name="time-outline" size={18} color={Colors.reserved} />
                <Text style={styles.notAvailableMsgText}>
                  This stall is currently being reserved by another exhibitor.
                </Text>
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* Hall Dropdown Modal */}
      <Modal
        visible={showHallDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHallDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowHallDropdown(false)}
        >
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Select a Hall</Text>
            <ScrollView>
              {halls.map((hall) => (
                <TouchableOpacity
                  key={hall.id}
                  style={[
                    styles.dropdownItem,
                    selectedHall?.id === hall.id && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSelectedHall(hall);
                    setShowHallDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedHall?.id === hall.id && styles.dropdownItemTextActive
                  ]}>
                    {hall.hallName}
                  </Text>
                  {selectedHall?.id === hall.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full-screen Map Modals */}
      <MapModal
        visible={showEventMap}
        title="Event Map"
        imageUrl={halls[0]?.eventMapUrl}
        onClose={() => setShowEventMap(false)}
      />
      <MapModal
        visible={showHallMap}
        title={`${selectedHall?.hallName} Map`}
        imageUrl={selectedHall?.hallMapUrl}
        onClose={() => setShowHallMap(false)}
      />
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StallCell({
  stall,
  isSelected,
  onPress,
}: {
  stall: StallModel;
  isSelected: boolean;
  onPress: () => void;
}) {
  const bg = isSelected
    ? Colors.primarySurface
    : stall.status === 'available'
    ? Colors.availableLight
    : stall.status === 'reserved'
    ? Colors.reservedLight
    : Colors.bookedLight;

  const border = isSelected
    ? Colors.primary
    : stall.status === 'available'
    ? Colors.available
    : stall.status === 'reserved'
    ? Colors.reserved
    : Colors.booked;

  const isDisabled = stall.status === 'booked';

  return (
    <TouchableOpacity
      style={[
        styles.stallCell,
        { backgroundColor: bg, borderColor: border },
        isSelected && styles.stallCellSelected,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      <Text style={[styles.stallCellText, isDisabled && styles.stallCellTextDisabled]}>
        {stall.stallCode}
      </Text>
      {stall.status === 'booked' && (
        <Ionicons name="lock-closed" size={10} color={Colors.booked} />
      )}
    </TouchableOpacity>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as never} size={16} color={Colors.textMuted} style={{ width: 20 }} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
    </View>
  );
}

function MapModal({
  visible,
  title,
  imageUrl,
  onClose,
}: {
  visible: boolean;
  title: string;
  imageUrl?: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.mapModalSafe}>
        <View style={styles.mapModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.mapCloseBtn}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.mapModalTitle}>{title}</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.mapModalBody}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.mapImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.mapPlaceholderText}>Map not uploaded yet</Text>
              <Text style={styles.mapPlaceholderSub}>Admin will upload the map from the admin panel</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: 'Available', color: Colors.available },
  { label: 'Reserved', color: Colors.reserved },
  { label: 'Booked', color: Colors.booked },
];

function getStatusColor(status: StallStatus): string {
  switch (status) {
    case 'available': return Colors.available;
    case 'reserved': return Colors.reserved;
    case 'booked': return Colors.booked;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  loaderText: { fontSize: Typography.size.sm, color: Colors.textMuted },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Map buttons
  mapRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  mapBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Hall tabs
  hallTabs: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  hallTabsContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 0,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownBtnText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dropdownModalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    maxHeight: height * 0.6,
    overflow: 'hidden',
  },
  dropdownModalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primarySurface,
  },
  dropdownItemText: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  hallTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  hallTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  hallTabText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  hallTabTextActive: { color: Colors.white },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: Typography.size.xs, fontWeight: '500', color: Colors.textSecondary },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 14, height: 14, borderRadius: 3 },
  legendText: { fontSize: Typography.size.xs, color: Colors.textSecondary },

  // Grid
  gridContainer: { paddingHorizontal: Spacing.base },
  gridRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
  stallCell: {
    width: STALL_SIZE,
    height: STALL_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stallCellSelected: { borderWidth: 2.5 },
  stallCellText: {
    fontSize: Typography.size.xs - 1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stallCellTextDisabled: { color: Colors.textMuted },

  emptyGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyGridText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
    ...Shadow.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  sheetStallCode: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sheetHall: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: Typography.size.xs, fontWeight: '700' },
  sheetDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailValueHighlight: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featureChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
  },
  featureChipText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: '500',
  },

  proceedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  proceedBtnText: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontWeight: '700',
  },
  notAvailableMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.reservedLight,
    borderRadius: Radius.md,
  },
  notAvailableMsgText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // Map Modal
  mapModalSafe: { flex: 1, backgroundColor: Colors.background },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mapCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapModalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mapModalBody: { flex: 1, backgroundColor: '#000' },
  mapImage: { width: '100%', height: '100%' },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  mapPlaceholderText: {
    fontSize: Typography.size.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mapPlaceholderSub: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
