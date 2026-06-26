'use client';

import { useFirestore, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, setDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { HeroSlide, HeroContent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from '@/components/ui/textarea';

const defaultHeroContent: HeroContent = {
  titleEn: 'Welcome to Indilayappan Temple',
  titleMl: 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലേക്ക് സ്വാഗതം',
  descriptionEn: 'A sacred space for devotees to find peace and spiritual solace. Experience the divine presence and ancient traditions of Kerala.',
  descriptionMl: 'ഭക്തർക്ക് സമാധാനവും ആത്മീയ ആശ്വാസവും കണ്ടെത്താനുള്ള ഒരു പുണ്യസ്ഥലം. കേരളത്തിന്റെ ദിവ്യമായ സാന്നിധ്യവും പുരാതന പാരമ്പര്യങ്ങളും അനുഭവിക്കുക.',
};

export default function EditHeroPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [slidesData, setSlidesData] = useState<HeroSlide[]>([]);
  const [contentData, setContentData] = useState<HeroContent>(defaultHeroContent);

  const heroContentRef = useMemo(() => (firestore ? doc(firestore, 'heroContent', 'main') : null), [firestore]);
  const { data: heroContent, loading: heroContentLoading } = useDoc<HeroContent>(heroContentRef);

  const heroCollectionQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'heroSlides'), orderBy('order'));
  }, [firestore]);

  const { data: heroSlides, loading: heroSlidesLoading } = useCollection<HeroSlide>(heroCollectionQuery);
  
  useEffect(() => {
    if (heroSlides) {
      setSlidesData(heroSlides);
    }
  }, [heroSlides]);

  useEffect(() => {
    if (heroContent) {
      setContentData(heroContent);
    }
  }, [heroContent]);

  const handleSlideInputChange = (id: string, field: keyof HeroSlide, value: string) => {
    setSlidesData((prev) => {
      return prev.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide));
    });
  };
  
  const handleContentChange = (field: keyof HeroContent, value: string) => {
    setContentData((prev) => ({ ...prev, [field]: value }));
  };

  const addNewSlide = () => {
    const newSlide: HeroSlide = {
      id: uuidv4(),
      imageUrl: '',
      descriptionEn: '',
      descriptionMl: '',
      order: slidesData.length,
    };
    setSlidesData((prev) => [...prev, newSlide]);
  };

  const removeSlide = async (id: string) => {
    // Optimistically remove from local state and re-order
    setSlidesData((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));

    // If the slide exists in the database, delete it from Firestore
    if (firestore && heroSlides?.some((s) => s.id === id)) {
      try {
        await deleteDoc(doc(firestore, 'heroSlides', id));
        toast({ title: 'Slide removed from database.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error removing slide', description: error.message });
        // Optional: Add logic to revert local state if Firestore delete fails
      }
    }
  };

  const handleSave = async () => {
    if (!firestore || !contentData || !slidesData) return;
    try {
      if (heroContentRef) {
        await setDoc(heroContentRef, contentData, { merge: true });
      }
      
      for (const [index, slide] of slidesData.entries()) {
        if (!slide.imageUrl) {
            toast({ variant: 'destructive', title: 'Validation Error', description: `Image URL for slide ${index + 1} cannot be empty.` });
            return;
        }
        const slideRef = doc(firestore, 'heroSlides', slide.id);
        await setDoc(slideRef, { ...slide, order: index }, { merge: true });
      }

      const currentDbIds = heroSlides?.map(s => s.id) || [];
      const localIds = new Set(slidesData.map(s => s.id));
      const idsToDelete = currentDbIds.filter(id => !localIds.has(id));
      for(const id of idsToDelete) {
        await deleteDoc(doc(firestore, 'heroSlides', id));
      }

      toast({
        title: 'Success!',
        description: 'Hero section content has been updated.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving content',
        description: error.message,
      });
    }
  };

  const isLoading = heroSlidesLoading || heroContentLoading;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Hero Section</CardTitle>
          <CardDescription>Update the heading, description, and slides for the hero carousel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="space-y-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Main Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="heading-en">Heading (English)</Label>
                    <Input
                      id="heading-en"
                      value={contentData.titleEn}
                      onChange={(e) => handleContentChange('titleEn', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="heading-ml">Heading (Malayalam)</Label>
                    <Input
                      id="heading-ml"
                      value={contentData.titleMl}
                      onChange={(e) => handleContentChange('titleMl', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description-en">Description (English)</Label>
                    <Textarea
                      id="description-en"
                      value={contentData.descriptionEn}
                      onChange={(e) => handleContentChange('descriptionEn', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description-ml">Description (Malayalam)</Label>
                    <Textarea
                      id="description-ml"
                      value={contentData.descriptionMl}
                      onChange={(e) => handleContentChange('descriptionMl', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Slides</h3>
                {(slidesData || []).sort((a,b) => a.order - b.order).map((slide) => (
                  <div key={slide.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg relative">
                    <div className="md:col-span-1 space-y-2">
                      <div className="relative w-full aspect-[16/9] bg-muted rounded-md flex items-center justify-center">
                          {slide.imageUrl ? (
                            <Image
                                  src={slide.imageUrl}
                                  alt={slide.descriptionEn || 'Slide image'}
                                  fill
                                  className="object-contain"
                              />
                          ) : (
                              <div className="text-muted-foreground text-sm">No Image</div>
                          )}
                      </div>
                      <Label htmlFor={`imageUrl-${slide.id}`}>Image URL</Label>
                      <Input 
                        id={`imageUrl-${slide.id}`}
                        value={slide.imageUrl}
                        onChange={(e) => handleSlideInputChange(slide.id, 'imageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-grow"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <Label htmlFor={`en-${slide.id}`}>Description (English)</Label>
                        <Input
                          id={`en-${slide.id}`}
                          value={slide.descriptionEn}
                          onChange={(e) => handleSlideInputChange(slide.id, 'descriptionEn', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`ml-${slide.id}`}>Description (Malayalam)</Label>
                        <Input
                          id={`ml-${slide.id}`}
                          value={slide.descriptionMl}
                          onChange={(e) => handleSlideInputChange(slide.id, 'descriptionMl', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeSlide(slide.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addNewSlide} className="mb-8">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Slide
              </Button>

              <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline" onClick={() => router.push('/')}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
