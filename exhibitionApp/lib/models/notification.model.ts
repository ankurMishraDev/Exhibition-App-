import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'booking_approved' | 'payment_updated' | 'generic';

export interface NotificationModel {
  id: string;
  exhibitorId: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId?: string;
  stallId?: string;
  stallCode?: string;
  read: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
