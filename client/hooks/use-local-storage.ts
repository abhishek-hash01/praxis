import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with React state synchronization
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage and state
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove from localStorage and reset to initial value
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

/**
 * Hook for managing authentication-related localStorage
 */
export function useAuthStorage() {
  const [authState, setAuthState, removeAuthState] = useLocalStorage('praxis_auth_state', null);
  const [userProfile, setUserProfile, removeUserProfile] = useLocalStorage('praxis_user_profile', null);
  const [rememberMe, setRememberMe, removeRememberMe] = useLocalStorage('praxis_remember_me', false);

  const clearAuthStorage = () => {
    removeAuthState();
    removeUserProfile();
    removeRememberMe();
  };

  return {
    authState,
    setAuthState,
    userProfile,
    setUserProfile,
    rememberMe,
    setRememberMe,
    clearAuthStorage,
  };
}
