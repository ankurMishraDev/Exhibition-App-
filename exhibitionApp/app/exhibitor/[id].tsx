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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { getExhibitorById } from '@/lib/services/exhibitorService';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';
import { LinearGradient } from 'expo-linear-gradient';

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
        <ActivityIndicator size="large" color={Colors.primary} />
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
  const locationStr = exhibitor.city ? `From ${exhibitor.city}` : 'Location TBD';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Background Gradient */}
      <LinearGradient
        colors={[Colors.primarySurface, Colors.background]}
        style={styles.topGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exhibitor Profile</Text>
        <View style={{ width: 40 }} /> {/* balance layout */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card / Top Section */}
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
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{locationStr}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => exhibitor.mobile && Linking.openURL(`tel:${exhibitor.mobile}`)}
          >
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>CALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => exhibitor.email && Linking.openURL(`mailto:${exhibitor.email}`)}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
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
            <Ionicons name="globe-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>WEBSITE</Text>
          </TouchableOpacity>
        </View>

        {/* Company Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionMarker} />
            <Text style={styles.sectionTitle}>Company Description</Text>
          </View>
          <Text style={styles.bodyText}>
            {exhibitor.companyProfile || 'No description provided by this exhibitor yet.'}
          </Text>
        </View>

        {/* Exhibiting Products (if any) */}
        {(exhibitor.productDetails?.machineryDescription || exhibitor.productDetails?.rawMaterialDescription) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarker} />
              <Text style={styles.sectionTitle}>Exhibiting Products</Text>
            </View>
            {exhibitor.productDetails.machineryDescription ? (
              <View style={styles.productBlock}>
                <Text style={styles.productType}>Machinery</Text>
                <Text style={styles.bodyText}>{exhibitor.productDetails.machineryDescription}</Text>
              </View>
            ) : null}
            {exhibitor.productDetails.rawMaterialDescription ? (
              <View style={styles.productBlock}>
                <Text style={styles.productType}>Raw Materials</Text>
                <Text style={styles.bodyText}>{exhibitor.productDetails.rawMaterialDescription}</Text>
              </View>
            ) : null}
          </View>
        )}
        
        {/* Whitespace for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
          <Ionicons name="map-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Locate on Map</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    padding: 4,
    ...Shadow.md,
    marginBottom: Spacing.lg,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size['3xl'],
    color: Colors.white,
  },
  companyName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xs,
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  actionBtn: {
    flex: 1,
    maxWidth: 100,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primarySurface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  actionText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: Colors.primary,
    marginTop: 6,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionMarker: {
    width: 4,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  bodyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed,
  },
  productBlock: {
    marginBottom: Spacing.md,
  },
  productType: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  primaryBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.md,
    color: Colors.white,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  backBtnFallback: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  backBtnText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
});
