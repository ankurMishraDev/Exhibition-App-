import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getStallById } from '@/lib/services/stallService';
import { getHallById } from '@/lib/services/hallService';
import { getExhibitorByUserId } from '@/lib/services/exhibitorService';
import { createBooking } from '@/lib/services/bookingService';
import { StallModel } from '@/lib/models/stall.model';
import { HallModel } from '@/lib/models/hall.model';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';

export default function BookingCheckoutScreen() {
  const router = useRouter();
  const { stallId, hallId } = useLocalSearchParams<{ stallId: string; hallId: string }>();
  const { user, userModel } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [stall, setStall] = useState<StallModel | null>(null);
  const [hall, setHall] = useState<HallModel | null>(null);
  const [exhibitor, setExhibitor] = useState<ExhibitorModel | null>(null);

  useEffect(() => {
    if (!user || !stallId || !hallId) return;
    (async () => {
      try {
        const [s, h, e] = await Promise.all([
          getStallById(stallId),
          getHallById(hallId),
          getExhibitorByUserId(user.uid),
        ]);
        setStall(s);
        setHall(h);
        setExhibitor(e);
      } catch {
        Alert.alert('Error', 'Could not load booking details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, stallId, hallId]);

  async function handleSubmitBooking() {
    if (!stall || !hall || !exhibitor || !user || !userModel) return;

    Alert.alert(
      'Confirm Booking Request',
      `Submit booking request for stall ${stall.stallCode} in ${hall.hallName}?\n\nAn admin will review and confirm your booking. You will be notified once approved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await createBooking({ stall, hall, exhibitor });
              setSubmitted(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Booking submission failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading booking details...</Text>
      </View>
    );
  }

  // Success state
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.available} />
          </View>
          <Text style={styles.successTitle}>Booking Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your booking request for stall{' '}
            <Text style={styles.bold}>{stall?.stallCode}</Text> in{' '}
            <Text style={styles.bold}>{hall?.hallName}</Text> has been submitted.
          </Text>
          <View style={styles.successInfoCard}>
            <InfoRow icon="time-outline" text="Admin will review your request within 24-48 hours" />
            <InfoRow icon="notifications-outline" text="You will receive a notification once approved" />
            <InfoRow icon="card-outline" text="Payment details will be shared upon approval" />
          </View>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.successBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successBtnOutline}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.successBtnOutlineText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          <Step label="Hall" done />
          <StepLine />
          <Step label="Details" done />
          <StepLine />
          <Step label="Confirm" active />
        </View>

        <View style={styles.content}>
          {/* Stall Summary Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Stall Details</Text>
            </View>

            <View style={styles.stallHighlight}>
              <Text style={styles.stallCodeLarge}>{stall?.stallCode}</Text>
              <Text style={styles.hallName}>{hall?.hallName}</Text>
            </View>

            <View style={styles.divider} />

            <DetailRow label="Space Type" value={stall?.spaceType || '—'} />
            <DetailRow
              label="Dimensions"
              value={stall ? `${stall.length}m × ${stall.breadth}m` : '—'}
            />
            {stall && stall.features.length > 0 && (
              <DetailRow label="Features" value={stall.features.join(', ')} />
            )}
          </View>

          {/* Pricing Card */}
          <View style={[styles.card, styles.priceCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Pricing</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Area</Text>
              <Text style={styles.priceValue}>
                {stall ? `${stall.area} sqm (${stall.length}m × ${stall.breadth}m)` : '—'}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Rate</Text>
              <Text style={styles.priceValue}>₹7,500 / sqm</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Amount</Text>
              <Text style={styles.priceValue}>
                ₹{stall?.basePrice.toLocaleString('en-IN') || '—'}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>
                ₹{stall?.gstAmount.toLocaleString('en-IN') || '—'}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₹{stall?.totalPrice.toLocaleString('en-IN') || '—'}
              </Text>
            </View>

            <View style={styles.paymentNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.paymentNoteText}>
                Payment will be arranged offline. Our team will contact you with bank details after approval.
              </Text>
            </View>
          </View>

          {/* Exhibitor Summary */}
          {exhibitor && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Exhibitor Details</Text>
                <TouchableOpacity
                  style={styles.editLink}
                  onPress={() =>
                    router.push({
                      pathname: '/exhibitor-details',
                      params: { stallId, hallId },
                    })
                  }
                >
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <DetailRow
                label="Company"
                value={exhibitor.companyName}
                bold
              />
              <DetailRow
                label="Contact"
                value={`${exhibitor.contactPrefix} ${exhibitor.contactPerson}`}
              />
              <DetailRow label="Mobile" value={exhibitor.mobile} />
              <DetailRow label="Email" value={exhibitor.email} />
              <DetailRow
                label="Location"
                value={[exhibitor.city, exhibitor.country].filter(Boolean).join(', ')}
              />
              {exhibitor.productDetails?.segments &&
                exhibitor.productDetails.segments.length > 0 && (
                  <DetailRow
                    label="Segments"
                    value={exhibitor.productDetails.segments.slice(0, 3).join(', ') +
                      (exhibitor.productDetails.segments.length > 3 ? '...' : '')}
                  />
                )}
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.termsText}>
              By submitting this booking request, you agree to the{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text> and acknowledge that
              the stall booking is subject to admin approval.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmitBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color={Colors.white} />
                <Text style={styles.submitBtnText}>Submit Booking Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Step({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <View style={stepStyles.container}>
      <View style={[
        stepStyles.circle,
        done && stepStyles.circleDone,
        active && stepStyles.circleActive,
      ]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color={Colors.white} />
        ) : (
          <Text style={[stepStyles.circleText, active && stepStyles.circleTextActive]}>
            {label.charAt(0)}
          </Text>
        )}
      </View>
      <Text style={[stepStyles.label, (done || active) && stepStyles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  circleDone: { backgroundColor: Colors.available, borderColor: Colors.available },
  circleActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  circleText: { fontSize: Typography.size.xs, fontWeight: '700', color: Colors.textMuted },
  circleTextActive: { color: Colors.primary },
  label: { fontSize: Typography.size.xs, color: Colors.textMuted, fontWeight: '500' },
  labelActive: { color: Colors.textPrimary, fontWeight: '700' },
});

function StepLine() {
  return <View style={{ flex: 1, height: 2, backgroundColor: Colors.border, marginTop: -14 }} />;
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, bold && detailStyles.bold]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  label: { flex: 1, fontSize: Typography.size.sm, color: Colors.textMuted },
  value: {
    flex: 1.5,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  bold: { fontWeight: '700' },
});

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as never} size={16} color={Colors.textMuted} style={{ width: 20 }} />
      <Text style={infoStyles.text}>{text}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.xs },
  text: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary },
});

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

  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },

  content: { padding: Spacing.base, gap: Spacing.base },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editLink: { paddingHorizontal: 4 },
  editLinkText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600' },

  stallHighlight: { alignItems: 'center', paddingVertical: Spacing.sm },
  stallCodeLarge: {
    fontSize: Typography.size['3xl'],
    fontWeight: '800',
    color: Colors.primary,
  },
  hallName: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },

  // Price Card
  priceCard: { borderColor: Colors.primarySurface },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  priceDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  priceLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  priceValue: { fontSize: Typography.size.base, fontWeight: '600', color: Colors.textPrimary },
  totalLabel: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.textPrimary },
  totalValue: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  paymentNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // Terms
  termsBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.md,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  termsLink: { color: Colors.primary, fontWeight: '600' },

  // Submit Button
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: '700' },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.background,
  },
  successIconWrap: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  successInfoCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  successBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  successBtnText: { color: Colors.white, fontSize: Typography.size.base, fontWeight: '700' },
  successBtnOutline: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnOutlineText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    fontWeight: '600',
  },
});
