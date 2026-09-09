import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, ADMIN_EMAILS } from './config';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  }), []);

  const isAdmin =
    !!user &&
    (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes((user.email || '').toLowerCase()));

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const em = (cred.user.email || '').toLowerCase();
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(em)) {
      await signOut(auth);
      throw new Error('This account is not authorized as admin.');
    }
  }

  return (
    <Ctx.Provider value={{ user, loading, isAdmin, login, logout: () => signOut(auth) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
