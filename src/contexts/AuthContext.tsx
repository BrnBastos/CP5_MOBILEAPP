import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebase } from '@/services/firebase';
import { unregisterDevice } from '@/services/notifications';
import { errorMessage } from '@/utils/errors';
import { userSchema, type ChatUser } from '@/types/models';
type AuthState = {
  user: User | null;
  profile: ChatUser | null;
  loading: boolean;
  error: string;
  logout: () => Promise<void>;
};
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<ChatUser | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    try {
      const { auth, db } = firebase();
      const unsubscribe = onAuthStateChanged(
        auth,
        (next) => {
          profileUnsubscribe?.();
          setUser(next);
          setProfile(null);
          if (!next) {
            setLoading(false);
            return;
          }
          setLoading(true);
          profileUnsubscribe = onSnapshot(
            doc(db, 'users', next.uid),
            (snapshot) => {
              const parsed = userSchema.safeParse(snapshot.data());
              setProfile(parsed.success ? parsed.data : null);
              setLoading(false);
            },
            (failure) => {
              setError(errorMessage(failure));
              setLoading(false);
            },
          );
        },
        (failure) => {
          setError(errorMessage(failure));
          setLoading(false);
        },
      );
      return () => {
        unsubscribe();
        profileUnsubscribe?.();
      };
    } catch (failure) {
      setError(errorMessage(failure));
      setLoading(false);
    }
  }, []);
  const logout = useCallback(async () => {
    try {
      await unregisterDevice();
    } finally {
      await signOut(firebase().auth);
      setProfile(null);
      setError('');
    }
  }, []);
  const value = useMemo(
    () => ({ user, profile, loading, error, logout }),
    [user, profile, loading, error, logout],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider ausente.');
  return value;
}
