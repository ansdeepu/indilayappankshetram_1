
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { ArrowRight, Pencil } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { NewsArticle } from '@/lib/types';
import { getYoutubeThumbnail } from '@/lib/utils';


export function NewsSection() {
  const { language } = useLanguage();
  const firestore = useFirestore();
  const { isAdmin } = useUser();

  const newsCollectionQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('date', 'desc'), limit(3));
  }, [firestore]);
  
  const { data: newsAndEvents, loading } = useCollection<NewsArticle>(newsCollectionQuery);

  return (
    <section id="news" className="scroll-mt-16 relative group">
       {isAdmin && (
        <Button asChild className="absolute top-0 right-0 z-10">
          <Link href="/admin/news">
            <Pencil className="mr-2 h-4 w-4" /> {language === 'en' ? 'Manage News' : 'വാർത്തകൾ നിയന്ത്രിക്കുക'}
          </Link>
        </Button>
      )}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
          {language === 'en' ? 'News & Events' : 'വാർത്തകളും വിശേഷങ്ങളും'}
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          {language === 'en' ? 'Stay updated with the latest happenings at the temple' : 'ക്ഷേത്രത്തിലെ ഏറ്റവും പുതിയ വിശേഷങ്ങൾ അറിയുക'}
        </p>
      </div>
      {loading && <div className="text-center">Loading news...</div>}
      {(!newsAndEvents || newsAndEvents.length === 0) && !loading && (
        <div className="text-center text-muted-foreground">No news articles found.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {newsAndEvents && newsAndEvents.map((article) => {
          const imageSrc = article.imageUrl || (article.youtubeUrl && getYoutubeThumbnail(article.youtubeUrl)) || `https://picsum.photos/seed/${article.id}/400/225`;
          return (
            <Card key={article.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 border-accent/30 hover:border-accent group">
              <CardHeader className="p-0">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={article.titleEn}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={'news event'}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                 <CardTitle className="font-headline text-xl leading-tight mb-2">
                  <div>{language === 'en' ? article.titleEn : article.title}</div>
                </CardTitle>
                 <p className="text-sm text-muted-foreground mb-3">{new Date(article.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ml-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 <p className="text-foreground/80 text-base line-clamp-3">{language === 'en' ? article.summaryEn : article.summary}</p>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="link" className="text-primary hover:text-accent p-0">
                    <Link href={`/news/${article.id}`}>
                      {language === 'en' ? 'Read More' : 'കൂടുതൽ വായിക്കുക'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
