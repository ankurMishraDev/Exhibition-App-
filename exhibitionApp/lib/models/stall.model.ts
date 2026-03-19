import { Timestamp } from 'firebase/firestore';
import { SpaceType } from '@/constants/segments';

export type StallStatus = 'available' | 'reserved' | 'booked';

export interface StallModel {
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
  spaceType: SpaceType;
  features: string[];
  stallColor?: string;
  row?: number;
  col?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function calculateStallPrice(length: number, breadth: number, ratePerSqm = 7500): {
  area: number;
  basePrice: number;
  gstAmount: number;
  totalPrice: number;
} {
  const area = length * breadth;
  const basePrice = area * ratePerSqm;
  const gstAmount = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gstAmount;
  return { area, basePrice, gstAmount, totalPrice };
}
