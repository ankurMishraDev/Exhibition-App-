import { Timestamp } from 'firebase/firestore';

export type DiscountType = 'percentage' | 'flat';
export type DiscountDecision = 'pending' | 'accepted' | 'rejected';

export interface DiscountModel {
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
