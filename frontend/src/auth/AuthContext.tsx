import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { setOnSessionExpired } from '../api/client';
import type { Session } from '../api/types';

const STORAGE_KEY = 'fuel-orders-session';

interface AuthContextValue {
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
function readSavedSession(): Session | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return null;
    }
    return JSON.parse(saved) as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSavedSession);

  function signIn(newSession: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }

  function signOut(): void {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  // When the backend says the token expired, close the session
  useEffect(() => {
    setOnSessionExpired(signOut);
  }, []);

  return (
    <AuthContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}

// For the pages that only exist with a logged-in user.
export function useSession(): Session {
  const { session } = useAuth();
  if (session === null) {
    throw new Error('This page needs a logged-in user');
  }
  return session;
}
