import {
  collection,
  getDocs,
  doc,
  getDoc,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Hall } from '@/types';

export const HallService = {
  async getAllHalls(): Promise<Hall[]> {
    const q = query(collection(db, 'halls'), orderBy('hallName'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hall));
  },

  async getHall(hallId: string): Promise<Hall | null> {
    const snap = await getDoc(doc(db, 'halls', hallId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Hall;
  },
};
