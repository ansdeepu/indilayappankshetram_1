// src/firebase/firestore/use-doc.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';

export function useDoc<T>(ref: DocumentReference<T, DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        let path = 'unknown';
        try {
          path = ref?.path || 'unknown';
        } catch (e) {}
        
        console.error(`Error in useDoc [${path}]:`, err?.message || String(err));
        setError(err?.message || String(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
