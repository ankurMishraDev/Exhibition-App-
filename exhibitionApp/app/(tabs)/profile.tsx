import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getExhibitorByUserId } from '@/lib/services/exhibitorService';
import { getExhibitorBookings } from '@/lib/services/bookingService';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';
import { logout } from '@/lib/services/authService';
import { EVENT_NAME, EVENT_DATE, EVENT_LOCATION } from '@/constants/segments';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userModel, isExhibitor } = useAuth();
  const [exhibitor, setExhibitor] = useState<ExhibitorModel | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        if (isExhibitor) {
          const [e, bookings] = await Promise.all([
            getExhibitorByUserId(user.uid),
            getExhibitorBookings(user.uid),
          ]);
          setExhibitor(e);
          setBookingCount(bookings.length);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isExhibitor]);

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayName = exhibitor
    ? `${exhibitor.contactPrefix} ${exhibitor.contactPerson}`.trim()
    : userModel?.displayName || user?.email || 'User';

  const companyName = exhibitor?.companyName || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.avatarWrap}>
            {exhibitor?.logoUrl ? (
              <Image source={{ uri: exhibitor.logoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(exhibitor?.companyName || userModel?.displayName || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}
            {isExhibitor && (
              <TouchableOpacity
                style={styles.editAvatarBtn}
                onPress={() =>
                  router.push({
                    pathname: '/exhibitor-details',
                    params: {},
                  })
                }
              >
                <Ionicons name="camera" size={14} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          {companyName ? (
            <Text style={styles.companyName}>{companyName}</Text>
          ) : null}

          <View style={[styles.rolePill, isExhibitor ? styles.rolePillExhibitor : styles.rolePillVisitor]}>
            <Ionicons
              name={isExhibitor ? 'business-outline' : 'person-outline'}
              size={12}
              color={isExhibitor ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.rolePillText, isExhibitor ? styles.rolePillTextExhibitor : styles.rolePillTextVisitor]}>
              {isExhibitor ? 'Exhibitor' : 'Visitor'}
            </Text>
          </View>
        </View>

        {/* Stats Row (Exhibitor only) */}
        {isExhibitor && (
          <View style={styles.statsRow}>
            <StatBox label="Total Bookings" value={String(bookingCount)} icon="receipt-outline" />
            <View style={styles.statDivider} />
            <StatBox
              label="Hall"
              value={exhibitor?.city || '—'}
              icon="location-outline"
            />
            <View style={styles.statDivider} />
            <StatBox
              label="Segments"
              value={String(exhibitor?.productDetails?.segments?.length || 0)}
              icon="cube-outline"
            />
          </View>
        )}

        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.eventCardTitle}>Upcoming Event</Text>
          </View>
          <Text style={styles.eventName}>{EVENT_NAME}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.eventMetaText}>{EVENT_DATE}</Text>
            </View>
            <View style={styles.eventMetaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.eventMetaText}>{EVENT_LOCATION}</Text>
            </View>
          </View>
        </View>

        {/* Profile Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>

          {isExhibitor && (
            <MenuItem
              icon="person-outline"
              label="Edit Exhibitor Profile"
              sub="Update company details and contact info"
              onPress={() => router.push({ pathname: '/exhibitor-details', params: {} })}
            />
          )}

          <MenuItem
            icon="receipt-outline"
            label="My Bookings"
            sub="View and track your stall bookings"
            onPress={() => router.push('/(tabs)/bookings')}
          />

          <MenuItem
            icon="time-outline"
            label="Booking History"
            sub="Past bookings and their status"
            onPress={() => router.push('/(tabs)/history')}
          />

          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            sub="Event and booking alerts"
            onPress={() => router.push('/notifications')}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App</Text>

          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => {/* future */ Alert.alert('Terms', 'Terms & Conditions will be available soon.')}}
          />

          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy Policy will be available soon.')}
          />

          <MenuItem
            icon="information-circle-outline"
            label="About"
            sub={`PlastPack App v1.0.0`}
            onPress={() => {}}
            noChevron
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Email */}
        <Text style={styles.emailHint}>{user?.email}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={statStyles.box}>
      <Ionicons name={icon as never} size={18} color={Colors.primary} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: 4 },
  value: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.textPrimary },
  label: { fontSize: Typography.size.xs, color: Colors.textMuted, textAlign: 'center' },
});

function MenuItem({
  icon,
  label,
  sub,
  onPress,
  noChevron,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  noChevron?: boolean;
}) {
  return (
    <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={menuStyles.iconWrap}>
        <Ionicons name={icon as never} size={18} color={Colors.primary} />
      </View>
      <View style={menuStyles.textWrap}>
        <Text style={menuStyles.label}>{label}</Text>
        {sub && <Text style={menuStyles.sub}>{sub}</Text>}
      </View>
      {!noChevron && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerBanner: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.primarySurface,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  displayName: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  companyName: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  rolePillExhibitor: {
    backgroundColor: Colors.primarySurface,
    borderColor: Colors.primary,
  },
  rolePillVisitor: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: Colors.border,
  },
  rolePillText: { fontSize: Typography.size.xs, fontWeight: '700' },
  rolePillTextExhibitor: { color: Colors.primary },
  rolePillTextVisitor: { color: Colors.textMuted },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statDivider: { width: 1, backgroundColor: Colors.divider },

  eventCard: {
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventCardTitle: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  eventMeta: { gap: Spacing.xs },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventMetaText: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  sectionCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.error },
  emailHint: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
});
