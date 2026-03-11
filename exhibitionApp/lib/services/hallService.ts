import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { HallModel } from '@/lib/models/hall.model';

export async function getAllHalls(): Promise<HallModel[]> {
  const q = query(collection(db, 'halls'), orderBy('hallName', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HallModel));
}

export async function getHallById(id: string): Promise<HallModel | null> {
  const snap = await getDoc(doc(db, 'halls', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as HallModel) : null;
}
