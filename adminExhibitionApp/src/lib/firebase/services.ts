import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
export type StallStatus = 'available' | 'reserved' | 'booked';

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
  exhibitorId: string;
  exhibitorName: string;
  companyName: string;
  bookingDate: string;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  totalAmount: number;
  exhibitorSnapshot?: Record<string, unknown>;
  productDetails?: Record<string, unknown>;
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

// ─── Halls ────────────────────────────────────────────────────────────────────

export async function getHalls(): Promise<Hall[]> {
  const snap = await getDocs(collection(db, 'halls'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hall));
}

export async function createHall(data: Omit<Hall, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'halls'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHall(id: string, data: Partial<Hall>): Promise<void> {
  await updateDoc(doc(db, 'halls', id), { ...data, updatedAt: serverTimestamp() });
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
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStall(id: string, data: Partial<Stall>): Promise<void> {
  await updateDoc(doc(db, 'stalls', id), { ...data, updatedAt: serverTimestamp() });
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
  }
}

export async function createPaymentRecord(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'payments'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
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
