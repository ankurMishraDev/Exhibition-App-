import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Stall, StallStatus } from '@/types';

export const StallService = {
  async getStallsByHall(hallId: string): Promise<Stall[]> {
    const q = query(
      collection(db, 'stalls'),
      where('hallId', '==', hallId),
      orderBy('stallCode')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Stall));
  },

  async getStall(stallId: string): Promise<Stall | null> {
    const snap = await getDoc(doc(db, 'stalls', stallId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Stall;
  },

  /** Real-time listener for a hall's stalls — keeps grid in sync */
  subscribeToHallStalls(
    hallId: string,
    onUpdate: (stalls: Stall[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'stalls'),
      where('hallId', '==', hallId),
      orderBy('stallCode')
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Stall)));
    });
  },

  /** Summary counts for a hall */
  async getHallStats(hallId: string): Promise<{ available: number; reserved: number; booked: number }> {
    const stalls = await StallService.getStallsByHall(hallId);
    return stalls.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      },
      { available: 0, reserved: 0, booked: 0 }
    );
  },
};
