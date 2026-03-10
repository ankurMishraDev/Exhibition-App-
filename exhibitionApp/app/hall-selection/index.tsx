import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import type { Hall } from '@/types';

export default function HallSelectionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { isExhibitor } = useAuth();

  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHalls = async () => {
    try {
      const data = await HallService.getAllHalls();
      setHalls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard: only exhibitors can reach this screen
    if (!isExhibitor) {
      router.replace('/(tabs)');
      return;
    }
    fetchHalls();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHalls();
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Select Hall</ThemedText>
        <ThemedText style={styles.headerSub}>Choose a hall to view available stalls</ThemedText>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppTheme.deepTeal} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.deepTeal} />
          }
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={[styles.hint, { color: BrandColors.gray[400] }]}>
            {halls.length} hall{halls.length !== 1 ? 's' : ''} available
          </ThemedText>
          {halls.map((hall) => (
            <TouchableOpacity
              key={hall.id}
              style={[styles.card, { backgroundColor: isDark ? BrandColors.gray[800] : '#fff' }]}
              onPress={() => router.push(`/hall/${hall.id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(0,128,128,0.1)' }]}>
                  <Ionicons name="business" size={24} color={AppTheme.deepTeal} />
                </View>
                <View style={styles.cardText}>
                  <ThemedText style={styles.hallName}>{hall.hallName}</ThemedText>
                  {hall.stallCount !== undefined && (
                    <ThemedText style={[styles.stallCount, { color: BrandColors.gray[400] }]}>
                      {hall.stallCount} stalls
                    </ThemedText>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={BrandColors.gray[400]} />
              </View>
            </TouchableOpacity>
          ))}
          {halls.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={48} color={BrandColors.gray[300]} />
              <ThemedText style={[styles.emptyText, { color: BrandColors.gray[400] }]}>
                No halls published yet
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, marginBottom: 14 },
  card: {
    borderRadius: 14, flexDirection: 'row', marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  cardAccent: { width: 4, backgroundColor: AppTheme.deepTeal },
  cardBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  iconBg: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardText: { flex: 1 },
  hallName: { fontSize: 16, fontWeight: '700' },
  stallCount: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
