import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser, UserRole } from '@/types';

export const AuthService = {
  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
      } satisfies AppUser);
      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  async signInWithGoogleToken(
    idToken: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(auth, credential);

      // Create user doc if first-time Google sign-in
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? user.email?.split('@')[0] ?? '',
          // Google users pick their role during first login
          role: 'exhibitor' as UserRole,
          createdAt: new Date().toISOString(),
        } satisfies AppUser);
      }

      return { user, error: null };
    } catch (e: any) {
      return { user: null, error: e.message };
    }
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  async getUserData(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  },
};
