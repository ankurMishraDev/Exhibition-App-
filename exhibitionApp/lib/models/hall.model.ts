export interface HallModel {
  id: string;
  hallName: string;
  hallMapUrl?: string;
  eventMapUrl?: string;
  stallCount: number;
  availableCount: number;
  createdAt: string;
  updatedAt: string;
}
