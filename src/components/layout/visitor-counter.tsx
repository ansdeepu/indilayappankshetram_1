'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const counterRef = doc(firestore, 'site-stats', 'visitor_count');

    const updateCounter = async () => {
      try {
        // To prevent multiple increments on rapid reloads, we check a session flag.
        if (sessionStorage.getItem('visitorCounted') !== 'true') {
          sessionStorage.setItem('visitorCounted', 'true');
          
          await setDoc(counterRef, { 
            count: increment(1),
            updatedAt: serverTimestamp(),
           }, { merge: true });
        }
        
        const docSnap = await getDoc(counterRef);

        if (docSnap.exists()) {
          setCount(docSnap.data().count);
        } else {
           // This case handles the very first visitor.
           // After the increment, the doc should exist. We re-fetch.
           const initialSnap = await getDoc(counterRef);
           if(initialSnap.exists()){
             setCount(initialSnap.data().count)
           } else {
            // if it still doesn't exist, maybe it's not created yet.
            // Let's create it with count 1
            await setDoc(counterRef, { count: 1, updatedAt: serverTimestamp() });
            setCount(1);
           }
        }
      } catch (error: any) {
        console.error("Error updating visitor count: ", error?.message || String(error));
      }
    };

    updateCounter();

  }, [firestore]);

  if (count === null) {
    return <p className="text-primary-foreground/80 text-sm">Loading visitor count...</p>;
  }

  return (
    <p className="text-primary-foreground/80 text-sm">
      Website Visits: {count}
    </p>
  );
}
