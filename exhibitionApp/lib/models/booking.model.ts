import { Timestamp } from 'firebase/firestore';
import { ExhibitorModel, ProductDetailsModel } from './exhibitor.model';

export type BookingStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface BookingModel {
  id: string;
  stallId: string;
  stallCode: string;
  hallId: string;
  hallName: string;
  exhibitorId: string;
  exhibitorName: string;
  companyName: string;
  bookingDate: Timestamp;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
  totalAmount: number;
  exhibitorSnapshot?: Partial<ExhibitorModel>;
  productDetails?: Partial<ProductDetailsModel>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
