import { createContext, useContext, useMemo, useEffect, useState, PropsWithChildren } from "react";
import { mockUser } from "@shared/mocks";
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore();

type UserProfile = {
  name: string;
  email: string;
  bio: string;
  skills: string[];
  wantsToLearn: string[];
  createdAt: string;
  profileComplete?: boolean;
};

type AuthCtx = {
  currentUser: User | null;
  user: User | null;
  userProfile: UserProfile | null;
  loggedIn: boolean;
  loading: boolean;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'praxis_user_profile',
  AUTH_STATE: 'praxis_auth_state',
} as const;

// Local storage utilities
const storage = {
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore and cache in localStorage
  const loadUserProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        storage.set(STORAGE_KEYS.USER_PROFILE, profile);
        return profile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Try to load from localStorage as fallback
      const cachedProfile = storage.get(STORAGE_KEYS.USER_PROFILE);
      if (cachedProfile) {
        setUserProfile(cachedProfile);
        return cachedProfile;
      }
    }
    return null;
  };

  // Refresh user profile (useful after profile updates)
  const refreshUserProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      storage.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    // Try to load cached user profile on mount
    const cachedProfile = storage.get(STORAGE_KEYS.USER_PROFILE);
    if (cachedProfile) {
      setUserProfile(cachedProfile);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is signed in
        storage.set(STORAGE_KEYS.AUTH_STATE, { 
          uid: user.uid, 
          email: user.email,
          lastLogin: new Date().toISOString()
        });
        
        // Load user profile
        await loadUserProfile(user);
      } else {
        // User is signed out
        setUserProfile(null);
        storage.clear();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);
  
  const value: AuthCtx = {
    currentUser,
    user: currentUser,
    userProfile,
    loggedIn: !!currentUser,
    loading,
    logout,
    refreshUserProfile,
  };

  return <Ctx.Provider value={value}>{!loading && children}</Ctx.Provider>
}
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}