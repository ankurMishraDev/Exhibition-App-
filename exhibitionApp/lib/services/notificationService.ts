import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { NotificationModel } from '@/lib/models/notification.model';

function timestampToMillis(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  const withToMillis = value as { toMillis?: () => number };
  return typeof withToMillis.toMillis === 'function' ? withToMillis.toMillis() : 0;
}

export function subscribeToExhibitorNotifications(
  exhibitorId: string,
  callback: (notifications: NotificationModel[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('exhibitorId', '==', exhibitorId),
  );

  return onSnapshot(
    q,
    (snap) => {
      const notifications = snap.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }) as NotificationModel)
        .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      callback(notifications);
    },
    (error) => {
      onError?.(error.message || 'Failed to load notifications.');
    },
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
  });
}

export async function markAllNotificationsAsRead(notifications: NotificationModel[]): Promise<void> {
  const unread = notifications.filter((item) => !item.read);
  await Promise.all(unread.map((item) => markNotificationAsRead(item.id)));
}
