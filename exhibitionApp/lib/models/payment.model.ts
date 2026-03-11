export interface PaymentRecord {
  recordId: string;
  amount: number;
  date: string;
  transactionId: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
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
  createdAt: string;
  updatedAt: string;
}
