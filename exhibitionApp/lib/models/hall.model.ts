import { Timestamp } from 'firebase/firestore';

export interface HallModel {
  id: string;
  hallCode: string;
  hallName: string;
  dimensions?: string;
  hallMapUrl?: string;
  eventMapUrl?: string;
  stallCount: number;
  availableCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
