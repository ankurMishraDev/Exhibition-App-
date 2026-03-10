import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, AppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2;

interface InterestCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const categories: InterestCategory[] = [
  { id: 'tech', title: 'Technology', icon: 'hardware-chip-outline', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'fashion', title: 'Fashion & Textile', icon: 'shirt-outline', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'food', title: 'Food & Beverage', icon: 'restaurant-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'health', title: 'Health & Wellness', icon: 'fitness-outline', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'auto', title: 'Automobile', icon: 'car-outline', color: '#6366F1', bgColor: '#E0E7FF' },
  { id: 'realestate', title: 'Real Estate', icon: 'home-outline', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'education', title: 'Education', icon: 'school-outline', color: '#0EA5E9', bgColor: '#E0F2FE' },
  { id: 'art', title: 'Art & Crafts', icon: 'color-palette-outline', color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'jewellery', title: 'Jewellery', icon: 'diamond-outline', color: '#D946EF', bgColor: '#FAE8FF' },
  { id: 'agriculture', title: 'Agriculture', icon: 'leaf-outline', color: '#22C55E', bgColor: '#DCFCE7' },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    // Save interests and navigate to main app
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Teal Header */}
      <LinearGradient
        colors={[AppTheme.deepTealDark, AppTheme.deepTeal]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ width: 36 }} />
          <ThemedText style={styles.headerTitle}>Choose Interests</ThemedText>
          <TouchableOpacity onPress={handleSkip}>
            <ThemedText style={styles.skipText}>Skip</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.headerSubtitle}>
          Select categories you&apos;re interested in to personalize your experience
        </ThemedText>

        {/* Progress indicators */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
      </LinearGradient>

      {/* Categories Grid */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      >
        <View style={styles.grid}>
          {categories.map((cat) => {
            const isSelected = selectedInterests.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? BrandColors.gray[900] : '#fff',
                    borderColor: isSelected ? AppTheme.deepTeal : (isDark ? BrandColors.gray[800] : BrandColors.gray[100]),
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => toggleInterest(cat.id)}
                activeOpacity={0.7}
              >
                {/* Checkbox */}
                <View style={[
                  styles.checkCircle,
                  isSelected
                    ? { backgroundColor: AppTheme.deepTeal, borderColor: AppTheme.deepTeal }
                    : { borderColor: isDark ? BrandColors.gray[600] : BrandColors.gray[300] },
                ]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : cat.bgColor }]}>
                  <Ionicons name={cat.icon} size={28} color={cat.color} />
                </View>

                {/* Label */}
                <ThemedText style={styles.cardLabel}>{cat.title}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? BrandColors.gray[900] : '#fff' }]}>
        <ThemedText style={[styles.selectedCount, { color: BrandColors.gray[400] }]}>
          {selectedInterests.length} selected
        </ThemedText>
        <TouchableOpacity
          style={[styles.continueBtn, selectedInterests.length === 0 && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={selectedInterests.length === 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedInterests.length > 0
                ? [AppTheme.deepTeal, AppTheme.deepTealLight]
                : [BrandColors.gray[300], BrandColors.gray[400]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <ThemedText style={styles.continueText}>Continue</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 24,
    borderRadius: 4,
  },
  // Grid
  scrollArea: {
    flex: 1,
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
  },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Bottom
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  continueBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
