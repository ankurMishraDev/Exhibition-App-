import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { getAllExhibitors } from '@/lib/services/exhibitorService';
import { getAllBookings } from '@/lib/services/bookingService';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';
import { BookingModel } from '@/lib/models/booking.model';

type FilterKind = 'hall' | 'segment' | 'country' | 'category';

type EnrichedExhibitor = ExhibitorModel & {
  hallName: string;
  segmentName: string;
  categoryName: string;
};

const ALL_FILTER = 'All';

function toMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const withToMillis = value as { toMillis?: () => number };
  return typeof withToMillis.toMillis === 'function' ? withToMillis.toMillis() : 0;
}

export default function ExhibitorsListScreen() {
  const router = useRouter();
  const [exhibitors, setExhibitors] = useState<EnrichedExhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKind | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [hallFilter, setHallFilter] = useState(ALL_FILTER);
  const [segmentFilter, setSegmentFilter] = useState(ALL_FILTER);
  const [countryFilter, setCountryFilter] = useState(ALL_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);

  useEffect(() => {
    (async () => {
      try {
        const [exhibitorData, allBookings] = await Promise.all([
          getAllExhibitors(),
          getAllBookings(),
        ]);

        const bookingsByExhibitor = new Map<string, BookingModel[]>();
        allBookings.forEach((booking) => {
          const list = bookingsByExhibitor.get(booking.exhibitorId) ?? [];
          list.push(booking);
          bookingsByExhibitor.set(booking.exhibitorId, list);
        });

        const enrichedData = exhibitorData.map((exhibitor) => {
          const exhibitorBookings = bookingsByExhibitor.get(exhibitor.id) ?? [];
          const latestBooking = exhibitorBookings
            .slice()
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))[0];

          const bookingCategories = Array.isArray(latestBooking?.productDetails?.categories)
            ? latestBooking?.productDetails?.categories
            : [];
          const bookingSegments = Array.isArray(latestBooking?.productDetails?.segments)
            ? latestBooking?.productDetails?.segments
            : [];

          const exhibitorSegments = exhibitor.productDetails?.segments ?? [];
          const exhibitorCategories = exhibitor.productDetails?.categories ?? [];

          return {
            ...exhibitor,
            hallName: latestBooking?.hallName || 'No Hall Assigned',
            segmentName: bookingSegments[0] || exhibitorSegments[0] || 'General',
            categoryName: bookingCategories[0] || exhibitorCategories[0] || 'Uncategorized',
          };
        });

        setExhibitors(enrichedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hallOptions = useMemo(
    () => [ALL_FILTER, ...new Set(exhibitors.map((item) => item.hallName).filter(Boolean))],
    [exhibitors],
  );
  const segmentOptions = useMemo(
    () => [ALL_FILTER, ...new Set(exhibitors.map((item) => item.segmentName).filter(Boolean))],
    [exhibitors],
  );
  const countryOptions = useMemo(
    () => [ALL_FILTER, ...new Set(exhibitors.map((item) => item.country).filter(Boolean))],
    [exhibitors],
  );
  const categoryOptions = useMemo(
    () => [ALL_FILTER, ...new Set(exhibitors.map((item) => item.categoryName).filter(Boolean))],
    [exhibitors],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exhibitors.filter((item) => {
      if (hallFilter !== ALL_FILTER && item.hallName !== hallFilter) return false;
      if (segmentFilter !== ALL_FILTER && item.segmentName !== segmentFilter) return false;
      if (countryFilter !== ALL_FILTER && item.country !== countryFilter) return false;
      if (categoryFilter !== ALL_FILTER && item.categoryName !== categoryFilter) return false;
      if (!query) return true;
      return (
        item.companyName?.toLowerCase().includes(query) ||
        item.contactPerson?.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query) ||
        item.country?.toLowerCase().includes(query) ||
        item.hallName.toLowerCase().includes(query) ||
        item.segmentName.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, countryFilter, exhibitors, hallFilter, search, segmentFilter]);

  const renderItem = ({ item }: { item: EnrichedExhibitor }) => {
    const locationStr = [item.city, item.state, item.country].filter(Boolean).join(', ') || 'Location TBD';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/exhibitor/${item.id}`)}
      >
        <View style={styles.cardContent}>
          <View style={styles.logoContainer}>
            {item.logoUrl ? (
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            ) : (
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.companyName} numberOfLines={1}>{item.companyName}</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{item.segmentName}</Text>
              </View>
              <View style={styles.hallPill}>
                <Text style={styles.hallPillText}>{item.hallName}</Text>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>{locationStr}</Text>
              </View>
              <View style={[styles.categoryPill, styles.secondaryPill]}>
                <Text style={[styles.categoryText, styles.secondaryPillText]}>{item.categoryName}</Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={Colors.primary} style={styles.arrow} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exhibitors</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies, halls, segments..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterMainBtn} onPress={() => setShowFilterMenu(true)}>
          <Ionicons name="funnel-outline" size={18} color={Colors.white} />
          <Text style={styles.filterMainBtnText}>Filter Options</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.appliedFiltersRow}>
        <Text style={styles.appliedFiltersText}>Hall: {hallFilter}</Text>
        <Text style={styles.appliedFiltersText}>Segment: {segmentFilter}</Text>
      </View>
      <View style={styles.appliedFiltersRowCompact}>
        <Text style={styles.appliedFiltersText}>Country: {countryFilter}</Text>
        <Text style={styles.appliedFiltersText}>Category: {categoryFilter}</Text>
      </View>

      <View style={styles.listWrap}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No exhibitors found for selected filters</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      <FilterModal
        visible={showFilterMenu}
        title="Choose Filter Type"
        options={['Hall', 'Segment', 'Country', 'Category']}
        current=""
        onClose={() => setShowFilterMenu(false)}
        onSelect={(value) => {
          if (value === 'Hall') setActiveFilter('hall');
          if (value === 'Segment') setActiveFilter('segment');
          if (value === 'Country') setActiveFilter('country');
          if (value === 'Category') setActiveFilter('category');
          setShowFilterMenu(false);
        }}
      />

      <FilterModal
        visible={activeFilter === 'hall'}
        title="Filter by Hall"
        options={hallOptions}
        current={hallFilter}
        onClose={() => setActiveFilter(null)}
        onSelect={(value) => {
          setHallFilter(value);
          setActiveFilter(null);
        }}
      />
      <FilterModal
        visible={activeFilter === 'segment'}
        title="Filter by Segment"
        options={segmentOptions}
        current={segmentFilter}
        onClose={() => setActiveFilter(null)}
        onSelect={(value) => {
          setSegmentFilter(value);
          setActiveFilter(null);
        }}
      />
      <FilterModal
        visible={activeFilter === 'country'}
        title="Filter by Country"
        options={countryOptions}
        current={countryFilter}
        onClose={() => setActiveFilter(null)}
        onSelect={(value) => {
          setCountryFilter(value);
          setActiveFilter(null);
        }}
      />
      <FilterModal
        visible={activeFilter === 'category'}
        title="Filter by Category"
        options={categoryOptions}
        current={categoryFilter}
        onClose={() => setActiveFilter(null)}
        onSelect={(value) => {
          setCategoryFilter(value);
          setActiveFilter(null);
        }}
      />
    </SafeAreaView>
  );
}

function FilterModal({
  visible,
  title,
  options,
  current,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  current: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((option) => {
              const selected = current ? option === current : false;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.modalItem, selected && styles.modalItemActive]}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.modalItemText, selected && styles.modalItemTextActive]}>{option}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'column',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  filterMainBtn: {
    height: 44,
    width: '100%',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  filterMainBtnText: {
    fontSize: Typography.size.sm,
    color: Colors.white,
    fontWeight: '600',
  },
  appliedFiltersRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  appliedFiltersRowCompact: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  appliedFiltersText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: Typography.fontFamily.medium,
  },
  listWrap: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 0,
    ...Shadow.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginRight: Spacing.base,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.white,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryPill: {
    backgroundColor: Colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100, // completely rounded edges as per image
  },
  categoryText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.xs,
    color: Colors.primary,
  },
  hallPill: {
    backgroundColor: Colors.saffronLight,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hallPillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.xs,
    color: Colors.saffron,
  },
  secondaryPill: {
    backgroundColor: Colors.surfaceVariant,
  },
  secondaryPillText: {
    color: Colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  arrow: {
    marginLeft: Spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    fontSize: Typography.size.base,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalItem: {
    minHeight: 42,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalItemActive: {
    backgroundColor: Colors.primarySurface,
  },
  modalItemText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  modalItemTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
 
