import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { ExhibitorModel, ProductDetailsModel } from '@/lib/models/exhibitor.model';

// ─── Exhibitor Profile ────────────────────────────────────────────────────────

export async function getExhibitorByUserId(
  userId: string
): Promise<ExhibitorModel | null> {
  // Exhibitor docs use user.uid as the document ID
  const snap = await getDoc(doc(db, 'exhibitors', userId));
  if (!snap.exists()) return null;
  const exhibitor = { id: snap.id, ...snap.data() } as ExhibitorModel;
  const productDetails = await getProductDetails(userId);
  if (productDetails) exhibitor.productDetails = productDetails;
  return exhibitor;
}

export async function getExhibitorById(id: string): Promise<ExhibitorModel | null> {
  const snap = await getDoc(doc(db, 'exhibitors', id));
  if (!snap.exists()) return null;
  const exhibitor = { id: snap.id, ...snap.data() } as ExhibitorModel;
  const productDetails = await getProductDetails(id);
  if (productDetails) exhibitor.productDetails = productDetails;
  return exhibitor;
}

// Single-argument form — data must include userId. Uses userId as the doc ID
// so that exhibitorId === user.uid everywhere (simplifies bookmark queries).
export async function createExhibitorProfile(
  data: Omit<ExhibitorModel, 'id' | 'createdAt' | 'updatedAt' | 'isProfileComplete'>
): Promise<string> {
  const now = serverTimestamp();
  await setDoc(doc(db, 'exhibitors', data.userId), {
    ...data,
    isProfileComplete: true,
    createdAt: now,
    updatedAt: now,
  });
  return data.userId;
}

export async function updateExhibitorProfile(
  exhibitorId: string,
  data: Partial<Omit<ExhibitorModel, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'exhibitors', exhibitorId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Product Details ─────────────────────────────────────────────────────────

async function getProductDetails(
  exhibitorId: string
): Promise<ProductDetailsModel | null> {
  // productDetails doc uses exhibitorId as its doc ID too
  const snap = await getDoc(doc(db, 'productDetails', exhibitorId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProductDetailsModel;
}

export async function saveProductDetails(
  exhibitorId: string,
  data: Omit<ProductDetailsModel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  await setDoc(
    doc(db, 'productDetails', exhibitorId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────

export function uploadLogo(
  exhibitorId: string,
  uri: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `logos/${exhibitorId}/logo.jpg`);
      const task: UploadTask = uploadBytesResumable(storageRef, blob);

      task.on(
        'state_changed',
        (snap) => {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          onProgress?.(pct);
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
