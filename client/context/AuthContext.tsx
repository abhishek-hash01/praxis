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

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear any additional user data from localStorage if needed
      localStorage.removeItem('praxis-user-preferences');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Store user login state in localStorage for additional persistence tracking
      if (user) {
        localStorage.setItem('praxis-auth-state', 'logged-in');
        localStorage.setItem('praxis-user-id', user.uid);
      } else {
        localStorage.removeItem('praxis-auth-state');
        localStorage.removeItem('praxis-user-id');
      }
    });

    return () => unsubscribe();
  }, []);
  
  const value: AuthCtx = {
    currentUser,
    user: currentUser,
    loggedIn: !!currentUser,
    loading,
    logout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}