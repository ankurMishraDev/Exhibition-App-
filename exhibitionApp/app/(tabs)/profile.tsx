import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
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

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing will be implemented soon!');
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
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
      color: BrandColors.orange[500],
    },
    {
      icon: '🛡️',
      title: 'Privacy & Security',
      subtitle: 'Account security settings',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
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
      onPress: () => Alert.alert('Terms', 'Terms & Conditions coming soon!'),
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
                3
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Total Bookings
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.purple[600] }]}>
                ₹65,000
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                Total Spent
              </ThemedText>
            </View>
          </View>
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
                  >
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
});