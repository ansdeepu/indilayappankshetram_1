
'use client';

import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { doc } from 'firebase/firestore';
import type { HistoryContent } from '@/lib/types';
import { historyContent as fallbackContent } from '@/lib/data';

export function HistorySection() {
  const { language } = useLanguage();
  const { isAdmin } = useUser();
  const firestore = useFirestore();

  const historyRef = firestore ? doc(firestore, 'content', 'history') : null;
  const { data: historyContent, loading } = useDoc<HistoryContent>(historyRef);

  const content = historyContent ? historyContent[language] : fallbackContent[language];
  const displayContent = historyContent || fallbackContent;


  return (
    <section id="history" className="scroll-mt-16 relative group">
      {isAdmin && (
        <Button asChild className="absolute top-0 right-0 z-10">
          <Link href="/admin/history">
            <Pencil className="mr-2 h-4 w-4" /> {language === 'en' ? 'Edit Section' : 'ഭാഗം തിരുത്തുക'}
          </Link>
        </Button>
      )}
      <div className="text-center mb-8 md:mb-12">
        {loading ? (
            <div className="animate-pulse">
                <div className="h-10 bg-muted rounded w-1/3 mx-auto"></div>
                <div className="h-6 bg-muted rounded w-1/2 mx-auto mt-4"></div>
            </div>
        ) : (
            <>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
                    {displayContent[language].title}
                </h2>
                <p className="text-lg text-muted-foreground mt-2">
                    {displayContent[language].subtitle}
                </p>
            </>
        )}
      </div>
      <div className="max-w-4xl mx-auto font-body text-base md:text-lg text-foreground/80 leading-relaxed space-y-6 text-justify">
        {loading ? (
             <div className="space-y-4">
                <div className="h-5 bg-muted rounded w-full"></div>
                <div className="h-5 bg-muted rounded w-full"></div>
                <div className="h-5 bg-muted rounded w-5/6"></div>
                <div className="h-5 bg-muted rounded w-full"></div>
             </div>
        ) : (
             displayContent[language].paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))
        )}
      </div>
    </section>
  );
}
