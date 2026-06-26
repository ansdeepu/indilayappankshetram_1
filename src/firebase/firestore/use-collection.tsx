// src/firebase/firestore/use-collection.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './error-handler';

export function useCollection<T>(query: Query<T, DocumentData> | null) {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the query to prevent re-renders from creating new query objects
  const memoizedQuery = useMemo(() => query, [query]);

  useEffect(() => {
    if (!memoizedQuery) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Error in useCollection:", err?.message || String(err));
        setError(err?.message || String(err));
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'unknown-collection-path');
        } catch (e) {
          // Error is already logged and re-thrown by handleFirestoreError
        }
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, loading, error };
}
