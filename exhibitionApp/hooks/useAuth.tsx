import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserModel } from '@/lib/services/authService';
import { UserModel } from '@/lib/models/user.model';

interface AuthContextType {
  user: User | null;
  userModel: UserModel | null;
  loading: boolean;
  isExhibitor: boolean;
  isVisitor: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userModel: null,
  loading: true,
  isExhibitor: false,
  isVisitor: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userModel, setUserModel] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const model = await getUserModel(firebaseUser.uid);
          setUserModel(model);
        } catch {
          setUserModel(null);
        }
      } else {
        setUserModel(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userModel,
        loading,
        isExhibitor: userModel?.role === 'exhibitor',
        isVisitor: userModel?.role === 'visitor',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
