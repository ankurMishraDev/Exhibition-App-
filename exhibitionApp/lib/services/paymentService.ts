import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaymentModel } from '@/lib/models/payment.model';

export async function getPaymentByBookingId(bookingId: string): Promise<PaymentModel | null> {
  const q = query(
    collection(db, 'payments'),
    where('bookingId', '==', bookingId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PaymentModel;
}

export async function getExhibitorPayments(exhibitorId: string): Promise<PaymentModel[]> {
  const q = query(
    collection(db, 'payments'),
    where('exhibitorId', '==', exhibitorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentModel));
}

export function subscribeToPayment(
  bookingId: string,
  callback: (payment: PaymentModel | null) => void
): Unsubscribe {
  const q = query(
    collection(db, 'payments'),
    where('bookingId', '==', bookingId)
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const d = snap.docs[0];
      callback({ id: d.id, ...d.data() } as PaymentModel);
    }
  });
}

export function subscribeToExhibitorPayments(
  exhibitorId: string,
  callback: (payments: PaymentModel[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'payments'),
    where('exhibitorId', '==', exhibitorId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentModel));
    callback(data);
  });
}
