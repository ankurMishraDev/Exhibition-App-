import { SpaceType } from '@/constants/segments';

export type StallStatus = 'available' | 'reserved' | 'booked';

export interface StallModel {
  id: string;
  stallCode: string;
  hallId: string;
  length: number;
  breadth: number;
  price: number;
  status: StallStatus;
  exhibitorId?: string;
  bookingId?: string;
  spaceType: SpaceType;
  features: string[];
  stallColor?: string;
  row?: number;
  col?: number;
  createdAt: string;
  updatedAt: string;
}
