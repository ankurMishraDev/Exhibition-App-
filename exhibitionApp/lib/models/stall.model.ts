import { SpaceType } from '@/constants/segments';

export type StallStatus = 'available' | 'reserved' | 'booked';

export interface StallModel {
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
  spaceType: SpaceType;
  features: string[];
  stallColor?: string;
  row?: number;
  col?: number;
  createdAt: string;
  updatedAt: string;
}

export function calculateStallPrice(length: number, breadth: number): {
  area: number;
  basePrice: number;
  gstAmount: number;
  totalPrice: number;
} {
  const area = length * breadth;
  const basePrice = area * 7500;
  const gstAmount = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gstAmount;
  return { area, basePrice, gstAmount, totalPrice };
}
