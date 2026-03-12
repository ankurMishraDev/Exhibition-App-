import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StallModel, StallStatus } from '@/lib/models/stall.model';

export async function getStallsByHall(hallId: string): Promise<StallModel[]> {
  const q = query(
    collection(db, 'stalls'),
    where('hallId', '==', hallId)
  );
  const snap = await getDocs(q);
  const stalls = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StallModel));
  return stalls.sort((a, b) => a.stallCode.localeCompare(b.stallCode));
}

export async function getStallById(id: string): Promise<StallModel | null> {
  const snap = await getDoc(doc(db, 'stalls', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as StallModel) : null;
}

// Real-time listener — returns unsubscribe function
export function subscribeToHallStalls(
  hallId: string,
  callback: (stalls: StallModel[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'stalls'),
    where('hallId', '==', hallId)
  );
  return onSnapshot(q, (snap) => {
    const stalls = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StallModel));
    callback(stalls.sort((a, b) => a.stallCode.localeCompare(b.stallCode)));
  });
}

export async function reserveStall(stallId: string, exhibitorId: string): Promise<void> {
  await updateDoc(doc(db, 'stalls', stallId), {
    status: 'reserved' as StallStatus,
    exhibitorId,
    updatedAt: serverTimestamp(),
  });
}

export async function releaseStall(stallId: string): Promise<void> {
  await updateDoc(doc(db, 'stalls', stallId), {
    status: 'available' as StallStatus,
    exhibitorId: null,
    bookingId: null,
    updatedAt: serverTimestamp(),
  });
}
