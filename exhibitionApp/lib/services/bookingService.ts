import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BookingModel, BookingStatus } from '@/lib/models/booking.model';
import { ExhibitorModel } from '@/lib/models/exhibitor.model';
import { StallModel } from '@/lib/models/stall.model';
import { HallModel } from '@/lib/models/hall.model';

export async function createBooking(params: {
  stall: StallModel;
  hall: HallModel;
  exhibitor: ExhibitorModel;
}): Promise<string> {
  const { stall, hall, exhibitor } = params;

  const bookingRef = doc(collection(db, 'bookings'));
  const stallRef = doc(db, 'stalls', stall.id);
  const now = serverTimestamp();

  await runTransaction(db, async (txn) => {
    const stallSnap = await txn.get(stallRef);
    if (!stallSnap.exists() || stallSnap.data().status !== 'available') {
      throw new Error('This stall is no longer available. Please select another.');
    }

    const booking: Omit<BookingModel, 'id' | 'createdAt' | 'updatedAt' | 'bookingDate'> & {
      createdAt: unknown;
      updatedAt: unknown;
      bookingDate: unknown;
    } = {
      stallId: stall.id,
      stallCode: stall.stallCode,
      hallId: hall.id,
      hallName: hall.hallName,
      exhibitorId: exhibitor.id,
      exhibitorName: `${exhibitor.contactPrefix} ${exhibitor.contactPerson}`.trim(),
      companyName: exhibitor.companyName,
      bookingDate: now,
      status: 'pending_approval',
      totalAmount: stall.price,
      exhibitorSnapshot: {
        contactPerson: exhibitor.contactPerson,
        mobile: exhibitor.mobile,
        email: exhibitor.email,
        address: exhibitor.address,
        city: exhibitor.city,
        country: exhibitor.country,
        website: exhibitor.website,
      },
      productDetails: exhibitor.productDetails
        ? {
            segments: exhibitor.productDetails.segments,
            categories: exhibitor.productDetails.categories,
            machineryDescription: exhibitor.productDetails.machineryDescription,
            rawMaterialDescription: exhibitor.productDetails.rawMaterialDescription,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    txn.set(bookingRef, booking);
    txn.update(stallRef, {
      status: 'reserved',
      exhibitorId: exhibitor.id,
      bookingId: bookingRef.id,
      updatedAt: now,
    });
  });

  return bookingRef.id;
}

export async function getBookingById(id: string): Promise<BookingModel | null> {
  const snap = await getDoc(doc(db, 'bookings', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BookingModel) : null;
}

export async function getExhibitorBookings(exhibitorId: string): Promise<BookingModel[]> {
  const q = query(
    collection(db, 'bookings'),
    where('exhibitorId', '==', exhibitorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingModel));
}

export function subscribeToExhibitorBookings(
  exhibitorId: string,
  callback: (bookings: BookingModel[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'bookings'),
    where('exhibitorId', '==', exhibitorId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingModel)));
  });
}

export async function cancelBooking(bookingId: string, stallId: string): Promise<void> {
  const now = serverTimestamp();
  const bookingRef = doc(db, 'bookings', bookingId);
  const stallRef = doc(db, 'stalls', stallId);

  await runTransaction(db, async (txn) => {
    txn.update(bookingRef, {
      status: 'cancelled' as BookingStatus,
      updatedAt: now,
    });
    txn.update(stallRef, {
      status: 'available',
      exhibitorId: null,
      bookingId: null,
      updatedAt: now,
    });
  });
}
