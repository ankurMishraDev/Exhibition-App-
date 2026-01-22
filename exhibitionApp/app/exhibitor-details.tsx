import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

import { ExhibitorDetailsForm } from '@/components/ExhibitorDetailsForm';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { ExhibitorAPI } from '@/lib/api';
import { ExhibitorProfile } from '@/types';

export default function ExhibitorDetailsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ExhibitorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await ExhibitorAPI.getMyProfile(user.id);
      
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch exhibitor profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSuccess = () => {
    fetchProfile();
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[BrandColors.green[600], BrandColors.green[800]]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Exhibitor Details
          </ThemedText>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.green[600]} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[BrandColors.green[600], BrandColors.green[800]]}
        style={styles.header}
      >
       
        <ThemedText type="title" style={styles.headerTitle}>
          Exhibitor Details
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {profile ? 'Update your company information' : 'Complete your profile to book stalls'}
        </ThemedText>
      </LinearGradient>

      <ExhibitorDetailsForm existingProfile={profile} onSuccess={handleSuccess} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
