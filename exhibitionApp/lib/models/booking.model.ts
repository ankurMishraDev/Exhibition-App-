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
  bookingDate: string;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  totalAmount: number;
  exhibitorSnapshot?: Partial<ExhibitorModel>;
  productDetails?: Partial<ProductDetailsModel>;
  createdAt: string;
  updatedAt: string;
}
