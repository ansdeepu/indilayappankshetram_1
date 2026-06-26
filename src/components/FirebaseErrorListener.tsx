// src/components/FirebaseErrorListener.tsx
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

// This component is designed to run only in development.
// It listens for custom permission errors and throws them,
// which gets them picked up by the Next.js development overlay.
export function FirebaseErrorListener() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleError = (error: FirestorePermissionError) => {
      // Log the error safely to avoid circular structure issues in dev tools
      console.error("Firestore Permission Error:");
      console.error("Message:", error.message);
      console.error("Path:", error.path);
      console.error("Operation:", error.operation);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
