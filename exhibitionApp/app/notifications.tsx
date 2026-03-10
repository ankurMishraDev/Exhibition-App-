import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppTheme, BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'booking_updates',
      title: 'Booking Updates',
      description: 'Get notified about your booking status changes',
      enabled: true,
    },
    {
      id: 'payment_alerts',
      title: 'Payment Alerts',
      description: 'Receive notifications for payment confirmations',
      enabled: true,
    },
    {
      id: 'event_reminders',
      title: 'Event Reminders',
      description: 'Reminders before your booked events',
      enabled: true,
    },
    {
      id: 'new_events',
      title: 'New Events',
      description: 'Be notified when new exhibitions are available',
      enabled: false,
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Special deals and discounts',
      enabled: false,
    },
    {
      id: 'email_notifications',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      enabled: true,
    },
    {
      id: 'sms_notifications',
      title: 'SMS Notifications',
      description: 'Receive notifications via SMS',
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleSave = () => {
    // In a real app, you would save these to the backend
    Alert.alert('Success', 'Notification preferences saved successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <ThemedText type="title" style={styles.headerTitle}>Notifications</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Manage your notification preferences</ThemedText>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIcon, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="notifications-outline" size={18} color={AppTheme.deepTeal} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Push Notifications
            </ThemedText>
          </View>
          
          {settings.slice(0, 5).map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>{setting.title}</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {setting.description}
                </ThemedText>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: '#E0E0E0', true: AppTheme.deepTealLight }}
                thumbColor={setting.enabled ? AppTheme.deepTeal : '#F5F5F5'}
              />
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIcon, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="mail-outline" size={18} color={AppTheme.deepTeal} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Other Notifications
            </ThemedText>
          </View>
          
          {settings.slice(5).map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>{setting.title}</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {setting.description}
                </ThemedText>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: '#E0E0E0', true: AppTheme.deepTealLight }}
                thumbColor={setting.enabled ? AppTheme.deepTeal : '#F5F5F5'}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </LinearGradient>
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
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
