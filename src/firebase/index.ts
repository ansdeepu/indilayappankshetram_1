
import { FirebaseApp, initializeApp, getApp, getApps } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This will hold the initialized instances.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This function ensures that we initialize the app only once.
export function initializeFirebase() {
  if (getApps().length > 0) {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp, (firebaseConfig as any).firestoreDatabaseId);
  } else {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    // Use initializeFirestore only on the first initialization
    firestore = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
    }, (firebaseConfig as any).firestoreDatabaseId);
  }

  return { firebaseApp, auth, firestore };
}

export { FirebaseProvider } from './provider';
export { FirebaseClientProvider } from './client-provider';

export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
export {
  useFirebaseApp,
  useAuth,
  useFirestore,
  useFirebase,
} from './provider';
