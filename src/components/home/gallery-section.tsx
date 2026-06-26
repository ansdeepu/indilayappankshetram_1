'use client';

import * as React from 'react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, PlayCircle, X } from 'lucide-react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { GalleryItem, GalleryPageContent } from '@/lib/types';
import { getYoutubeThumbnail, getYouTubeEmbedUrl } from '@/lib/utils';
import { Pagination } from '../ui/pagination';

const defaultPageContent: GalleryPageContent = {
  en: { title: 'Gallery', subtitle: 'A glimpse into the divine world of Indilayappan' },
  ml: { title: 'ഗാലറി', subtitle: 'ഇണ്ടിളയപ്പന്റെ ദിവ്യലോകത്തേക്ക് ഒരു എത്തിനോട്ടം' }
}

const YEARS_PER_PAGE = 3;

const GalleryMediaGrid = ({ items, onSelect }: { items: GalleryItem[], onSelect: (item: GalleryItem) => void }) => {
    const { language } = useLanguage();

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-4">
            {items.map((item) => {
                const description = language === 'en' ? item.descriptionEn : item.descriptionMl;
                return (
                    <div key={item.id} className="group/item relative">
                         <div
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent group-hover/item:border-accent transition-all duration-300"
                            onClick={() => onSelect(item)}
                        >
                            <Image
                                src={item.type === 'image' ? item.url : getYoutubeThumbnail(item.url)}
                                alt={description || 'Gallery item'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 14vw, 12vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                {item.type === 'video' && (
                                    <PlayCircle className="h-10 w-10 text-white/90 drop-shadow-lg" />
                                )}
                            </div>
                             {description && (
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                                    <p className="text-xs text-white truncate">{description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export function GallerySection() {
  const { language } = useLanguage();
  const { isAdmin } = useUser();
  const firestore = useFirestore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(0);


  const galleryQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gallery'), orderBy('order', 'asc'));
  }, [firestore]);
  const { data: galleryItems, loading: galleryLoading } = useCollection<GalleryItem>(galleryQuery);

  const pageContentRef = useMemo(() => firestore ? doc(firestore, 'content', 'galleryPage') : null, [firestore]);
  const { data: pageContent, loading: contentLoading } = useDoc<GalleryPageContent>(pageContentRef);

  const content = pageContent ? pageContent[language] : defaultPageContent[language];
  const loading = galleryLoading || contentLoading;

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };
  
  const videoUrl = selectedItem?.type === 'video' ? getYouTubeEmbedUrl(selectedItem.url) : null;
  const itemDescription = selectedItem ? (language === 'en' ? selectedItem.descriptionEn : selectedItem.descriptionMl) : '';

  const groupedByYear = useMemo(() => {
    if (!galleryItems) return {};

    const sortedItems = [...galleryItems].sort((a,b) => (b.year || 0) - (a.year || 0) || b.order - a.order);
    
    return sortedItems.reduce((acc, item) => {
        const year = item.year || new Date().getFullYear();
        if (!acc[year]) {
            acc[year] = { photos: [], videos: [] };
        }
        if (item.type === 'image') {
            acc[year].photos.push(item);
        } else {
            acc[year].videos.push(item);
        }
        return acc;
    }, {} as Record<number, { photos: GalleryItem[], videos: GalleryItem[] }>);

  }, [galleryItems]);

  const sortedYears = useMemo(() => Object.keys(groupedByYear).map(Number).sort((a, b) => b - a), [groupedByYear]);
  
  const pageCount = Math.ceil(sortedYears.length / YEARS_PER_PAGE);
  const displayedYears = sortedYears.slice(
      currentPage * YEARS_PER_PAGE,
      (currentPage + 1) * YEARS_PER_PAGE
  );

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="gallery" className="scroll-mt-16 relative group">
       {isAdmin && (
        <Button asChild className="absolute top-0 right-0 z-10">
          <Link href="/admin/gallery">
            <Pencil className="mr-2 h-4 w-4" /> {language === 'en' ? 'Edit Gallery' : 'ഗാലറി തിരുത്തുക'}
          </Link>
        </Button>
      )}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">
          {content.title}
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          {content.subtitle}
        </p>
      </div>

      {loading && <div className="text-center">Loading gallery...</div>}
      
      {!loading && sortedYears.length > 0 && (
          <div className="space-y-16">
              {displayedYears.map(year => (
                  <div key={year}>
                      <h3 className="text-3xl font-bold font-headline mb-8 border-b-2 border-primary pb-3">{year}</h3>
                      
                      {groupedByYear[year].photos.length > 0 && (
                          <div className="mb-12">
                              <h4 className="text-2xl font-semibold font-headline mb-6 text-primary/90">{language === 'en' ? 'Photos' : 'ചിത്രങ്ങൾ'}</h4>
                              <GalleryMediaGrid items={groupedByYear[year].photos} onSelect={handleItemClick} />
                          </div>
                      )}

                      {groupedByYear[year].videos.length > 0 && (
                          <div>
                              <h4 className="text-2xl font-semibold font-headline mb-6 text-primary/90">{language === 'en' ? 'Videos' : 'വീഡിയോകൾ'}</h4>
                              <GalleryMediaGrid items={groupedByYear[year].videos} onSelect={handleItemClick} />
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}

      {!loading && sortedYears.length === 0 && (
        <div className="text-center text-muted-foreground py-16">{language === 'en' ? 'No items in the gallery yet.' : 'ഗാലറിയിൽ ഇതുവരെ ഇനങ്ങളൊന്നുമില്ല.'}</div>
      )}

      {pageCount > 1 && (
        <Pagination pageCount={pageCount} onPageChange={handlePageClick} />
      )}


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-2">
          <DialogClose className="absolute right-4 top-4 rounded-full p-1 bg-background/50 text-foreground/80 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
          </DialogClose>
           <DialogHeader className="sr-only">
            <DialogTitle>{language === 'en' ? 'Gallery Viewer' : 'ഗാലറി'}</DialogTitle>
            <DialogDescription>
              {itemDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {selectedItem?.type === 'image' && (
               <div className="relative aspect-video w-full bg-black/90 rounded-md">
                <Image
                  src={selectedItem.url}
                  alt={itemDescription}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            )}

            {videoUrl && (
              <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
                  <iframe
                      width="100%"
                      height="100%"
                      src={videoUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  ></iframe>
              </div>
            )}
            
            {selectedItem?.type === 'video' && !videoUrl && (
               <div className="aspect-video w-full bg-black flex items-center justify-center text-white rounded-md">
                  Invalid YouTube URL.
               </div>
            )}

            {itemDescription && (
              <p className="text-center text-sm text-muted-foreground p-2">
                {itemDescription}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
