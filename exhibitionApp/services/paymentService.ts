import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Payment } from '@/types';

export const PaymentService = {
  async getPaymentByBooking(bookingId: string): Promise<Payment | null> {
    const q = query(collection(db, 'payments'), where('bookingId', '==', bookingId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Payment;
  },

  async getExhibitorPayments(exhibitorId: string): Promise<Payment[]> {
    const q = query(collection(db, 'payments'), where('exhibitorId', '==', exhibitorId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
  },

  subscribeToBookingPayment(
    bookingId: string,
    onUpdate: (payment: Payment | null) => void
  ): Unsubscribe {
    const q = query(collection(db, 'payments'), where('bookingId', '==', bookingId));
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.docs[0].id, ...snap.docs[0].data() } as Payment);
      }
    });
  },
};
