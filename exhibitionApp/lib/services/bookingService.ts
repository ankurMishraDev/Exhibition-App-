import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BookingModel, BookingStatus } from '@/lib/models/booking.model';
import { ExhibitorModel, ProductDetailsModel } from '@/lib/models/exhibitor.model';
import { StallModel } from '@/lib/models/stall.model';
import { HallModel } from '@/lib/models/hall.model';

type BookingProductDetails = Pick<
  ProductDetailsModel,
  'segments' | 'categories'
> & {
  machineryDescription?: string;
  rawMaterialDescription?: string;
};

function timestampToMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const withToMillis = value as { toMillis?: () => number };
  return typeof withToMillis.toMillis === 'function' ? withToMillis.toMillis() : 0;
}

export async function createBooking(params: {
  stall: StallModel;
  hall: HallModel;
  exhibitor: ExhibitorModel;
  productDetails?: BookingProductDetails;
}): Promise<string> {
  const { stall, hall, exhibitor, productDetails } = params;

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
      totalAmount: stall.totalPrice,
      exhibitorSnapshot: {
        id: exhibitor.id,
        userId: exhibitor.userId,
        contactPrefix: exhibitor.contactPrefix,
        contactPerson: exhibitor.contactPerson,
        companyName: exhibitor.companyName,
        email: exhibitor.email,
        mobile: exhibitor.mobile,
        city: exhibitor.city,
        state: exhibitor.state,
        country: exhibitor.country,
      },
      productDetails: productDetails
        ? {
            segments: productDetails.segments,
            categories: productDetails.categories,
           
          }
        : exhibitor.productDetails
        ? {
            segments: exhibitor.productDetails.segments,
            categories: exhibitor.productDetails.categories,
           
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

export async function getAllBookings(): Promise<BookingModel[]> {
  const snap = await getDocs(collection(db, 'bookings'));
  const bookings = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as BookingModel));
  return bookings.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
}

export async function getExhibitorBookings(exhibitorId: string): Promise<BookingModel[]> {
  const q = query(
    collection(db, 'bookings'),
    where('exhibitorId', '==', exhibitorId)
  );
  const snap = await getDocs(q);
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingModel));
  return bookings.sort((a, b) => {
    const timeA = timestampToMillis(a.createdAt);
    const timeB = timestampToMillis(b.createdAt);
    return timeB - timeA;
  });
}

export function subscribeToExhibitorBookings(
  exhibitorId: string,
  callback: (bookings: BookingModel[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'bookings'),
    where('exhibitorId', '==', exhibitorId)
  );
  return onSnapshot(q, (snap) => {
    const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingModel));
    callback(bookings.sort((a, b) => {
      const timeA = timestampToMillis(a.createdAt);
      const timeB = timestampToMillis(b.createdAt);
      return timeB - timeA;
    }));
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
