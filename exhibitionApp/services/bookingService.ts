import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking, BookingStatus } from '@/types';

export const BookingService = {
  /**
   * Creates a booking and atomically sets the stall to 'reserved'.
   * Returns immediately — admin approval moves it to 'approved'.
   */
  async createBooking(data: {
    stallId: string;
    stallCode: string;
    hallId: string;
    exhibitorId: string;
    totalAmount: number;
  }): Promise<{ bookingId: string; error: string | null }> {
    try {
      const bookingRef = doc(collection(db, 'bookings'));
      const stallRef = doc(db, 'stalls', data.stallId);
      const now = new Date().toISOString();

      await runTransaction(db, async (tx) => {
        const stallSnap = await tx.get(stallRef);
        if (!stallSnap.exists()) throw new Error('Stall not found');
        if (stallSnap.data().status !== 'available') {
          throw new Error('Stall is no longer available');
        }

        const booking: Booking = {
          id: bookingRef.id,
          ...data,
          bookingDate: now,
          status: 'pending_approval',
          createdAt: now,
          updatedAt: now,
        };

        tx.set(bookingRef, booking);
        tx.update(stallRef, {
          status: 'reserved',
          exhibitorId: data.exhibitorId,
          bookingId: bookingRef.id,
          updatedAt: now,
        });
      });

      return { bookingId: bookingRef.id, error: null };
    } catch (e: any) {
      return { bookingId: '', error: e.message };
    }
  },

  async getExhibitorBookings(exhibitorId: string): Promise<Booking[]> {
    const q = query(
      collection(db, 'bookings'),
      where('exhibitorId', '==', exhibitorId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  },

  async getBooking(bookingId: string): Promise<Booking | null> {
    const snap = await doc(db, 'bookings', bookingId);
    // use getDoc via import
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(snap);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  },

  subscribeToExhibitorBookings(
    exhibitorId: string,
    onUpdate: (bookings: Booking[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'bookings'),
      where('exhibitorId', '==', exhibitorId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    });
  },
};
