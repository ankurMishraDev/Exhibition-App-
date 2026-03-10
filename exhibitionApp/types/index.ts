// ── User / Auth ──────────────────────────────────────────────────────────────
export type UserRole = 'exhibitor' | 'visitor';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  expoPushToken?: string;
  createdAt: string;
}

// ── Exhibitor Profile ─────────────────────────────────────────────────────────
export interface ExhibitorProfile {
  id: string;
  userId: string;
  name: string;
  companyName: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
  chiefExecutorName: string;
  contactPerson: 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.';
  designation: string;
  telephoneMobile: string;
  fax?: string;
  companyEmail: string;
  website?: string;
  gstNo?: string;
  pan?: string;
  tan?: string;
  /** Max 100 words */
  companyProfile: string;
  ippfMember: boolean;
  /** Firebase Storage download URL */
  companyLogo?: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Product Details ────────────────────────────────────────────────────────────
export interface ProductDetails {
  id: string;
  exhibitorId: string;
  segments: ProductSegment[];
  categories: string;
}

export type ProductSegment =
  | 'Raw material'
  | 'Injection Moulding'
  | 'Blow Moulding'
  | 'Reprocess Machines'
  | 'Lab & Analytical Equipment'
  | 'Pipes'
  | 'Auxiliary Equipment'
  | 'Virgin Granules'
  | 'Pharma'
  | 'Confectionary'
  | 'Printing'
  | 'Semi & Finished Products'
  | 'Packaging & Printing Equipment'
  | 'Moulds & DIES'
  | 'Reprocess Granules'
  | 'Turnkey Project & Consultants'
  | 'Other';

export const PRODUCT_SEGMENTS: ProductSegment[] = [
  'Raw material',
  'Injection Moulding',
  'Blow Moulding',
  'Reprocess Machines',
  'Lab & Analytical Equipment',
  'Pipes',
  'Auxiliary Equipment',
  'Virgin Granules',
  'Pharma',
  'Confectionary',
  'Printing',
  'Semi & Finished Products',
  'Packaging & Printing Equipment',
  'Moulds & DIES',
  'Reprocess Granules',
  'Turnkey Project & Consultants',
  'Other',
];

// ── Hall ──────────────────────────────────────────────────────────────────────
export interface Hall {
  id: string;
  hallName: string;
  /** Firebase Storage download URL for hall floor plan */
  hallMap?: string;
  /** Firebase Storage download URL for full event map */
  eventMap?: string;
  stallCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Stall ─────────────────────────────────────────────────────────────────────
export type StallStatus = 'available' | 'reserved' | 'booked';

export type SpaceType = 'Bare space' | 'Shell space' | '2-side space' | '3-side space';

export interface Stall {
  id: string;
  /** e.g. "G11", "H10" */
  stallCode: string;
  hallId: string;
  length: number;
  breadth: number;
  price: number;
  exhibitorId?: string;
  status: StallStatus;
  bookingId?: string;
  spaceType: SpaceType;
  features: string[];
  stallColor?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Booking ───────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending_approval' | 'approved' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  stallId: string;
  stallCode: string;
  hallId: string;
  exhibitorId: string;
  bookingDate: string;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────
export interface PaymentRecord {
  recordId: string;
  amount: number;
  date: string;
  transactionId: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  exhibitorId: string;
  stallId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentRecords: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'booking_approved' | 'booking_rejected' | 'payment_received' | 'general';
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

// ── Navigation ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'modal': undefined;
  'hall-selection/index': undefined;
  'hall/[hallId]': { hallId: string };
  'booking/[stallId]': { stallId: string; hallId: string };
  'exhibitor-details': { stallId: string; hallId: string };
};

export type TabParamList = {
  'index': undefined;
  'bookings': undefined;
  'history': undefined;
  'profile': undefined;
};