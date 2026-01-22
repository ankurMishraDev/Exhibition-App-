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
import { BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  
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
        colors={[BrandColors.orange[500], BrandColors.orange[700]]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>Notifications</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage your notification preferences</ThemedText>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🔔 Push Notifications
          </ThemedText>
          
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
                trackColor={{ false: '#E0E0E0', true: BrandColors.orange[300] }}
                thumbColor={setting.enabled ? BrandColors.orange[600] : '#F5F5F5'}
              />
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📬 Other Notifications
          </ThemedText>
          
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
                trackColor={{ false: '#E0E0E0', true: BrandColors.orange[300] }}
                thumbColor={setting.enabled ? BrandColors.orange[600] : '#F5F5F5'}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={[BrandColors.orange[500], BrandColors.orange[700]]}
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
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
  sectionTitle: {
    marginBottom: 16,
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
