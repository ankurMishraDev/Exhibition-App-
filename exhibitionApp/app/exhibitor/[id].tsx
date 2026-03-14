import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getExhibitorById } from '@/lib/services/exhibitorService';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';

const { width } = Dimensions.get('window');

const AppColors = {
  primary: '#9F1A71', // Magenta
  primarySoft: '#FCF3F8',
  textHeader: '#0F172A',
  textBody: '#475569',
  bgWhite: '#FFFFFF',
  bgGray: '#F8FAFC',
};

export default function ExhibitorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exhibitor, setExhibitor] = useState<ExhibitorModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getExhibitorById(id);
        setExhibitor(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </SafeAreaView>
    );
  }

  if (!exhibitor) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>Exhibitor not found</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const category = exhibitor.productDetails?.segments?.[0] || 'Uncategorized';
  const segments = exhibitor.productDetails?.segments || [];
  const locationStr = exhibitor.city ? `From ${exhibitor.city}` : 'Location TBD';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.backgroundGradient} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exhibitor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.logoWrapper}>
            {exhibitor.logoUrl ? (
              <Image source={{ uri: exhibitor.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{exhibitor.companyName?.[0]?.toUpperCase() || 'E'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.companyName}>{exhibitor.companyName}</Text>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.locationText}>{locationStr}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (exhibitor.mobile) Linking.openURL(`tel:${exhibitor.mobile}`);
            }}
          >
            <Ionicons name="call-outline" size={22} color={AppColors.primary} />
            <Text style={styles.actionText}>CALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (exhibitor.email) Linking.openURL(`mailto:${exhibitor.email}`);
            }}
          >
            <Ionicons name="mail-outline" size={22} color={AppColors.primary} />
            <Text style={styles.actionText}>EMAIL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (exhibitor.website) {
                const url = exhibitor.website.startsWith('http') ? exhibitor.website : `https://${exhibitor.website}`;
                Linking.openURL(url);
              }
            }}
          >
            <Ionicons name="globe-outline" size={22} color={AppColors.primary} />
            <Text style={styles.actionText}>WEBSITE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionMarker} />
            <Text style={styles.sectionTitle}>Company Description</Text>
          </View>
          <Text style={styles.bodyText}>
            {exhibitor.companyProfile || 'No description provided by this exhibitor yet.'}
          </Text>
        </View>

        {segments.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.sectionMarker} />
                <Text style={styles.sectionTitle}>Exhibiting Products</Text>
              </View>
              <Text style={styles.segmentCount}>{segments.length} Total</Text>
            </View>
            <View style={styles.segmentsGrid}>
              {segments.map((seg, idx) => {
                const colors = ['#66B2A1', '#5B8DEF', '#FCA5A5', '#FBBF24', '#C084FC'];
                const boxColor = colors[idx % colors.length];
                return (
                  <View key={idx} style={[styles.segmentBox, { backgroundColor: boxColor }]}>
                    <Text style={styles.segmentBoxText}>{seg}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
          <Ionicons name="map" size={20} color={AppColors.bgWhite} style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Locate on Map</Text>
          {exhibitor.city ? (
            <Text style={styles.primaryBtnSub}>  ({exhibitor.city})</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.bgWhite,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: AppColors.primarySoft,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: AppColors.bgWhite,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    zIndex: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 20,
    backgroundColor: AppColors.bgWhite,
    padding: 6,
    marginBottom: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#1B5B49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: AppColors.bgWhite,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textHeader,
    textAlign: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: AppColors.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    height: 72,
    backgroundColor: AppColors.bgWhite,
    borderWidth: 1,
    borderColor: '#F3E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: AppColors.primary,
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionMarker: {
    width: 5,
    height: 20,
    backgroundColor: AppColors.primary,
    borderRadius: 4,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textHeader,
  },
  bodyText: {
    fontSize: 14,
    color: AppColors.textBody,
    lineHeight: 24,
  },
  segmentCount: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  segmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  segmentBox: {
    height: 80,
    width: (width - 52) / 2, // 2 columns with gaps
    borderRadius: 12,
    justifyContent: 'flex-end',
    padding: 12,
  },
  segmentBoxText: {
    color: AppColors.bgWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: AppColors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.bgWhite,
  },
  primaryBtnSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textHeader,
    marginBottom: 16,
  },
  backBtnFallback: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
  },
  backBtnText: {
    fontWeight: '700',
    color: AppColors.bgWhite,
  },
});

// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   center: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   topGradient: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 300,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: Spacing.lg,
//     paddingTop: Spacing.sm,
//     paddingBottom: Spacing.md,
//     zIndex: 10,
//   },
//   iconBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: Radius.full,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size.lg,
//     color: Colors.textPrimary,
//   },
//   scrollContent: {
//     paddingHorizontal: Spacing.lg,
//     paddingTop: Spacing.md,
//   },
//   profileSection: {
//     alignItems: 'center',
//     marginBottom: Spacing['2xl'],
//   },
//   logoWrapper: {
//     width: 100,
//     height: 100,
//     borderRadius: Radius.lg,
//     backgroundColor: Colors.white,
//     padding: 4,
//     ...Shadow.md,
//     marginBottom: Spacing.lg,
//   },
//   logo: {
//     width: '100%',
//     height: '100%',
//     borderRadius: Radius.md,
//     resizeMode: 'cover',
//   },
//   logoPlaceholder: {
//     width: '100%',
//     height: '100%',
//     borderRadius: Radius.md,
//     backgroundColor: Colors.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   logoText: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size['3xl'],
//     color: Colors.white,
//   },
//   companyName: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size.xl,
//     color: Colors.textPrimary,
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   categoryText: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size.xs,
//     color: Colors.primary,
//     textAlign: 'center',
//     letterSpacing: 0.5,
//     marginBottom: Spacing.sm,
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   locationText: {
//     fontFamily: Typography.fontFamily.medium,
//     fontSize: Typography.size.sm,
//     color: Colors.textSecondary,
//   },
//   actionsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: Spacing.md,
//     marginBottom: Spacing['2xl'],
//   },
//   actionBtn: {
//     flex: 1,
//     maxWidth: 100,
//     backgroundColor: Colors.white,
//     borderWidth: 1,
//     borderColor: Colors.primarySurface,
//     borderRadius: Radius.md,
//     paddingVertical: Spacing.md,
//     alignItems: 'center',
//     justifyContent: 'center',
//     ...Shadow.sm,
//   },
//   actionText: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: 10,
//     color: Colors.primary,
//     marginTop: 6,
//   },
//   section: {
//     marginBottom: Spacing['2xl'],
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: Spacing.md,
//   },
//   sectionMarker: {
//     width: 4,
//     height: 18,
//     backgroundColor: Colors.primary,
//     borderRadius: Radius.full,
//     marginRight: Spacing.sm,
//   },
//   sectionTitle: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size.lg,
//     color: Colors.textPrimary,
//   },
//   bodyText: {
//     fontFamily: Typography.fontFamily.regular,
//     fontSize: Typography.size.base,
//     color: Colors.textSecondary,
//     lineHeight: Typography.lineHeight.relaxed,
//   },
//   productBlock: {
//     marginBottom: Spacing.md,
//   },
//   productType: {
//     fontFamily: Typography.fontFamily.semiBold,
//     fontSize: Typography.size.sm,
//     color: Colors.textPrimary,
//     marginBottom: 4,
//   },
//   bottomBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: Spacing.lg,
//     paddingBottom: Spacing['2xl'],
//     backgroundColor: 'rgba(255,255,255,0.9)',
//     borderTopWidth: 1,
//     borderTopColor: Colors.border,
//   },
//   primaryBtn: {
//     backgroundColor: Colors.primary,
//     borderRadius: Radius.md,
//     height: 54,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     ...Shadow.md,
//   },
//   primaryBtnText: {
//     fontFamily: Typography.fontFamily.bold,
//     fontSize: Typography.size.md,
//     color: Colors.white,
//   },
//   errorText: {
//     fontFamily: Typography.fontFamily.medium,
//     fontSize: Typography.size.lg,
//     color: Colors.textPrimary,
//     marginBottom: Spacing.md,
//   },
//   backBtnFallback: {
//     paddingHorizontal: Spacing.lg,
//     paddingVertical: Spacing.sm,
//     backgroundColor: Colors.primary,
//     borderRadius: Radius.md,
//   },
//   backBtnText: {
//     fontFamily: Typography.fontFamily.semiBold,
//     color: Colors.white,
//   },
// });
