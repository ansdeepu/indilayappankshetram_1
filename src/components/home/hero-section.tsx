
'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import * as React from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { HeroSlide, HeroContent } from '@/lib/types';
import { useMemo } from 'react';
import { TraditionalDivider } from '../ui/traditional-divider';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '../ui/skeleton';

const defaultHeroContent: HeroContent = {
  titleEn: 'Welcome to Indilayappan Temple',
  titleMl: 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലേക്ക് സ്വാഗതം',
  descriptionEn: 'A sacred space for devotees to find peace and spiritual solace. Experience the divine presence and ancient traditions of Kerala.',
  descriptionMl: 'ഭക്തർക്ക് സമാധാനവും ആത്മീയ ആശ്വാസവും കണ്ടെത്താനുള്ള ഒരു പുണ്യസ്ഥലം. കേരളത്തിന്റെ ദിവ്യമായ സാന്നിധ്യവും പുരാതന പാരമ്പര്യങ്ങളും അനുഭവിക്കുക.',
};

const defaultSlides = PlaceHolderImages.filter((img) => img.id.startsWith('hero')).map((img, index) => ({
  id: img.id,
  imageUrl: img.imageUrl,
  descriptionEn: img.description,
  descriptionMl: "",
  order: index
}));


export function HeroSection() {
  const { language } = useLanguage();
  const { isAdmin, loading: userLoading } = useUser();
  const firestore = useFirestore();
  
  const heroContentRef = useMemo(() => firestore ? doc(firestore, 'heroContent', 'main') : null, [firestore]);
  const { data: heroContent, loading: heroContentLoading } = useDoc<HeroContent>(heroContentRef);
  
  const heroCollectionQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'heroSlides'), orderBy('order'));
  }, [firestore]);
  
  const { data: heroSlides, loading: slidesLoading } = useCollection<HeroSlide>(heroCollectionQuery);
  
  const isLoading = slidesLoading || heroContentLoading || userLoading;

  const displayContent: HeroContent = {
    ...defaultHeroContent,
    ...(heroContent ?? {}),
  };
  
  const title = language === 'ml' && displayContent.titleMl ? displayContent.titleMl : displayContent.titleEn;
  const description = language === 'ml' && displayContent.descriptionMl ? displayContent.descriptionMl : displayContent.descriptionEn;

  const slides = useMemo(() => {
    const slideSource = (heroSlides && heroSlides.length > 0) ? heroSlides : defaultSlides;
    
    return slideSource.map(slide => {
      const slideDescription = language === 'ml' && slide.descriptionMl ? slide.descriptionMl : slide.descriptionEn;
      return {
        id: slide.id,
        imageUrl: slide.imageUrl,
        description: slideDescription,
      };
    }).filter(Boolean) as { id: string, imageUrl: string, description: string }[];
    
  }, [heroSlides, language]);
  
  const autoplayRef = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <section className="w-full py-12 md:py-20 lg:py-24 bg-background relative group">
       {isAdmin && (
        <Button asChild className="absolute top-4 right-4 z-10">
          <Link href="/admin/hero">
            <Pencil className="mr-2 h-4 w-4" /> {language === 'en' ? 'Edit Hero' : 'ഹീറോ തിരുത്തുക'}
          </Link>
        </Button>
      )}
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="flex flex-col items-start text-center md:text-left">
                {isLoading ? (
                  <div className="w-full space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-6 w-full mt-4" />
                    <Skeleton className="h-6 w-5/6" />
                    <TraditionalDivider className="my-6" />
                    <Skeleton className="h-12 w-48" />
                  </div>
                ) : (
                  <>
                    <h1 className={cn(
                        "font-headline font-bold text-primary leading-tight",
                        language === 'en' 
                            ? "text-5xl md:text-5xl lg:text-6xl" 
                            : "text-4xl md:text-4xl lg:text-5xl"
                    )}>
                        {title}
                    </h1>
                    <p className="mt-4 text-lg text-foreground/80">
                        {description}
                    </p>
                     <TraditionalDivider className="my-6" />
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/offerings">
                            {language === 'en' ? 'Make an Offering' : 'വഴിപാട് സമർപ്പിക്കുക'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                  </>
                )}
            </div>
            <div className="w-full max-w-lg mx-auto md:max-w-none">
              {isLoading ? (
                 <Skeleton className="w-full aspect-[4/3] rounded-lg shadow-2xl border-4 border-card" />
              ) : (
                <Carousel
                    className="w-full rounded-lg overflow-hidden shadow-2xl border-4 border-card"
                    opts={{ loop: true }}
                    plugins={[autoplayRef.current]}
                    >
                    <CarouselContent>
                        {slides.map((slide, index) => (
                        <CarouselItem key={slide.id}>
                            <div className="relative aspect-[4/3] w-full bg-muted">
                            <Image
                                src={slide.imageUrl}
                                alt={slide.description}
                                fill
                                className="object-contain"
                                priority={index === 0}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                            />
                             <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-sm text-white/90 shadow-md text-center">{slide.description}</p>
                             </div>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
              )}
            </div>
        </div>
    </section>
  );
}
