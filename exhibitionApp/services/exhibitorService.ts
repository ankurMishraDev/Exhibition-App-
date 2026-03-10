import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import type { ExhibitorProfile, ProductDetails } from '@/types';

export const ExhibitorService = {
  async getProfile(userId: string): Promise<ExhibitorProfile | null> {
    const q = query(collection(db, 'exhibitors'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ExhibitorProfile;
  },

  async createOrUpdateProfile(
    userId: string,
    data: Omit<ExhibitorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ id: string; error: string | null }> {
    try {
      const q = query(collection(db, 'exhibitors'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const now = new Date().toISOString();

      if (snap.empty) {
        const ref = doc(collection(db, 'exhibitors'));
        await setDoc(ref, { ...data, id: ref.id, userId, createdAt: now, updatedAt: now });
        return { id: ref.id, error: null };
      } else {
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, { ...data, updatedAt: now });
        return { id: snap.docs[0].id, error: null };
      }
    } catch (e: any) {
      return { id: '', error: e.message };
    }
  },

  async uploadCompanyLogo(userId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const logoRef = ref(storage, `company-logos/${userId}`);
    await uploadBytes(logoRef, blob);
    return getDownloadURL(logoRef);
  },

  async saveProductDetails(
    exhibitorId: string,
    data: Omit<ProductDetails, 'id' | 'exhibitorId'>
  ): Promise<{ error: string | null }> {
    try {
      const q = query(collection(db, 'productDetails'), where('exhibitorId', '==', exhibitorId));
      const snap = await getDocs(q);

      if (snap.empty) {
        const docRef = doc(collection(db, 'productDetails'));
        await setDoc(docRef, { ...data, id: docRef.id, exhibitorId });
      } else {
        await updateDoc(snap.docs[0].ref, data);
      }
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  },

  async getProductDetails(exhibitorId: string): Promise<ProductDetails | null> {
    const q = query(collection(db, 'productDetails'), where('exhibitorId', '==', exhibitorId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ProductDetails;
  },
};
