import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExhibitorAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ExhibitorProfile, ExhibitorProfileForm } from '@/types';
import { AppTheme, BrandColors, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ExhibitorDetailsFormProps {
  existingProfile?: ExhibitorProfile | null;
  onSuccess: () => void;
}

const COMPANY_DOMAINS = [
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Education',
  'Finance',
  'Retail',
  'Food & Beverage',
  'Automotive',
  'Real Estate',
  'Entertainment',
  'Agriculture',
  'Construction',
  'Consulting',
  'Other',
];

export const ExhibitorDetailsForm: React.FC<ExhibitorDetailsFormProps> = ({
  existingProfile,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState<ExhibitorProfileForm>({
    company_name: existingProfile?.company_name || '',
    company_domain: existingProfile?.company_domain || '',
    company_website: existingProfile?.company_website || '',
    company_logo_url: existingProfile?.company_logo_url || '',
    contact_number: existingProfile?.contact_number || '',
    executive_name: existingProfile?.executive_name || '',
    executive_designation: existingProfile?.executive_designation || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExhibitorProfileForm, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExhibitorProfileForm, string>> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.company_domain.trim()) {
      newErrors.company_domain = 'Company domain/industry is required';
    }

    if (formData.company_website && !isValidUrl(formData.company_website)) {
      newErrors.company_website = 'Please enter a valid URL (e.g., https://example.com)';
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required';
    } else if (!isValidPhone(formData.contact_number)) {
      newErrors.contact_number = 'Please enter a valid phone number';
    }

    if (!formData.executive_name.trim()) {
      newErrors.executive_name = 'Executive name is required';
    }

    if (!formData.executive_designation.trim()) {
      newErrors.executive_designation = 'Designation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlPattern.test(url);
    } catch {
      return false;
    }
  };

  const isValidPhone = (phone: string): boolean => {
    const phonePattern = /^[\d\s\+\-\(\)]{10,15}$/;
    return phonePattern.test(phone);
  };

  const formatWebsiteUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadLogo(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadLogo = async (uri: string) => {
    if (!user) return;

    try {
      setUploadingLogo(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';

      const uploadResponse = await ExhibitorAPI.uploadLogo(user.id, blob, fileExt);

      if (uploadResponse.error) {
        Alert.alert('Upload Failed', uploadResponse.error);
        return;
      }

      if (uploadResponse.data) {
        setFormData({ ...formData, company_logo_url: uploadResponse.data });
        Alert.alert('Success', 'Logo uploaded successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      // Format website URL
      const formattedData = {
        ...formData,
        company_website: formData.company_website ? formatWebsiteUrl(formData.company_website) : '',
      };

      let response;
      if (existingProfile) {
        response = await ExhibitorAPI.updateProfile(user.id, formattedData);
      } else {
        response = await ExhibitorAPI.createProfile(user.id, formattedData);
      }

      if (response.error) {
        Alert.alert('Error', response.error);
        return;
      }

      Alert.alert(
        'Success',
        existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
        [
          {
            text: 'OK',
            onPress: onSuccess,
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Company Logo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Company Logo (Optional)
          </Text>
          <TouchableOpacity
            style={[styles.logoContainer, { borderColor: Colors[colorScheme ?? 'light'].border }]}
            onPress={pickImage}
            disabled={uploadingLogo}
          >
            {formData.company_logo_url ? (
              <Image source={{ uri: formData.company_logo_url }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <View style={[styles.logoIconWrap, { backgroundColor: AppTheme.deepTealSoft }]}>
                  <Ionicons name="camera-outline" size={32} color={AppTheme.deepTeal} />
                </View>
                <Text style={[styles.logoPlaceholderSubtext, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  Tap to upload logo
                </Text>
              </View>
            )}
            {uploadingLogo && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={AppTheme.deepTeal} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Company Information
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Company Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: errors.company_name ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              placeholder="e.g., TechCorp Solutions"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={formData.company_name}
              onChangeText={(text) => {
                setFormData({ ...formData, company_name: text });
                setErrors({ ...errors, company_name: '' });
              }}
            />
            {errors.company_name && <Text style={styles.errorText}>{errors.company_name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Industry/Domain <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.pickerContainer,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  borderColor: errors.company_domain ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {COMPANY_DOMAINS.map((domain) => (
                  <TouchableOpacity
                    key={domain}
                    style={[
                      styles.domainChip,
                      formData.company_domain === domain && styles.domainChipSelected,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, company_domain: domain });
                      setErrors({ ...errors, company_domain: '' });
                    }}
                  >
                    <Text
                      style={[
                        styles.domainChipText,
                        formData.company_domain === domain && styles.domainChipTextSelected,
                      ]}
                    >
                      {domain}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {errors.company_domain && <Text style={styles.errorText}>{errors.company_domain}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Website URL (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: errors.company_website ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              placeholder="e.g., www.techcorp.com"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={formData.company_website}
              onChangeText={(text) => {
                setFormData({ ...formData, company_website: text });
                setErrors({ ...errors, company_website: '' });
              }}
              keyboardType="url"
              autoCapitalize="none"
            />
            {errors.company_website && <Text style={styles.errorText}>{errors.company_website}</Text>}
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Contact Details
          </Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Executive/Head Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: errors.executive_name ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              placeholder="e.g., John Doe"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={formData.executive_name}
              onChangeText={(text) => {
                setFormData({ ...formData, executive_name: text });
                setErrors({ ...errors, executive_name: '' });
              }}
            />
            {errors.executive_name && <Text style={styles.errorText}>{errors.executive_name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Designation <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: errors.executive_designation ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              placeholder="e.g., CEO, Director, Manager"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={formData.executive_designation}
              onChangeText={(text) => {
                setFormData({ ...formData, executive_designation: text });
                setErrors({ ...errors, executive_designation: '' });
              }}
            />
            {errors.executive_designation && <Text style={styles.errorText}>{errors.executive_designation}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].surface,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: errors.contact_number ? '#EF4444' : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              placeholder="e.g., +91 98765 43210"
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={formData.contact_number}
              onChangeText={(text) => {
                setFormData({ ...formData, contact_number: text });
                setErrors({ ...errors, contact_number: '' });
              }}
              keyboardType="phone-pad"
            />
            {errors.contact_number && <Text style={styles.errorText}>{errors.contact_number}</Text>}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[AppTheme.deepTeal, AppTheme.deepTealLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {existingProfile ? 'Update Profile' : 'Save & Complete Profile'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: AppTheme.deepTeal,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppTheme.deepTeal,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: AppTheme.deepTealSoft,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  domainChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  domainChipSelected: {
    backgroundColor: AppTheme.deepTeal,
  },
  domainChipText: {
    fontSize: 14,
    color: '#374151',
  },
  domainChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
