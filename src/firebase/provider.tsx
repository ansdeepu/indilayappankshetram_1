'use client';
import {
  createContext,
  useContext,
  ReactNode,
  ComponentType,
  Context,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

export const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}) {
  return (
    <FirebaseContext.Provider
      value={{
        firebaseApp,
        auth,
        firestore,
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
    </FirebaseContext.Provider>
  );
}

function createFirebaseHook<T>(
  context: Context<FirebaseContextValue | null>,
  service: keyof FirebaseContextValue
) {
  return () => {
    const firebaseContext = useContext(context);
    if (firebaseContext === null) {
      throw new Error('useFirebase must be used within a FirebaseProvider.');
    }
    return firebaseContext[service] as T;
  };
}

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = createFirebaseHook<FirebaseApp | null>(
  FirebaseContext,
  'firebaseApp'
);
export const useAuth = createFirebaseHook<Auth | null>(
  FirebaseContext,
  'auth'
);
export const useFirestore = createFirebaseHook<Firestore | null>(
  FirebaseContext,
  'firestore'
);
