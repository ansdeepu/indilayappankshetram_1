
import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This file is for server-side Firebase access (e.g., in Genkit flows)

let app: App;
let firestore: Firestore;

export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp();
    firestore = getFirestore(app);
  } else {
    app = getApp();
    firestore = getFirestore(app);
  }

  return { app, firestore };
}
