import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AppNotification } from '@/types';

export const NotificationService = {
  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  },

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  },

  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: AppNotification[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    });
  },
};
