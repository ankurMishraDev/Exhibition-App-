import { BrandColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  stallNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}

export function PaymentModal({ visible, amount, stallNumber, onConfirm, onCancel, processing }: PaymentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Confirm Payment
          </ThemedText>

          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Stall Number:</ThemedText>
              <ThemedText style={styles.detailValue}>{stallNumber}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Amount:</ThemedText>
              <ThemedText style={[styles.detailValue, styles.amountText]}>
                ₹{amount.toLocaleString('en-IN')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.mockPaymentNotice}>
            <ThemedText style={styles.noticeText}>
              🧪 Mock Payment Mode
            </ThemedText>
            <ThemedText style={styles.noticeSubtext}>
              This is a test payment. No real transaction will occur.
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={processing}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={processing}
            >
              <LinearGradient
                colors={[BrandColors.green[500], BrandColors.green[700]]}
                style={styles.confirmButtonGradient}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.confirmButtonText}>Process Payment</ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

interface SuccessModalProps {
  visible: boolean;
  bookingId: string;
  stallNumber: string;
  amount: number;
  eventName: string;
  onClose: () => void;
  onViewBookings: () => void;
}

export function SuccessModal({ visible, bookingId, stallNumber, amount, eventName, onClose, onViewBookings }: SuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.successIcon}>
            <ThemedText style={styles.successEmoji}>🎉</ThemedText>
          </View>

          <ThemedText type="title" style={styles.successTitle}>
            Booking Confirmed!
          </ThemedText>

          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <ThemedText style={styles.receiptLabel}>Booking ID:</ThemedText>
              <ThemedText style={styles.receiptValue}>{bookingId.slice(0, 8).toUpperCase()}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText style={styles.receiptLabel}>Event:</ThemedText>
              <ThemedText style={styles.receiptValue}>{eventName}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText style={styles.receiptLabel}>Stall:</ThemedText>
              <ThemedText style={styles.receiptValue}>{stallNumber}</ThemedText>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <ThemedText style={styles.receiptLabel}>Amount Paid:</ThemedText>
              <ThemedText style={[styles.receiptValue, styles.amountPaid]}>
                ₹{amount.toLocaleString('en-IN')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={onClose}
            >
              <ThemedText style={styles.outlineButtonText}>Done</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onViewBookings}
            >
              <LinearGradient
                colors={[BrandColors.purple[500], BrandColors.purple[700]]}
                style={styles.confirmButtonGradient}
              >
                <ThemedText style={styles.confirmButtonText}>View Bookings</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  detailLabel: {
    fontSize: 16,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountText: {
    color: BrandColors.green[600],
    fontSize: 18,
  },
  mockPaymentNotice: {
    backgroundColor: BrandColors.orange[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BrandColors.orange[200],
  },
  noticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.orange[700],
    textAlign: 'center',
    marginBottom: 4,
  },
  noticeSubtext: {
    fontSize: 12,
    color: BrandColors.orange[600],
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: BrandColors.green[600],
  },
  receiptBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  amountPaid: {
    fontSize: 18,
    color: BrandColors.green[600],
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: BrandColors.purple[600],
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.purple[600],
  },
});
