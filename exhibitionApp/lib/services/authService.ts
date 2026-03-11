import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserModel, UserRole } from '@/lib/models/user.model';

// ─── Email / Password ────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user);
  await _createUserDoc(user.uid, email, displayName, role);
  return user;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// ─── Google OAuth (credential from expo-auth-session) ────────────────────────

export async function loginWithGoogleCredential(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const { user } = await signInWithCredential(auth, credential);

  const existing = await getDoc(doc(db, 'users', user.uid));
  if (!existing.exists()) {
    await _createUserDoc(
      user.uid,
      user.email ?? '',
      user.displayName ?? '',
      'exhibitor'
    );
  }
  return user;
}

// ─── Apple OAuth ─────────────────────────────────────────────────────────────

export async function loginWithAppleCredential(
  idToken: string,
  nonce: string
): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce: nonce });
  const { user } = await signInWithCredential(auth, credential);

  const existing = await getDoc(doc(db, 'users', user.uid));
  if (!existing.exists()) {
    await _createUserDoc(
      user.uid,
      user.email ?? '',
      user.displayName ?? '',
      'exhibitor'
    );
  }
  return user;
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function _createUserDoc(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole
): Promise<void> {
  const userDoc: Omit<UserModel, 'updatedAt'> & { createdAt: unknown; updatedAt: unknown } = {
    uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp() as unknown as string,
    updatedAt: serverTimestamp() as unknown as string,
  };
  await setDoc(doc(db, 'users', uid), userDoc);
}

export async function getUserModel(uid: string): Promise<UserModel | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserModel) : null;
}
