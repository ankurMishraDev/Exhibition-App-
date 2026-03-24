import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
export type StallStatus = 'available' | 'reserved' | 'booked';
export type DiscountType = 'percentage' | 'flat';
export type DiscountDecision = 'pending' | 'accepted' | 'rejected';

function stripUndefinedFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export interface Hall {
  id: string;
  hallCode: string;
  hallName: string;
  dimensions?: string;
  hallMapUrl?: string;
  eventMapUrl?: string;
  stallCount: number;
  availableCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Stall {
  id: string;
  stallCode: string;
  hallId: string;
  hallName: string;
  ratePerSqm?: number;
  length: number;
  breadth: number;
  area: number;
  basePrice: number;
  gstAmount: number;
  totalPrice: number;
  status: StallStatus;
  exhibitorId?: string | null;
  bookingId?: string | null;
  spaceType: string;
  features: string[];
  row?: number;
  col?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Booking {
  id: string;
  stallId: string;
  stallCode: string;
  hallId: string;
  hallName: string;
  spaceType?: string;
  preferredSpaceType?: string;
  exhibitorId: string;
  exhibitorName: string;
  companyName: string;
  bookingDate: string;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  totalAmount: number;
  finalAmount?: number;
  discountCode?: string;
  discountDecision?: DiscountDecision;
  discountApplied?: {
    discountId?: string;
    type: DiscountType;
    value: number;
    amount: number;
    finalAmount: number;
  };
  exhibitorSnapshot?: Record<string, unknown>;
  productDetails?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  exhibitorIds?: string[];
  stallIds?: string[];
  isActive: boolean;
  expiryDate?: string;
  createdBy: string;
  used?: boolean;
  usedByBookingId?: string;
  usedByExhibitorId?: string;
  usedByStallId?: string;
  decision?: DiscountDecision;
  usedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Exhibitor {
  id: string;
  userId: string;
  contactPrefix: string;
  contactPerson: string;
  chiefExecutiveName?: string;
  companyName: string;
  email: string;
  mobile: string;
  telephone?: string;
  fax?: string;
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  country: string;
  website?: string;
  companyProfile?: string;
  ippfMember: boolean;
  membershipNumber?: string;
  logoUrl?: string;
  profileImage?: string;
  gst?: string;
  pan?: string;
  tan?: string;
  productDetails?: {
    segments: string[];
    categories: string[];
    machineryDescription: string;
    rawMaterialDescription: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Payment {
  id: string;
  bookingId: string;
  exhibitorId: string;
  stallId: string;
  stallCode: string;
  companyName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentRecords: PaymentRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentRecord {
  amount: number;
  date: Timestamp;
  method: string;
  reference?: string;
  notes?: string;
  screenshotUrl?: string;
  recordedBy: string;
}

async function createExhibitorNotification(params: {
  exhibitorId: string;
  type: 'booking_approved' | 'payment_updated';
  title: string;
  body: string;
  bookingId?: string;
  stallId?: string;
  stallCode?: string;
}): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    exhibitorId: params.exhibitorId,
    type: params.type,
    title: params.title,
    body: params.body,
    bookingId: params.bookingId,
    stallId: params.stallId,
    stallCode: params.stallCode,
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─── Halls ────────────────────────────────────────────────────────────────────

export async function getHalls(): Promise<Hall[]> {
  const snap = await getDocs(collection(db, 'halls'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hall));
}

export async function createHall(data: Omit<Hall, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'halls'), {
    ...stripUndefinedFields(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHall(id: string, data: Partial<Hall>): Promise<void> {
  await updateDoc(doc(db, 'halls', id), { ...stripUndefinedFields(data), updatedAt: serverTimestamp() });
}

export async function deleteHall(id: string): Promise<void> {
  await deleteDoc(doc(db, 'halls', id));
}

// ─── Stalls ───────────────────────────────────────────────────────────────────

export async function getStallsByHall(hallId: string): Promise<Stall[]> {
  const q = query(
    collection(db, 'stalls'),
    where('hallId', '==', hallId)
  );
  const snap = await getDocs(q);
  const stalls = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Stall));
  return stalls.sort((a, b) => a.stallCode.localeCompare(b.stallCode));
}

export async function createStall(data: Omit<Stall, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'stalls'), {
    ...stripUndefinedFields(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStall(id: string, data: Partial<Stall>): Promise<void> {
  await updateDoc(doc(db, 'stalls', id), { ...stripUndefinedFields(data), updatedAt: serverTimestamp() });
}

export async function deleteStall(id: string): Promise<void> {
  await deleteDoc(doc(db, 'stalls', id));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function getAllBookings(): Promise<Booking[]> {
  const snap = await getDocs(collection(db, 'bookings'));
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  return bookings.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function subscribeToAllBookings(callback: (bookings: Booking[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'bookings'), (snap) => {
    const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
  });
}

export async function approveBooking(
  bookingId: string,
  stallId: string,
  adminEmail: string,
  notes?: string
): Promise<void> {
  const ts = serverTimestamp();
  const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
  const booking = bookingSnap.exists() ? ({ id: bookingSnap.id, ...bookingSnap.data() } as Booking) : null;

  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'approved',
    adminNotes: notes || '',
    approvedBy: adminEmail,
    approvedAt: ts,
    updatedAt: ts,
  });
  await updateDoc(doc(db, 'stalls', stallId), {
    status: 'booked',
    bookingId,
    updatedAt: ts,
  });

  if (booking?.exhibitorId) {
    await createExhibitorNotification({
      exhibitorId: booking.exhibitorId,
      type: 'booking_approved',
      title: 'Booking Approved',
      body: `Your booking for stall ${booking.stallCode} has been approved.${notes ? ` Note: ${notes}` : ''}`,
      bookingId,
      stallId,
      stallCode: booking.stallCode,
    });
  }
}

export async function rejectBooking(
  bookingId: string,
  stallId: string,
  notes: string
): Promise<void> {
  const ts = serverTimestamp();
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'rejected',
    adminNotes: notes,
    updatedAt: ts,
  });
  await updateDoc(doc(db, 'stalls', stallId), {
    status: 'available',
    exhibitorId: null,
    bookingId: null,
    updatedAt: ts,
  });
}

// ─── Exhibitors ───────────────────────────────────────────────────────────────

export async function getAllExhibitors(): Promise<Exhibitor[]> {
  const snap = await getDocs(collection(db, 'exhibitors'));
  const exhibitors = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exhibitor));
  return exhibitors.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
}
 
// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getAllPayments(): Promise<Payment[]> {
  const snap = await getDocs(collection(db, 'payments'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
}

export async function getPaymentByBooking(bookingId: string): Promise<Payment | null> {
  const q = query(collection(db, 'payments'), where('bookingId', '==', bookingId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Payment;
}

export async function addPaymentRecord(
  bookingId: string,
  record: PaymentRecord
): Promise<void> {
  const existing = await getPaymentByBooking(bookingId);

  if (existing) {
    const newPaid = existing.paidAmount + record.amount;
    await updateDoc(doc(db, 'payments', existing.id), {
      paidAmount: newPaid,
      remainingAmount: existing.totalAmount - newPaid,
      paymentRecords: [...existing.paymentRecords, record],
      updatedAt: serverTimestamp(),
    });

    await createExhibitorNotification({
      exhibitorId: existing.exhibitorId,
      type: 'payment_updated',
      title: 'Payment Updated',
      body: `Payment of INR ${Math.round(record.amount).toLocaleString('en-IN')} received for stall ${existing.stallCode}. Remaining amount: INR ${Math.max(0, existing.totalAmount - newPaid).toLocaleString('en-IN')}.`,
      bookingId,
      stallId: existing.stallId,
      stallCode: existing.stallCode,
    });
  }
}

export async function createPaymentRecord(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'payments'), {
    ...stripUndefinedFields(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createExhibitorNotification({
    exhibitorId: data.exhibitorId,
    type: 'payment_updated',
    title: 'Payment Updated',
    body: `Payment of INR ${Math.round(data.paidAmount).toLocaleString('en-IN')} recorded for stall ${data.stallCode}. Remaining amount: INR ${Math.max(0, data.remainingAmount).toLocaleString('en-IN')}.`,
    bookingId: data.bookingId,
    stallId: data.stallId,
    stallCode: data.stallCode,
  });

  return ref.id;
}

export function calculateDiscountAmount(totalAmount: number, type: DiscountType, value: number): { amount: number; finalAmount: number } {
  const normalizedTotal = Math.max(0, totalAmount || 0);
  const normalizedValue = Math.max(0, value || 0);
  const amount = type === 'percentage'
    ? Math.min(normalizedTotal, (normalizedTotal * normalizedValue) / 100)
    : Math.min(normalizedTotal, normalizedValue);
  const finalAmount = Math.max(0, normalizedTotal - amount);
  return { amount: Math.round(amount), finalAmount: Math.round(finalAmount) };
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  const snap = await getDocs(collection(db, 'discounts'));
  const today = new Date();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Discount))
    .filter((d) => {
      if (!d.isActive || d.used) return false;
      if (!d.expiryDate) return true;
      const expiry = new Date(d.expiryDate);
      return !Number.isNaN(expiry.getTime()) && expiry >= today;
    });
}

export async function createDiscount(data: {
  code: string;
  type: DiscountType;
  value: number;
  exhibitorIds?: string[];
  stallIds?: string[];
  isActive: boolean;
  expiryDate?: string;
  createdBy: string;
}): Promise<string> {
  const code = data.code.trim().toUpperCase();
  if (!code) throw new Error('Discount code is required');
  if (!(data.value > 0)) throw new Error('Discount value must be greater than zero');
  const ref = doc(db, 'discounts', code);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error('Discount code already exists. Generate a different code.');
  }

  await setDoc(ref, {
    ...stripUndefinedFields({
      code,
      type: data.type,
      value: data.value,
      exhibitorIds: data.exhibitorIds,
      stallIds: data.stallIds,
      isActive: data.isActive,
      expiryDate: data.expiryDate,
      createdBy: data.createdBy,
      used: false,
      decision: 'pending' as DiscountDecision,
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAllDiscounts(): Promise<Discount[]> {
  const snap = await getDocs(collection(db, 'discounts'));
  const discounts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Discount));
  return discounts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function getDiscountByCode(code: string): Promise<Discount | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const snap = await getDoc(doc(db, 'discounts', normalized));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Discount;
}

export async function consumeDiscountCode(params: {
  code: string;
  bookingId: string;
  exhibitorId?: string;
  stallId?: string;
  decision: Exclude<DiscountDecision, 'pending'>;
}): Promise<Discount | null> {
  const normalized = params.code.trim().toUpperCase();
  if (!normalized) return null;
  const discountRef = doc(db, 'discounts', normalized);
  return runTransaction(db, async (txn) => {
    const snap = await txn.get(discountRef);
    if (!snap.exists()) return null;

    const existing = { id: snap.id, ...snap.data() } as Discount;
    if (existing.used) {
      throw new Error('This discount code has already been used.');
    }

    txn.update(discountRef, {
      used: true,
      isActive: false,
      decision: params.decision,
      usedByBookingId: params.bookingId,
      usedByExhibitorId: params.exhibitorId,
      usedByStallId: params.stallId,
      usedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return existing;
  });
}

export async function updateBookingDiscount(
  bookingId: string,
  data: Pick<Booking, 'discountCode' | 'discountDecision' | 'discountApplied' | 'finalAmount'>,
): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    ...stripUndefinedFields(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function getDashboardStats(): Promise<{
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  totalRevenue: number;
  totalExhibitors: number;
  totalHalls: number;
}> {
  const [bookingsSnap, exhibitorsSnap, hallsSnap] = await Promise.all([
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'exhibitors')),
    getDocs(collection(db, 'halls')),
  ]);

  const bookings = bookingsSnap.docs.map((d) => d.data() as Booking);
  const pending = bookings.filter((b) => b.status === 'pending_approval').length;
  const approved = bookings.filter((b) => b.status === 'approved').length;
  const totalRevenue = bookings
    .filter((b) => b.status === 'approved')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return {
    totalBookings: bookings.length,
    pendingBookings: pending,
    approvedBookings: approved,
    totalRevenue,
    totalExhibitors: exhibitorsSnap.size,
    totalHalls: hallsSnap.size,
  };
}
