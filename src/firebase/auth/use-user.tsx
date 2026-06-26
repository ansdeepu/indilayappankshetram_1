'use client';

import { onIdTokenChanged, User, getIdTokenResult } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';

export interface UserState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

export function useUser(): UserState {
  const auth = useAuth();
  const [userState, setUserState] = useState<UserState>({
    user: null,
    loading: true,
    isAdmin: false,
    isManager: false,
  });

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, loading: false, isAdmin: false, isManager: false });
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user || !user.email) {
        setUserState({ user: null, loading: false, isAdmin: false, isManager: false });
        return;
      }
      
      const isAdmin = user.email === 'indilayappankshetram@gmail.com' || user.email === 'ss.deepu@gmail.com';
      const isManager = user.email === 'templemanager@gmail.com';

      setUserState({
        user,
        loading: false,
        isAdmin: isAdmin,
        isManager: isManager,
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return userState;
}
