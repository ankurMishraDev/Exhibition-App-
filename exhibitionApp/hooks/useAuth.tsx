import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { AuthService } from '@/services/authService';
import type { AppUser, UserRole } from '@/types';

interface AuthContextType {
  /** Raw Firebase user (null when signed out) */
  user: User | null;
  /** Full user record stored in Firestore */
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  isExhibitor: boolean;
  isVisitor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: (idToken: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const data = await AuthService.getUserData(firebaseUser.uid);
        setAppUser(data);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await AuthService.signInWithEmail(email, password);
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    const { error } = await AuthService.signUpWithEmail(email, password, displayName, role);
    return { error };
  };

  const signInWithGoogle = async (idToken: string) => {
    const { user: firebaseUser, error } = await AuthService.signInWithGoogleToken(idToken);
    if (firebaseUser) {
      const data = await AuthService.getUserData(firebaseUser.uid);
      setAppUser(data);
    }
    return { error };
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setAppUser(null);
  };

  const role = appUser?.role ?? null;

  const value: AuthContextType = {
    user,
    appUser,
    role,
    loading,
    isExhibitor: role === 'exhibitor',
    isVisitor: role === 'visitor',
    signIn,
    signUp,
    signInWithGoogle,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}