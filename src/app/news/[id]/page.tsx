
'use client';

import { useMemo } from 'react';
import React from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import type { NewsArticle } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import Image from 'next/image';
import { getYoutubeThumbnail, getYouTubeEmbedUrl } from '@/lib/utils';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewsArticlePage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const { language } = useLanguage();
  const firestore = useFirestore();

  const articleRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'news', id);
  }, [firestore, id]);

  const { data: article, loading } = useDoc<NewsArticle>(articleRef);
  
  if (loading) {
    return (
        <>
            <SiteHeader />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
                     <Skeleton className="h-10 w-3/4 mb-4" />
                     <Skeleton className="h-6 w-1/2 mb-8" />
                     <Skeleton className="aspect-video w-full mb-8" />
                     <Skeleton className="h-5 w-full mb-3" />
                     <Skeleton className="h-5 w-full mb-3" />
                     <Skeleton className="h-5 w-2/3" />
                </div>
            </main>
            <SiteFooter />
        </>
    );
  }

  if (!article) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 md:py-16 text-center">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <p className="text-muted-foreground">The news article you are looking for does not exist.</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const title = language === 'en' ? article.titleEn : article.title;
  const summary = language === 'en' ? article.summaryEn : article.summary;
  const imageSrc = article.imageUrl || (article.youtubeUrl ? getYoutubeThumbnail(article.youtubeUrl) : null);
  const videoEmbedUrl = article.youtubeUrl ? getYouTubeEmbedUrl(article.youtubeUrl) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl">
            <Button asChild variant="outline" className="mb-8">
                <Link href="/news">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {language === 'en' ? 'Back to All News' : 'എല്ലാ വാർത്തകളിലേക്കും മടങ്ങുക'}
                </Link>
            </Button>
            <article>
                <header className="mb-8">
                     <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary leading-tight">
                        {title}
                    </h1>
                     <p className="text-md text-muted-foreground mt-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ml-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </header>

                {videoEmbedUrl ? (
                    <div className="mb-8 rounded-lg overflow-hidden aspect-video">
                        <iframe
                            width="100%"
                            height="100%"
                            src={videoEmbedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : imageSrc && (
                    <div className="relative aspect-video w-full mb-8 rounded-lg overflow-hidden bg-black/5">
                        <Image
                            src={imageSrc}
                            alt={title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 896px"
                        />
                    </div>
                )}

                <div className="prose prose-lg max-w-none text-foreground/80 text-lg leading-relaxed text-justify">
                   {summary.split('\\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
