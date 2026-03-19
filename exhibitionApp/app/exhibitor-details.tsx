import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { CONTACT_PREFIXES, COUNTRIES } from '@/constants/segments';
import { useAuth } from '@/hooks/useAuth';
import {
  getExhibitorByUserId,
  createExhibitorProfile,
  updateExhibitorProfile,
  uploadLogo,
  uploadProfileImage,
} from '@/lib/services/exhibitorService';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';

function hasLetters(input: string): boolean {
  return /[A-Za-z]/.test(input);
}

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

export default function ExhibitorDetailsScreen() {
  const router = useRouter();
  const { stallId, hallId, bookingContext, productDetails, preferredSpaceType, discountCode } = useLocalSearchParams<{
    stallId?: string;
    hallId?: string;
    bookingContext?: string;
    productDetails?: string;
    preferredSpaceType?: string;
    discountCode?: string;
  }>();
  const { user, userModel } = useAuth();
  const inBookingFlow = bookingContext === 'stall-booking' && Boolean(stallId) && Boolean(hallId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState<ExhibitorModel | null>(null);

  // Profile fields
  const [prefix, setPrefix] = useState('Mr.');
  const [contactPerson, setContactPerson] = useState('');
  const [companyName, setCompanyName] = useState(userModel?.displayName?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [website, setWebsite] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [ippfMember, setIppfMember] = useState(false);
  const [membershipNumber, setMembershipNumber] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>('');
  
  const [chiefExecutiveName, setChiefExecutiveName] = useState('');
  const [fax, setFax] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [tan, setTan] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [existingProfileImageUrl, setExistingProfileImageUrl] = useState<string>('');

  // UI toggles
  const [showPrefixPicker, setShowPrefixPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const profile = await getExhibitorByUserId(user.uid);
        if (profile) {
          setExistingProfile(profile);
          setPrefix(profile.contactPrefix || 'Mr.');
          setContactPerson(profile.contactPerson || '');
          setCompanyName(profile.companyName || '');
          setEmail(profile.email || user.email || '');
          setMobile(profile.mobile || '');
          setTelephone(profile.telephone || '');
          setAddress(profile.address || '');
          setCity(profile.city || '');
          setState(profile.state || '');
          setPincode(profile.pincode || '');
          setCountry(profile.country || 'India');
          setWebsite(profile.website || '');
          setCompanyProfile(profile.companyProfile || '');
          setIppfMember(profile.ippfMember || false);
          setMembershipNumber(profile.membershipNumber || '');
          setExistingLogoUrl(profile.logoUrl || '');
          setChiefExecutiveName(profile.chiefExecutiveName || '');
          setFax(profile.fax || '');
          setGst(profile.gst || '');
          setPan(profile.pan || '');
          setTan(profile.tan || '');
          setExistingProfileImageUrl(profile.profileImage || '');
        }
      } catch {
        // No existing profile — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function pickLogo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library to upload a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  }

  async function pickProfileImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library to upload a profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    const contactName = contactPerson.trim();
    const company = companyName.trim();
    const mobileDigits = normalizeDigits(mobile);
    const telephoneDigits = normalizeDigits(telephone);
    const faxDigits = normalizeDigits(fax);
    const cityName = city.trim();
    const stateName = state.trim();
    const pinDigits = normalizeDigits(pincode);

    if (!contactName) return Alert.alert('Required', 'Please enter contact person name.');
    if (!hasLetters(contactName)) return Alert.alert('Invalid Input', 'Contact person name must be text, not numbers only.');
    if (!company) return Alert.alert('Required', 'Please enter company name.');
    if (!hasLetters(company)) return Alert.alert('Invalid Input', 'Company name must contain text.');
    if (!mobile.trim()) return Alert.alert('Required', 'Please enter mobile number.');
    if (mobileDigits.length !== 10) return Alert.alert('Invalid Mobile', 'Mobile number must be exactly 10 digits.');
    if (telephone.trim() && (telephoneDigits.length < 8 || telephoneDigits.length > 12)) {
      return Alert.alert('Invalid Telephone', 'Telephone number should be between 8 and 12 digits.');
    }
    if (fax.trim() && (faxDigits.length < 8 || faxDigits.length > 12)) {
      return Alert.alert('Invalid Fax', 'Fax number should be between 8 and 12 digits.');
    }
    if (!address.trim()) return Alert.alert('Required', 'Please enter address.');
    if (!cityName) return Alert.alert('Required', 'Please enter city.');
    if (!hasLetters(cityName)) return Alert.alert('Invalid City', 'City name must be text.');
    if (stateName && !hasLetters(stateName)) return Alert.alert('Invalid State', 'State should contain text.');
    if (pinDigits && pinDigits.length !== 6) return Alert.alert('Invalid PIN', 'PIN code must be 6 digits.');
    if (companyProfile.length > 0 && companyProfile.split(' ').length > 100) {
      return Alert.alert('Too long', 'Company profile must be within 100 words.');
    }
    if (!user || !userModel) return;

    setSaving(true);
    try {
      let finalLogoUrl = existingLogoUrl;
        let finalProfileImageUrl = existingProfileImageUrl;

        // Upload logo if new one was picked
        if (logoUri) {
          finalLogoUrl = await uploadLogo(user.uid, logoUri);
        }

        if (profileImageUri) {
          finalProfileImageUrl = await uploadProfileImage(user.uid, profileImageUri);
        }

        const profileData = {
          userId: user.uid,
          contactPrefix: prefix,
          contactPerson: contactName,
          chiefExecutiveName: chiefExecutiveName.trim(),
          companyName: company,
          email: email.trim(),
          mobile: mobileDigits,
          telephone: telephoneDigits,
          fax: faxDigits,
          gst: gst.trim(),
          pan: pan.trim(),
          tan: tan.trim(),
          address: address.trim(),
          city: cityName,
          state: stateName,
          pincode: pinDigits,
          country,
          website: website.trim(),
          companyProfile: companyProfile.trim(),
          ippfMember,
          membershipNumber: ippfMember ? membershipNumber.trim() : '',
          logoUrl: finalLogoUrl,
          profileImage: finalProfileImageUrl,        };
      if (existingProfile) {
        await updateExhibitorProfile(existingProfile.id, profileData);
      } else {
        await createExhibitorProfile(profileData);
      }

      if (inBookingFlow && stallId && hallId) {
        router.push({
          pathname: '/booking/checkout',
          params: {
            stallId,
            hallId,
            bookingContext: 'stall-booking',
            productDetails: productDetails || '',
            preferredSpaceType: preferredSpaceType || '',
            discountCode: discountCode || '',
          },
        });
      } else {
        Alert.alert('Profile Updated', 'Your exhibitor profile has been saved successfully.', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/profile'),
          },
        ]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save details. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const wordCount = companyProfile.trim()
    ? companyProfile.trim().split(/\s+/).length
    : 0;

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exhibitor Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              Fill in your company details. These will be printed in the exhibition directory and used for your booking.
            </Text>
          </View>

          {/* ── Section 1: Company & Contact ── */}
          <SectionHeader title="Company & Contact" icon="business-outline" />

          {/* Logo */}
          <View style={styles.logoRow}>
            <TouchableOpacity style={styles.logoBox} onPress={pickLogo}>
              {logoUri || existingLogoUrl ? (
                <Image
                  source={{ uri: logoUri || existingLogoUrl }}
                  style={styles.logoImage}
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                  <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoHint}>Upload your company logo (1:1 ratio, JPG or PNG)</Text>
              <TouchableOpacity onPress={pickLogo} style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
            <View style={styles.logoRow}>
              <TouchableOpacity style={styles.logoBox} onPress={pickProfileImage}>
                {profileImageUri || existingProfileImageUrl ? (
                  <Image
                    source={{ uri: profileImageUri || existingProfileImageUrl }}
                    style={styles.logoImage}
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="person-outline" size={28} color={Colors.primary} />
                    <Text style={styles.logoPlaceholderText}>Profile Image</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoHint}>Upload a speaker/person profile picture</Text>
                <TouchableOpacity onPress={pickProfileImage} style={styles.uploadBtn}>
                  <Text style={styles.uploadBtnText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          {/* Contact Prefix Picker inline */}
          <FormLabel label="Contact Person" required />
          <View style={styles.prefixRow}>
            <TouchableOpacity
              style={styles.prefixBtn}
              onPress={() => setShowPrefixPicker((v) => !v)}
            >
              <Text style={styles.prefixBtnText}>{prefix}</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Full Name"
              placeholderTextColor={Colors.placeholder}
              value={contactPerson}
              onChangeText={setContactPerson}
            />
          </View>
          {showPrefixPicker && (
            <View style={styles.dropdownBox}>
              {CONTACT_PREFIXES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.dropdownItem}
                  onPress={() => { setPrefix(p); setShowPrefixPicker(false); }}
                >
                  <Text style={styles.dropdownItemText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FormLabel label="Company Name" required />
          <TextInput
            style={styles.input}
            placeholder="Your company / organisation name"
            placeholderTextColor={Colors.placeholder}
            value={companyName}
            onChangeText={setCompanyName}
          />

          <FormLabel label="Chief Executive Name" />
          <TextInput
            style={styles.input}
            placeholder="CEO / MD Name"
            placeholderTextColor={Colors.placeholder}
            value={chiefExecutiveName}
            onChangeText={setChiefExecutiveName}
          />

          <FormLabel label="Email Address" required />
          <TextInput
            style={styles.input}
            placeholder="company@example.com"
            placeholderTextColor={Colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormRow>
            <View style={{ flex: 1 }}>
              <FormLabel label="Mobile" required />
              <TextInput
                style={styles.input}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={Colors.placeholder}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormLabel label="Telephone" />
              <TextInput
                style={styles.input}
                placeholder="STD code + number"
                placeholderTextColor={Colors.placeholder}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
              />
            </View>
          </FormRow>

            <FormRow>
              <View style={{ flex: 1 }}>
                <FormLabel label="Fax" />
                <TextInput
                  style={styles.input}
                  placeholder="Fax number"
                  placeholderTextColor={Colors.placeholder}
                  value={fax}
                  onChangeText={setFax}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormLabel label="Website" />
                <TextInput
                  style={styles.input}
                  placeholder="https://www.example.com"
                  placeholderTextColor={Colors.placeholder}
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </FormRow>
          <FormLabel label="Address" required />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Street address, building, floor..."
            placeholderTextColor={Colors.placeholder}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />

          <FormRow>
            <View style={{ flex: 1 }}>
              <FormLabel label="City" required />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.placeholder}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormLabel label="State / Province" />
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor={Colors.placeholder}
                value={state}
                onChangeText={setState}
              />
            </View>
          </FormRow>

          <FormRow>
            <View style={{ flex: 1 }}>
              <FormLabel label="PIN / ZIP Code" />
              <TextInput
                style={styles.input}
                placeholder="400001"
                placeholderTextColor={Colors.placeholder}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormLabel label="Country" />
              <TouchableOpacity
                style={[styles.input, styles.pickerInput]}
                onPress={() => setShowCountryPicker((v) => !v)}
              >
                <Text style={styles.pickerInputText}>{country}</Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </FormRow>
          {showCountryPicker && (
            <View style={styles.dropdownBox}>
              <TextInput
                style={[styles.input, { marginBottom: Spacing.xs }]}
                placeholder="Search country..."
                placeholderTextColor={Colors.placeholder}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {filteredCountries.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => { setCountry(c); setShowCountryPicker(false); setCountrySearch(''); }}
                  >
                    <Text style={styles.dropdownItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Section 3: Company Profile ── */}
          <SectionHeader title="Company Profile" icon="document-text-outline" />

          <FormLabel label={`About your company (${wordCount}/100 words)`} />
          <TextInput
            style={[styles.input, styles.multilineInput, { height: 100 }]}
            placeholder="Describe your company, products, and services in 100 words or less..."
            placeholderTextColor={Colors.placeholder}
            value={companyProfile}
            onChangeText={setCompanyProfile}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {wordCount > 100 && (
            <Text style={styles.wordCountError}>Exceeds 100 word limit</Text>
          )}

          {/* IPPF Membership */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIppfMember((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>IPPF Member</Text>
              <Text style={styles.toggleSub}>Indian Plastic Products Federation</Text>
            </View>
            <View style={[styles.toggle, ippfMember && styles.toggleOn]}>
              <View style={[styles.toggleThumb, ippfMember && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          {ippfMember && (
            <>
              <FormLabel label="Membership Number" />
              <TextInput
                style={styles.input}
                placeholder="IPPF-XXXX"
                placeholderTextColor={Colors.placeholder}
                value={membershipNumber}
                onChangeText={setMembershipNumber}
              />
            </>
          )}

            <SectionHeader title="Tax Information" icon="card-outline" />

            <FormRow>
              <View style={{ flex: 1 }}>
                <FormLabel label="GST Number" />
                <TextInput
                  style={styles.input}
                  placeholder="GSTIN"
                  placeholderTextColor={Colors.placeholder}
                  value={gst}
                  onChangeText={setGst}
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormLabel label="PAN Number" />
                <TextInput
                  style={styles.input}
                  placeholder="PAN"
                  placeholderTextColor={Colors.placeholder}
                  value={pan}
                  onChangeText={setPan}
                  autoCapitalize="characters"
                />
              </View>
            </FormRow>

            <FormLabel label="TAN Number" />
            <TextInput
              style={styles.input}
              placeholder="TAN (optional)"
              placeholderTextColor={Colors.placeholder}
              value={tan}
              onChangeText={setTan}
              autoCapitalize="characters"
            />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {inBookingFlow ? 'Save & Continue to Booking' : 'Save Profile'}
                </Text>
                {inBookingFlow && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={sectionHeaderStyles.container}>
      <View style={sectionHeaderStyles.iconWrap}>
        <Ionicons name={icon as never} size={18} color={Colors.primary} />
      </View>
      <Text style={sectionHeaderStyles.title}>{title}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primarySurface,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.primary,
  },
});

function FormLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={labelStyles.text}>
      {label}
      {required && <Text style={labelStyles.required}> *</Text>}
    </Text>
  );
}

const labelStyles = StyleSheet.create({
  text: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  required: { color: Colors.error },
});

function FormRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: Spacing.sm }}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  loaderText: { fontSize: Typography.size.sm, color: Colors.textMuted },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  scrollContent: { padding: Spacing.base },

  infoBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoBannerText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    lineHeight: 20,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
  },
  logoPlaceholderText: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  logoHint: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  uploadBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignSelf: 'flex-start',
  },
  uploadBtnText: { fontSize: Typography.size.xs, fontWeight: '600', color: Colors.primary },

  // Input
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  multilineInput: { height: 'auto', paddingVertical: Spacing.md },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerInputText: { fontSize: Typography.size.sm, color: Colors.textPrimary },

  // Prefix row
  prefixRow: { flexDirection: 'row', gap: Spacing.sm },
  prefixBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    minWidth: 70,
  },
  prefixBtnText: { fontSize: Typography.size.sm, color: Colors.textPrimary, fontWeight: '600' },

  // Dropdown
  dropdownBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    marginTop: 4,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  dropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownItemText: { fontSize: Typography.size.sm, color: Colors.textPrimary },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.textPrimary },
  toggleSub: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  wordCountError: {
    fontSize: Typography.size.xs,
    color: Colors.error,
    marginTop: 4,
  },
  hint: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Segments
  segmentPrompt: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  segmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  segmentActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  segmentText: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentTextActive: { color: Colors.primary, fontWeight: '700' },

  // Submit
  submitBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: '700' },
});
