import { Timestamp } from 'firebase/firestore';
import { ExhibitorModel, ProductDetailsModel } from './exhibitor.model';
import { SpaceType } from '@/constants/segments';
import { DiscountDecision, DiscountType } from './discount.model';

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
  spaceType?: SpaceType;
  preferredSpaceType?: SpaceType;
  status: BookingStatus;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
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
  exhibitorSnapshot?: Partial<ExhibitorModel>;
  productDetails?: Partial<ProductDetailsModel>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
