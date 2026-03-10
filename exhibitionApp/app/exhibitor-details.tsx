import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ExhibitorService } from '@/services/exhibitorService';
import { StallService } from '@/services/stallService';
import { BookingService } from '@/services/bookingService';
import type { ProductSegment, Stall } from '@/types';
import { PRODUCT_SEGMENTS } from '@/types';
import { AppTheme } from '@/constants/theme';

const CONTACT_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'] as const;
type ContactTitle = typeof CONTACT_TITLES[number];

const countWords = (text: string) =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

export default function ExhibitorDetailsScreen() {
  const { stallId, hallId } = useLocalSearchParams<{ stallId: string; hallId: string }>();
  const router = useRouter();
  const { user, isExhibitor } = useAuth();

  const [stall, setStall] = useState<Stall | null>(null);
  const [loadingStall, setLoadingStall] = useState(true);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [chiefExecutorName, setChiefExecutorName] = useState('');
  const [contactTitle, setContactTitle] = useState<ContactTitle>('Mr.');
  const [contactPersonName, setContactPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [telephoneMobile, setTelephoneMobile] = useState('');
  const [fax, setFax] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [pan, setPan] = useState('');
  const [tan, setTan] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [ippfMember, setIppfMember] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  const [selectedSegments, setSelectedSegments] = useState<ProductSegment[]>([]);
  const [categories, setCategories] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showTitlePicker, setShowTitlePicker] = useState(false);

  useEffect(() => {
    if (!stallId) return;
    StallService.getStall(stallId).then((s) => {
      setStall(s);
      setLoadingStall(false);
    });
  }, [stallId]);

  useEffect(() => {
    if (!user) return;
    ExhibitorService.getProfile(user.uid).then((profile) => {
      if (!profile) return;
      setName(profile.name ?? '');
      setCompanyName(profile.companyName ?? '');
      setAddress(profile.address ?? '');
      setCity(profile.city ?? '');
      setPincode(profile.pincode ?? '');
      setCountry(profile.country ?? 'India');
      setChiefExecutorName(profile.chiefExecutorName ?? '');
      const stored = profile.contactPerson ?? '';
      const matchedTitle = CONTACT_TITLES.find((t) => stored.startsWith(t));
      if (matchedTitle) {
        setContactTitle(matchedTitle);
        setContactPersonName(stored.slice(matchedTitle.length).trim());
      } else {
        setContactPersonName(stored);
      }
      setDesignation(profile.designation ?? '');
      setTelephoneMobile(profile.telephoneMobile ?? '');
      setFax(profile.fax ?? '');
      setCompanyEmail(profile.companyEmail ?? '');
      setWebsite(profile.website ?? '');
      setGstNo(profile.gstNo ?? '');
      setPan(profile.pan ?? '');
      setTan(profile.tan ?? '');
      setCompanyProfile(profile.companyProfile ?? '');
      setIppfMember(profile.ippfMember ?? false);
      if (profile.companyLogo) setExistingLogoUrl(profile.companyLogo);
    });
  }, [user]);

  const pickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to upload a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }, []);

  const toggleSegment = (seg: ProductSegment) => {
    setSelectedSegments((prev) =>
      prev.includes(seg) ? prev.filter((s) => s !== seg) : [...prev, seg]
    );
  };

  const handleSubmit = async () => {
    if (!user || !stall) return;
    if (!name.trim()) return Alert.alert('Required', 'Please enter your full name.');
    if (!companyName.trim()) return Alert.alert('Required', 'Please enter company name.');
    if (!address.trim()) return Alert.alert('Required', 'Please enter address.');
    if (!city.trim()) return Alert.alert('Required', 'Please enter city.');
    if (!telephoneMobile.trim()) return Alert.alert('Required', 'Please enter mobile number.');
    if (!companyEmail.trim()) return Alert.alert('Required', 'Please enter company email.');
    if (!designation.trim()) return Alert.alert('Required', 'Please enter designation.');
    if (countWords(companyProfile) > 100)
      return Alert.alert('Too long', 'Company profile must be 100 words or fewer.');
    if (selectedSegments.length === 0)
      return Alert.alert('Required', 'Please select at least one product segment.');

    setSubmitting(true);
    try {
      let logoUrl = existingLogoUrl ?? undefined;
      if (logoUri) {
        logoUrl = await ExhibitorService.uploadCompanyLogo(user.uid, logoUri);
      }

      const profileData = {
        name: name.trim(),
        companyName: companyName.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        country: country.trim(),
        chiefExecutorName: chiefExecutorName.trim(),
        contactPerson: `${contactTitle} ${contactPersonName.trim()}` as any,
        designation: designation.trim(),
        telephoneMobile: telephoneMobile.trim(),
        fax: fax.trim() || undefined,
        companyEmail: companyEmail.trim(),
        website: website.trim() || undefined,
        gstNo: gstNo.trim() || undefined,
        pan: pan.trim() || undefined,
        tan: tan.trim() || undefined,
        companyProfile: companyProfile.trim(),
        ippfMember,
        companyLogo: logoUrl,
        isProfileComplete: true,
      };

      const { id: exhibitorProfileId, error: profileError } =
        await ExhibitorService.createOrUpdateProfile(user.uid, profileData);
      if (profileError) throw new Error(profileError);

      await ExhibitorService.saveProductDetails(exhibitorProfileId, {
        segments: selectedSegments,
        categories: categories.trim(),
      });

      const { bookingId, error: bookingError } = await BookingService.createBooking({
        stallId: stall.id,
        stallCode: stall.stallCode,
        hallId: stall.hallId,
        exhibitorId: exhibitorProfileId,
        totalAmount: stall.price,
      });
      if (bookingError) throw new Error(bookingError);

      Alert.alert(
        'Booking Submitted!',
        'Your booking request has been received. The admin will review and confirm your booking.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isExhibitor) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Access denied.</Text>
      </View>
    );
  }

  if (loadingStall) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppTheme.primary} />
      </View>
    );
  }

  const wordCount = countWords(companyProfile);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exhibitor Details</Text>
        </View>

        {stall && (
          <View style={styles.stallCard}>
            <View style={styles.stallCardRow}>
              <Ionicons name="grid-outline" size={18} color={AppTheme.primary} />
              <Text style={styles.stallCardLabel}>  Stall {stall.stallCode}</Text>
            </View>
            <View style={styles.stallCardRow}>
              <Ionicons name="resize-outline" size={16} color="#6B7280" />
              <Text style={styles.stallCardSub}>
                {'  '}{stall.length}m x {stall.breadth}m  -  {stall.spaceType}
              </Text>
            </View>
            <View style={styles.stallCardRow}>
              <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
              <Text style={styles.stallCardPrice}>  Rs.{stall.price.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        <SectionHeader title="Company Information" icon="business-outline" />

        <Field label="Full Name *" hint="Your name as representative">
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="e.g. Rajesh Kumar" placeholderTextColor="#9CA3AF" />
        </Field>

        <Field label="Company Name *">
          <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName}
            placeholder="e.g. Plastech Industries Pvt. Ltd." placeholderTextColor="#9CA3AF" />
        </Field>

        <Field label="Address *">
          <TextInput style={[styles.input, styles.inputMultiline]} value={address}
            onChangeText={setAddress} placeholder="Street / Building / Area"
            placeholderTextColor="#9CA3AF" multiline numberOfLines={2} />
        </Field>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="City *">
              <TextInput style={styles.input} value={city} onChangeText={setCity}
                placeholder="Mumbai" placeholderTextColor="#9CA3AF" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Pincode">
              <TextInput style={styles.input} value={pincode} onChangeText={setPincode}
                placeholder="400001" placeholderTextColor="#9CA3AF"
                keyboardType="numeric" maxLength={6} />
            </Field>
          </View>
        </View>

        <Field label="Country">
          <TextInput style={styles.input} value={country} onChangeText={setCountry}
            placeholder="India" placeholderTextColor="#9CA3AF" />
        </Field>

        <SectionHeader title="Contact Details" icon="call-outline" />

        <Field label="Chief Executor Name">
          <TextInput style={styles.input} value={chiefExecutorName}
            onChangeText={setChiefExecutorName}
            placeholder="MD / CEO / Director name" placeholderTextColor="#9CA3AF" />
        </Field>

        <Field label="Contact Person *">
          <View style={styles.contactPersonRow}>
            <TouchableOpacity style={styles.titlePicker}
              onPress={() => setShowTitlePicker((v) => !v)}>
              <Text style={styles.titlePickerText}>{contactTitle}</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>
            <TextInput style={[styles.input, { flex: 1 }]} value={contactPersonName}
              onChangeText={setContactPersonName}
              placeholder="Contact person name" placeholderTextColor="#9CA3AF" />
          </View>
          {showTitlePicker && (
            <View style={styles.titleDropdown}>
              {CONTACT_TITLES.map((t) => (
                <TouchableOpacity key={t} style={styles.titleOption}
                  onPress={() => { setContactTitle(t); setShowTitlePicker(false); }}>
                  <Text style={[styles.titleOptionText, contactTitle === t && styles.titleOptionActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        <Field label="Designation *">
          <TextInput style={styles.input} value={designation} onChangeText={setDesignation}
            placeholder="e.g. Sales Manager" placeholderTextColor="#9CA3AF" />
        </Field>

        <Field label="Mobile / Telephone *">
          <TextInput style={styles.input} value={telephoneMobile}
            onChangeText={setTelephoneMobile} placeholder="+91 98765 43210"
            placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
        </Field>

        <Field label="Fax">
          <TextInput style={styles.input} value={fax} onChangeText={setFax}
            placeholder="Fax number (optional)" placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad" />
        </Field>

        <Field label="Company Email *">
          <TextInput style={styles.input} value={companyEmail} onChangeText={setCompanyEmail}
            placeholder="info@company.com" placeholderTextColor="#9CA3AF"
            keyboardType="email-address" autoCapitalize="none" />
        </Field>

        <Field label="Website">
          <TextInput style={styles.input} value={website} onChangeText={setWebsite}
            placeholder="https://www.company.com" placeholderTextColor="#9CA3AF"
            autoCapitalize="none" keyboardType="url" />
        </Field>

        <SectionHeader title="Tax & Registration" icon="document-text-outline" />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="GST No.">
              <TextInput style={styles.input} value={gstNo} onChangeText={setGstNo}
                placeholder="27XXXXXX1Z5" placeholderTextColor="#9CA3AF"
                autoCapitalize="characters" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="PAN">
              <TextInput style={styles.input} value={pan} onChangeText={setPan}
                placeholder="AAAAA0000A" placeholderTextColor="#9CA3AF"
                autoCapitalize="characters" maxLength={10} />
            </Field>
          </View>
        </View>

        <Field label="TAN">
          <TextInput style={styles.input} value={tan} onChangeText={setTan}
            placeholder="MUMG12345X" placeholderTextColor="#9CA3AF"
            autoCapitalize="characters" />
        </Field>

        <SectionHeader title="Company Profile" icon="information-circle-outline" />

        <Field label={`Brief Company Profile (${wordCount}/100 words)`}>
          <TextInput style={[styles.input, styles.profileInput]} value={companyProfile}
            onChangeText={setCompanyProfile}
            placeholder="Describe your company, products, and services in 100 words..."
            placeholderTextColor="#9CA3AF" multiline numberOfLines={5}
            textAlignVertical="top" />
          {wordCount > 100 && (
            <Text style={styles.wordCountError}>
              Exceeds 100-word limit by {wordCount - 100} words
            </Text>
          )}
        </Field>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>IPPF Member?</Text>
            <Text style={styles.toggleHint}>Indian Plastics Federation</Text>
          </View>
          <TouchableOpacity style={[styles.toggle, ippfMember && styles.toggleActive]}
            onPress={() => setIppfMember((v) => !v)}>
            <View style={[styles.toggleThumb, ippfMember && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="Company Logo" icon="image-outline" />

        <TouchableOpacity style={styles.logoPickerBtn} onPress={pickLogo}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoPreview} />
          ) : existingLogoUrl ? (
            <Image source={{ uri: existingLogoUrl }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="cloud-upload-outline" size={32} color={AppTheme.primary} />
              <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
              <Text style={styles.logoPlaceholderHint}>Square image recommended</Text>
            </View>
          )}
        </TouchableOpacity>
        {(logoUri || existingLogoUrl) && (
          <TouchableOpacity onPress={pickLogo} style={styles.changeLogoBtn}>
            <Text style={styles.changeLogoText}>Change Logo</Text>
          </TouchableOpacity>
        )}

        <SectionHeader title="Product Details" icon="cube-outline" />

        <Text style={[styles.fieldLabel, { marginHorizontal: 16 }]}>
          Product Segments * (select all that apply)
        </Text>
        <View style={styles.segmentsGrid}>
          {PRODUCT_SEGMENTS.map((seg) => {
            const active = selectedSegments.includes(seg);
            return (
              <TouchableOpacity key={seg}
                style={[styles.segmentChip, active && styles.segmentChipActive]}
                onPress={() => toggleSegment(seg)}>
                <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field label="Product Categories" hint="Comma-separated list of specific products">
          <TextInput style={[styles.input, styles.inputMultiline]} value={categories}
            onChangeText={setCategories}
            placeholder="e.g. HDPE Pipes, PP Granules, Injection Moulds"
            placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
        </Field>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>  Submit Booking</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={AppTheme.primary} />
      <Text style={styles.sectionTitle}>  {title}</Text>
    </View>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  contentContainer: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  errorText: { color: '#EF4444', fontSize: 16 },
  header: {
    backgroundColor: AppTheme.deepTeal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  stallCard: {
    margin: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: AppTheme.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stallCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stallCardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  stallCardSub: { fontSize: 13, color: '#6B7280' },
  stallCardPrice: { fontSize: 15, fontWeight: '700', color: AppTheme.primary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  fieldWrapper: { marginHorizontal: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  fieldHint: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  profileInput: { minHeight: 100 },
  wordCountError: { fontSize: 11, color: '#EF4444', marginTop: 4 },
  row: { flexDirection: 'row', marginHorizontal: 16 },
  contactPersonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titlePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  titlePickerText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  titleDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  titleOption: { paddingHorizontal: 16, paddingVertical: 10 },
  titleOptionText: { fontSize: 14, color: '#374151' },
  titleOptionActive: { color: AppTheme.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleHint: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    padding: 3,
  },
  toggleActive: { backgroundColor: AppTheme.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  logoPickerBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  logoPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  logoPlaceholderText: { fontSize: 14, fontWeight: '600', color: AppTheme.primary },
  logoPlaceholderHint: { fontSize: 11, color: '#9CA3AF' },
  logoPreview: { width: '100%', height: 160, resizeMode: 'contain', backgroundColor: '#F9FAFB' },
  changeLogoBtn: { marginHorizontal: 16, marginBottom: 12, alignSelf: 'flex-start' },
  changeLogoText: { fontSize: 13, color: AppTheme.primary, fontWeight: '600' },
  segmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  segmentChipActive: {
    backgroundColor: AppTheme.primarySoft,
    borderColor: AppTheme.primary,
  },
  segmentChipText: { fontSize: 12, color: '#6B7280' },
  segmentChipTextActive: { color: AppTheme.primaryDark, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: AppTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
