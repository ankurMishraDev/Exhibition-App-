import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { ExhibitorService } from '@/services/exhibitorService';
import type { ExhibitorProfile } from '@/types';
import { AppTheme } from '@/constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, appUser, isExhibitor, signOut } = useAuth();
  const [profile, setProfile] = useState<ExhibitorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (isExhibitor) {
      ExhibitorService.getProfile(user.uid).then((p) => {
        setProfile(p);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, isExhibitor]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppTheme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          {profile?.companyLogo ? (
            <Image source={{ uri: profile.companyLogo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={36} color="#FFF" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{appUser?.displayName ?? user?.displayName ?? 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons
            name={isExhibitor ? 'briefcase-outline' : 'person-outline'}
            size={13}
            color={AppTheme.primaryDark}
          />
          <Text style={styles.roleText}>  {isExhibitor ? 'Exhibitor' : 'Visitor'}</Text>
        </View>
      </View>

      {/* Exhibitor profile card */}
      {isExhibitor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Profile</Text>
          {profile ? (
            <>
              <InfoRow icon="business-outline" label="Company" value={profile.companyName} />
              <InfoRow icon="location-outline" label="City" value={`${profile.city}, ${profile.country}`} />
              <InfoRow icon="call-outline" label="Mobile" value={profile.telephoneMobile} />
              <InfoRow icon="mail-outline" label="Work Email" value={profile.companyEmail} />
              {profile.gstNo && <InfoRow icon="document-text-outline" label="GST" value={profile.gstNo} />}
              {profile.website && <InfoRow icon="globe-outline" label="Website" value={profile.website} />}
              <View style={styles.profileCompleteBadge}>
                <Ionicons
                  name={profile.isProfileComplete ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={14}
                  color={profile.isProfileComplete ? AppTheme.primary : '#F59E0B'}
                />
                <Text style={[styles.profileCompleteText, { color: profile.isProfileComplete ? AppTheme.primary : '#F59E0B' }]}>
                  {'  '}{profile.isProfileComplete ? 'Profile complete' : 'Profile incomplete'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noProfileBox}>
              <Text style={styles.noProfileText}>No profile yet.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="pencil-outline" size={15} color={AppTheme.primary} />
            <Text style={styles.editBtnText}>  Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <MenuItem icon="shield-outline"       label="Privacy & Security" onPress={() => router.push('/privacy-security')} />
        <MenuItem icon="document-outline"     label="Terms & Conditions" onPress={() => router.push('/terms-conditions')} />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.signOutText}>  Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color="#6B7280" style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon as any} size={18} color={AppTheme.primary} />
      <Text style={styles.menuLabel}>  {label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: AppTheme.deepTeal,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: { width: 84, height: 84 },
  avatarFallback: {
    width: 84,
    height: 84,
    backgroundColor: AppTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  userEmail: { color: '#A7F3D0', fontSize: 13, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { marginRight: 10 },
  infoLabel: { fontSize: 13, color: '#6B7280', width: 80 },
  infoValue: { fontSize: 13, color: '#111827', flex: 1, fontWeight: '500' },
  profileCompleteBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  profileCompleteText: { fontSize: 12, fontWeight: '600' },
  noProfileBox: { paddingVertical: 12 },
  noProfileText: { fontSize: 13, color: '#9CA3AF' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppTheme.primary,
  },
  editBtnText: { fontSize: 13, color: AppTheme.primary, fontWeight: '600' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLabel: { fontSize: 14, color: '#111827' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  signOutText: { fontSize: 15, color: '#EF4444', fontWeight: '600' },
});
