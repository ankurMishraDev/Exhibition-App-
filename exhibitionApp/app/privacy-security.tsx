import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AppTheme, BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function PrivacySecurityScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully');
      setPasswordModalVisible(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand',
                  style: 'destructive',
                  onPress: async () => {
                    // In production, implement proper account deletion
                    Alert.alert('Info', 'Please contact support to delete your account.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data export request has been submitted. You will receive an email with your data within 48 hours.',
      [{ text: 'OK' }]
    );
  };

  const securityOptions = [
    {
      icon: 'key-outline' as const,
      title: 'Change Password',
      subtitle: 'Update your account password',
      onPress: () => setPasswordModalVisible(true),
      color: AppTheme.deepTeal,
    },
    {
      icon: 'phone-portrait-outline' as const,
      title: 'Two-Factor Authentication',
      subtitle: 'Add extra security to your account',
      onPress: () => Alert.alert('Coming Soon', 'Two-factor authentication will be available soon!'),
      color: AppTheme.primary,
    },
    {
      icon: 'time-outline' as const,
      title: 'Login History',
      subtitle: 'View your recent login activity',
      onPress: () => Alert.alert('Coming Soon', 'Login history will be available soon!'),
      color: AppTheme.deepTealLight,
    },
  ];

  const privacyOptions = [
    {
      icon: 'cloud-download-outline' as const,
      title: 'Export My Data',
      subtitle: 'Download a copy of your data',
      onPress: handleExportData,
      color: AppTheme.primary,
      danger: false,
    },
    {
      icon: 'trash-outline' as const,
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      onPress: handleDeleteAccount,
      color: '#EF4444',
      danger: true,
    },
  ];

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
            <ThemedText type="title" style={styles.headerTitle}>Privacy & Security</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Manage your account security</ThemedText>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="lock-closed-outline" size={18} color={AppTheme.deepTeal} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Security</ThemedText>
          </View>
          
          {securityOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                <Ionicons name={option.icon} size={20} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {option.subtitle}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E0F9E7' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={AppTheme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Privacy</ThemedText>
          </View>
          
          {privacyOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                <Ionicons name={option.icon} size={20} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <ThemedText style={[styles.optionTitle, option.danger && { color: '#EF4444' }]}>
                  {option.title}
                </ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {option.subtitle}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
              <Ionicons name="information-circle-outline" size={18} color={AppTheme.deepTeal} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Account Information</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Email
            </ThemedText>
            <ThemedText style={styles.infoValue}>{user?.email}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              Account ID
            </ThemedText>
            <ThemedText style={styles.infoValue}>{user?.id.slice(0, 8)}...</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].surface }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Change Password</ThemedText>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].border,
              }]}
              placeholder="New Password"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].border,
              }]}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <LinearGradient
                  colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>
                    {changingPassword ? 'Updating...' : 'Update'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '300',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {},
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
