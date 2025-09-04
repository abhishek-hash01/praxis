import { createContext, useContext, useMemo, useEffect, useState, PropsWithChildren } from "react";
import { mockUser } from "@shared/mocks";
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

type AuthCtx = {
  currentUser: User | null;
  user: User | null;
  loggedIn: boolean;
  loading: boolean;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);
  
  const value: AuthCtx = {
    currentUser,
    user: currentUser,
    loggedIn: !!currentUser,
    loading,
    logout,
  };

  return <Ctx.Provider value={value}>{!loading && children}</Ctx.Provider>
}
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}