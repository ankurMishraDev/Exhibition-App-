import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { ExhibitorAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { ExhibitorProfile } from '@/types';

interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exhibitorProfile, setExhibitorProfile] = useState<ExhibitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityStats, setActivityStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    activeBookings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchExhibitorProfile();
      fetchUserActivity();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create profile:', createError);
          // Use basic user data as fallback
          setProfile({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          });
        } else {
          setProfile({
            id: user.id,
            email: user.email,
            name: newProfile?.name,
            phone: newProfile?.phone,
            avatar_url: newProfile?.avatar_url,
            created_at: user.created_at,
          });
        }
      } else if (error) {
        throw error;
      } else {
        setProfile({
          id: user.id,
          email: user.email,
          name: data?.name,
          phone: data?.phone,
          avatar_url: data?.avatar_url,
          created_at: user.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // If profile doesn't exist, use user data
      setProfile({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchExhibitorProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await ExhibitorAPI.getMyProfile(user.id);
      if (data) {
        setExhibitorProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch exhibitor profile:', error);
    }
  };
  
  const fetchUserActivity = async () => {
    if (!user) return;
    
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('amount, status')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Failed to fetch bookings:', error);
        return;
      }
      
      if (bookings) {
        const totalBookings = bookings.length;
        const totalSpent = bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + Number(b.amount), 0);
        const activeBookings = bookings.filter(b => 
          b.status === 'confirmed' || b.status === 'reserved'
        ).length;
        
        setActivityStats({
          totalBookings,
          totalSpent,
          activeBookings,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };
  
  const handleEditExhibitorProfile = () => {
    router.push('/exhibitor-details');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (!error) {
              router.replace('/(auth)/login');
            } else {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact support at support@exhibitionapp.com');
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
  };

  const menuItems = [
    {
      icon: '✏️',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: handleEditProfile,
      color: BrandColors.purple[500],
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => router.push('/notifications'),
      color: BrandColors.orange[500],
    },
    {
      icon: '🛡️',
      title: 'Privacy & Security',
      subtitle: 'Account security settings',
      onPress: () => router.push('/privacy-security'),
      color: BrandColors.green[500],
    },
    {
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Get help with your account',
      onPress: handleSupport,
      color: BrandColors.purple[400],
    },
    {
      icon: '📋',
      title: 'Terms & Conditions',
      subtitle: 'Read our terms and policies',
      onPress: () => router.push('/terms-conditions'),
      color: BrandColors.gray[500],
    },
  ];

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.purple[600], BrandColors.purple[800]]}
          style={styles.header}
        >
          <ThemedText type="title" style={{ color: 'white' }}>Profile</ThemedText>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.purple[600]} />
        </View>
      </ThemedView>
    );
  }

  if (!profile || !user) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.purple[600], BrandColors.purple[800]]}
          style={styles.header}
        >
          <ThemedText type="title" style={{ color: 'white' }}>Profile</ThemedText>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ThemedText>Please log in to view your profile</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[BrandColors.purple[600], BrandColors.purple[800]]}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[BrandColors.orange[400], BrandColors.purple[400]]}
              style={styles.avatar}
            >
              <ThemedText style={styles.avatarText}>
                {(profile.name || profile.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
              </ThemedText>
            </LinearGradient>
          </View>
          
          <View style={styles.userInfo}>
            <ThemedText type="title" style={styles.userName}>
              {profile.name || 'User'}
            </ThemedText>
            <ThemedText style={[styles.userEmail, { color: BrandColors.purple[100] }]}>
              {profile.email}
            </ThemedText>
            {profile.phone && (
              <ThemedText style={[styles.userPhone, { color: BrandColors.purple[200] }]}>
                {profile.phone}
              </ThemedText>
            )}
            {profile.created_at && (
              <ThemedText style={[styles.joinDate, { color: BrandColors.purple[200] }]}>
                Member since {formatJoinDate(profile.created_at)}
              </ThemedText>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <ThemedText type="subtitle" style={styles.statsTitle}>
            Your Activity
          </ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.green[600] }]}>
                {activityStats.totalBookings}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Total Bookings
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.purple[600] }]}>
                ₹{activityStats.totalSpent.toLocaleString('en-IN')}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Total Spent
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Exhibitor Profile Section */}
        <View style={[styles.exhibitorCard, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.exhibitorHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.exhibitorTitle}>
                🏢 Exhibitor Profile
              </ThemedText>
              {exhibitorProfile?.is_completed && (
                <View style={styles.completedBadge}>
                  <ThemedText style={styles.completedBadgeText}>✓ Completed</ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.editExhibitorButton}
              onPress={handleEditExhibitorProfile}
            >
              <LinearGradient
                colors={[BrandColors.green[500], BrandColors.green[600]]}
                style={styles.editExhibitorButtonGradient}
              >
                <ThemedText style={styles.editExhibitorButtonText}>
                  {exhibitorProfile ? 'Edit' : 'Complete'}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {exhibitorProfile && exhibitorProfile.is_completed ? (
            <View style={styles.exhibitorDetails}>
              <View style={styles.exhibitorRow}>
                <ThemedText style={[styles.exhibitorLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Company:
                </ThemedText>
                <ThemedText style={styles.exhibitorValue}>
                  {exhibitorProfile.company_name}
                </ThemedText>
              </View>
              <View style={styles.exhibitorRow}>
                <ThemedText style={[styles.exhibitorLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Domain:
                </ThemedText>
                <ThemedText style={styles.exhibitorValue}>
                  {exhibitorProfile.company_domain}
                </ThemedText>
              </View>
              {exhibitorProfile.company_website && (
                <View style={styles.exhibitorRow}>
                  <ThemedText style={[styles.exhibitorLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                    Website:
                  </ThemedText>
                  <ThemedText style={[styles.exhibitorValue, { color: BrandColors.purple[600] }]}>
                    {exhibitorProfile.company_website}
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.incompleteContainer}>
              <ThemedText style={[styles.incompleteText, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Complete your exhibitor profile to start booking stalls at events.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <ThemedText style={[styles.menuIconText, { color: item.color }]}>
                    {item.icon}
                  </ThemedText>
                </View>
                
                <View style={styles.menuText}>
                  <ThemedText style={styles.menuTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={[styles.menuSubtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
                    {item.subtitle}
                  </ThemedText>
                </View>
                
                <ThemedText style={[styles.chevron, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {'>'}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={handleLogout}
        >
          <ThemedText style={[styles.logoutText, { color: '#EF4444' }]}>
            🚪 Logout
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  menuSection: {
    gap: 12,
  },
  menuItem: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '300',
  },
  logoutButton: {
    marginTop: 32,
    marginBottom: 40,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exhibitorCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.green[200],
  },
  exhibitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exhibitorTitle: {
    marginBottom: 4,
  },
  completedBadge: {
    backgroundColor: BrandColors.green[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    color: BrandColors.green[700],
    fontSize: 11,
    fontWeight: '600',
  },
  editExhibitorButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  editExhibitorButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editExhibitorButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exhibitorDetails: {
    gap: 12,
  },
  exhibitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exhibitorLabel: {
    fontSize: 14,
    width: 80,
    fontWeight: '500',
  },
  exhibitorValue: {
    fontSize: 14,
    flex: 1,
  },
  incompleteContainer: {
    paddingVertical: 8,
  },
  incompleteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});