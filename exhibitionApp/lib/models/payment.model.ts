import { Timestamp } from 'firebase/firestore';

export interface PaymentRecord {
  recordId: string;
  amount: number;
  date: Timestamp;
  method: string;
  transactionId?: string;
  notes?: string;
  screenshotUrl?: string;
  addedBy: string;
  addedAt: Timestamp;
}

export interface PaymentModel {
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
