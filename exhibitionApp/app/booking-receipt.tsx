import React, { useEffect, useState } from 'react';
// import { SafeAreaView } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BookingModel } from '@/lib/models/booking.model';
import { PaymentModel } from '@/lib/models/payment.model';
import { getPaymentByBookingId } from '@/lib/services/paymentService';
import { Colors } from '@/constants/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function BookingReceiptScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhibitor, setExhibitor] = useState<any>(null);
  const [payment, setPayment] = useState<PaymentModel | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!id) return;
        const bookingId = Array.isArray(id) ? id[0] : id;
        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingDoc.exists()) {
          const bData = bookingDoc.data() as BookingModel;
          setBooking({ ...bData, id: bookingDoc.id });

          // Fetch payment info
          const pData = await getPaymentByBookingId(bookingId);
          if (pData) {
            setPayment(pData);
          }

          // Fetch exhibitor info
          if (bData.exhibitorId) {
             const exDoc = await getDoc(doc(db, 'exhibitors', bData.exhibitorId));
             if (exDoc.exists()) {
               setExhibitor(exDoc.data());
             }
          }
        }
      } catch (e) {
        console.error('Error fetching booking receipt:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const getDateString = (dateObj: any) => {
    if (!dateObj) return new Date().toLocaleDateString();
    if (dateObj.toDate) return dateObj.toDate().toLocaleDateString();
    return new Date(dateObj).toLocaleDateString();
  };

  const generatePDF = async () => {
    if (!booking) return;
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #9F1A71; padding-bottom: 20px; margin-bottom: 20px; }
              .header h1 { color: #9F1A71; margin: 0; }
              .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .section-title { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 5px;}
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .info-box { background: #f9f9f9; padding: 10px; border-radius: 8px; }
              .info-label { font-size: 12px; color: #777; margin-bottom: 4px; }
              .info-value { font-size: 14px; font-weight: bold; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
              th { background-color: #fcedf5; color: #9F1A71; }
              .total-row td { font-weight: bold; font-size: 18px; color: #9F1A71; border-top: 2px solid #9F1A71; }
              .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Exhibition Stall Booking Receipt</h1>
              <p>Requested / Accepted Booking Application</p>
            </div>

            <div class="details">
              <div>
                <strong>Booking ID:</strong> ${booking.id}<br/>
                <strong>Date:</strong> ${getDateString(booking.createdAt)}<br/>
                <strong>Status:</strong> ${booking.status.toUpperCase()}
              </div>
              <div style="text-align: right;">
                <strong>Exhibitor:</strong> ${exhibitor?.companyName || 'Not Set'}<br/>
                <strong>Contact:</strong> ${exhibitor?.contactPerson || '-'}<br/>
                <strong>Email:</strong> ${exhibitor?.email || '-'}
              </div>
            </div>

            <div class="section-title">Stall Details</div>
            <div class="info-grid">
              <div class="info-box">
                <div class="info-label">Stall Code</div>
                <div class="info-value">${booking.stallCode}</div>
              </div>
              <div class="info-box">
                <div class="info-label">Hall Name</div>
                <div class="info-value">${booking.hallName}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Stall Booking Cost (${booking.stallCode})</td>
                  <td>₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr class="total-row">
                  <td>Total Overall Cost</td>
                  <td>₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 20px; font-size: 14px;">
              <strong>Amount Paid: </strong> ₹${(payment?.paidAmount || 0).toLocaleString('en-IN')}<br/>
              <strong>Remaining Balance: </strong> ₹${(payment?.remainingAmount ?? booking.totalAmount ?? 0).toLocaleString('en-IN')}
            </div>

            <div class="footer">
              <p>This is a system generated receipt and does not require a signature.</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#9F1A71" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loader}>
        <Text>Booking not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Receipt</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={generatePDF}>
          <Ionicons name="download-outline" size={24} color="#9F1A71" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt" size={32} color="#9F1A71" />
            <Text style={styles.receiptTitle}>TAX INVOICE</Text>
            <Text style={styles.receiptId}>#{booking.id.substring(0,8).toUpperCase()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exhibitor Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Company:</Text>
              <Text style={styles.detailValue}>{exhibitor?.companyName || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact:</Text>
              <Text style={styles.detailValue}>{exhibitor?.contactPerson || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{exhibitor?.email || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile:</Text>
              <Text style={styles.detailValue}>{exhibitor?.mobile || 'Not Set'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stall Information</Text>
            <View style={styles.rowGrid}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Stall Code</Text>
                <Text style={styles.gridValue}>{booking.stallCode}</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Hall Name</Text>
                <Text style={styles.gridValue}>{booking.hallName}</Text>
              </View>
            </View>
            <View style={styles.rowGrid}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Status</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValue}>{getDateString(booking.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.dividerDashed} />

          <View style={styles.section}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Base Cost</Text>
              <Text style={styles.billValue}>₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Amount Paid</Text>
              <Text style={[styles.billValue, { color: '#059669' }]}>₹{(payment?.paidAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remaining</Text>
            <Text style={styles.totalValue}>₹{(payment?.remainingAmount ?? booking.totalAmount ?? 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.downloadBtn} onPress={generatePDF}>
          <Ionicons name="document-text-outline" size={20} color="#FFF" />
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scroll: { padding: 20, paddingBottom: 100 },
  
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  receiptTitle: { fontSize: 20, fontWeight: '800', color: '#9F1A71', marginTop: 8 },
  receiptId: { fontSize: 14, color: '#6B7280', marginTop: 4, letterSpacing: 1 },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  dividerDashed: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20, borderStyle: 'dashed', borderWidth: 1 },
  
  section: { marginVertical: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#4B5563' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },

  rowGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gridBox: { flex: 1 },
  gridLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  gridValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  
  statusPill: { backgroundColor: '#FCE7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { color: '#9F1A71', fontSize: 11, fontWeight: '700' },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#4B5563' },
  billValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FDF2F8', padding: 16, borderRadius: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#9F1A71' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#9F1A71' },

  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  downloadBtn: { backgroundColor: '#9F1A71', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backButton: { marginTop: 20, padding: 12, backgroundColor: '#e5e7eb', borderRadius: 8 },
  backButtonText: { fontWeight: '600' },
});