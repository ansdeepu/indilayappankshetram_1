// src/firebase/firestore/use-collection.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';

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
        // Detailed error reporting for debugging permission issues
        let queryInfo = 'Unknown Query';
        try {
          // Attempt to extract collection/path information from the internal query object
          const internalQuery = (memoizedQuery as any)?._query;
          if (internalQuery && internalQuery.path) {
            queryInfo = internalQuery.path.segments.join('/');
          }
        } catch (e) {
          queryInfo = 'Could not determine path';
        }

        console.error(`Error in useCollection [${queryInfo}]:`, err?.message || String(err));
        setError(err?.message || String(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, loading, error };
}
