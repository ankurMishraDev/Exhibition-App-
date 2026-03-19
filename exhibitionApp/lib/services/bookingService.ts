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
import { SpaceType } from '@/constants/segments';
import { DiscountType } from '@/lib/models/discount.model';

type BookingProductDetails = Pick<
  ProductDetailsModel,
  'segments' | 'categories'
>;

function timestampToMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const withToMillis = value as { toMillis?: () => number };
  return typeof withToMillis.toMillis === 'function' ? withToMillis.toMillis() : 0;
}

function calculateDiscount(totalAmount: number, type: DiscountType, value: number): { amount: number; finalAmount: number } {
  const normalizedTotal = Math.max(0, totalAmount || 0);
  const normalizedValue = Math.max(0, value || 0);
  const amount = type === 'percentage'
    ? Math.min(normalizedTotal, (normalizedTotal * normalizedValue) / 100)
    : Math.min(normalizedTotal, normalizedValue);
  return {
    amount: Math.round(amount),
    finalAmount: Math.round(Math.max(0, normalizedTotal - amount)),
  };
}

export async function createBooking(params: {
  stall: StallModel;
  hall: HallModel;
  exhibitor: ExhibitorModel;
  productDetails?: BookingProductDetails;
  preferredSpaceType?: SpaceType;
  discountCode?: string;
}): Promise<string> {
  const { stall, hall, exhibitor, productDetails, preferredSpaceType, discountCode } = params;

  const bookingRef = doc(collection(db, 'bookings'));
  const stallRef = doc(db, 'stalls', stall.id);
  const now = serverTimestamp();
  const normalizedDiscountCode = discountCode?.trim().toUpperCase();

  await runTransaction(db, async (txn) => {
    const stallSnap = await txn.get(stallRef);
    if (!stallSnap.exists() || stallSnap.data().status !== 'available') {
      throw new Error('This stall is no longer available. Please select another.');
    }

    let finalAmount = stall.totalPrice;
    let discountDecision: 'accepted' | 'rejected' | undefined;
    let discountApplied:
      | {
          discountId?: string;
          type: DiscountType;
          value: number;
          amount: number;
          finalAmount: number;
        }
      | undefined;

    if (normalizedDiscountCode) {
      const discountRef = doc(db, 'discounts', normalizedDiscountCode);
      const discountSnap = await txn.get(discountRef);

      if (discountSnap.exists()) {
        const discount = discountSnap.data() as {
          code?: string;
          type?: DiscountType;
          value?: number;
          isActive?: boolean;
          used?: boolean;
          expiryDate?: string;
          exhibitorIds?: string[];
          stallIds?: string[];
        };

        const isExpired = discount.expiryDate ? new Date(discount.expiryDate) < new Date() : false;
        const exhibitorAllowed = !discount.exhibitorIds?.length || discount.exhibitorIds.includes(exhibitor.id);
        const stallAllowed = !discount.stallIds?.length || discount.stallIds.includes(stall.id);
        const canRedeem = Boolean(
          discount.isActive &&
          !discount.used &&
          !isExpired &&
          exhibitorAllowed &&
          stallAllowed &&
          (discount.type === 'percentage' || discount.type === 'flat') &&
          typeof discount.value === 'number' &&
          discount.value > 0,
        );

        if (canRedeem && discount.type && typeof discount.value === 'number') {
          const calc = calculateDiscount(stall.totalPrice, discount.type, discount.value);
          finalAmount = calc.finalAmount;
          discountDecision = 'accepted';
          discountApplied = {
            discountId: discountSnap.id,
            type: discount.type,
            value: discount.value,
            amount: calc.amount,
            finalAmount: calc.finalAmount,
          };
        } else {
          discountDecision = 'rejected';
        }

        // A code can be used only once, even if the outcome is rejected.
        txn.update(discountRef, {
          used: true,
          isActive: false,
          decision: discountDecision,
          usedByBookingId: bookingRef.id,
          usedByExhibitorId: exhibitor.id,
          usedByStallId: stall.id,
          usedAt: now,
          updatedAt: now,
        });
      } else {
        discountDecision = 'rejected';
      }
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
      spaceType: stall.spaceType,
      preferredSpaceType: preferredSpaceType ?? stall.spaceType,
      status: 'pending_approval',
      totalAmount: stall.totalPrice,
      finalAmount,
      discountCode: normalizedDiscountCode || undefined,
      discountDecision,
      discountApplied,
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
