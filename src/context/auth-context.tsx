'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Profile } from '@/types';
import { localDb } from '@/lib/storage/local-db';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCashier: boolean;
  isConfigured: boolean;
  login: (email: string, pass: string) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isCashier: false,
  isConfigured: true,
  login: () => false,
  signOut: async () => {},
  refreshProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(() => {
    try {
      const activeUser = localDb.getSessionUser();
      setProfile(activeUser);
    } catch (err) {
      console.error('Session load error:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = (email: string, pass: string): boolean => {
    const result = localDb.login(email, pass);
    if (result) {
      setProfile(result.user);
      return true;
    }
    return false;
  };

  const signOut = async () => {
    localDb.logout();
    setProfile(null);
    router.push('/login');
  };

  const refreshProfile = () => {
    loadSession();
  };

  const isAdmin = profile?.role === 'admin' && profile?.is_active === true;
  const isCashier = profile?.role === 'cashier' && profile?.is_active === true;

  const user = profile
    ? { id: profile.id, email: profile.email || '' }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAdmin,
        isCashier,
        isConfigured: true,
        login,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
