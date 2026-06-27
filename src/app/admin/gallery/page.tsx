'use client';

import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { GalleryItem, GalleryPageContent } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { getYoutubeThumbnail } from '@/lib/utils';

const defaultPageContent: GalleryPageContent = {
  en: { title: 'Gallery', subtitle: 'A glimpse into the divine world of Indilayappan' },
  ml: { title: 'ഗാലറി', subtitle: 'ഇണ്ടിളയപ്പന്റെ ദിവ്യലോകത്തേക്ക് ഒരു എത്തിനോട്ടം' }
}

function GalleryItemEditor({ item, onUpdate, onRemove }: { item: GalleryItem, onUpdate: (id: string, field: keyof GalleryItem, value: any) => void, onRemove: (id: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // This effect validates the URL and sets the preview
    let validPreview = null;
    if (item.url && item.url.startsWith('http')) {
      if (item.type === 'image') {
        validPreview = item.url;
      } else if (item.type === 'video') {
        const thumb = getYoutubeThumbnail(item.url);
        // getYoutubeThumbnail returns a fallback, so check if it's the real one
        if (thumb && thumb.startsWith('https://img.youtube.com')) {
          validPreview = thumb;
        }
      }
    }
    setPreviewUrl(validPreview);
  }, [item.url, item.type]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg relative">
      <div className="md:col-span-1 space-y-2">
        <div className="rounded-md object-cover aspect-[4/3] bg-muted w-full flex items-center justify-center">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={item.descriptionEn || 'Preview'}
              width={300}
              height={225}
              className="rounded-md object-cover aspect-[4/3] w-full"
            />
          ) : (
            <span className="text-sm text-muted-foreground">No Preview</span>
          )}
        </div>
        <Label>URL ({item.type})</Label>
        <Input value={item.url} onChange={(e) => onUpdate(item.id, 'url', e.target.value)} placeholder={item.type === 'image' ? 'Image URL' : 'YouTube URL'} />
      </div>

      <div className="md:col-span-2 space-y-4">
        <div>
          <Label>Year</Label>
          <Input type="number" value={item.year || ''} onChange={(e) => onUpdate(item.id, 'year', parseInt(e.target.value, 10))} placeholder="e.g. 2024" />
        </div>
        <div>
          <Label>Description (English)</Label>
          <Textarea value={item.descriptionEn} onChange={(e) => onUpdate(item.id, 'descriptionEn', e.target.value)} rows={2} />
        </div>
        <div>
          <Label>Description (Malayalam)</Label>
          <Textarea value={item.descriptionMl} onChange={(e) => onUpdate(item.id, 'descriptionMl', e.target.value)} rows={2} />
        </div>
      </div>
      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => onRemove(item.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

export default function EditGalleryPage() {
  const router = useRouter();
  const { user, isAdmin, isManager, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const galleryQuery = useMemo(() => {
    if (!firestore || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'gallery'), orderBy('order'));
  }, [firestore, isAdmin, isManager]);
  const { data: galleryItems, loading: galleryLoading } = useCollection<GalleryItem>(galleryQuery);

  const pageContentRef = useMemo(() => (firestore && (isAdmin || isManager)) ? doc(firestore, 'content', 'galleryPage') : null, [firestore, isAdmin, isManager]);
  const { data: pageContent, loading: contentLoading } = useDoc<GalleryPageContent>(pageContentRef);

  const [localItems, setLocalItems] = useState<GalleryItem[]>([]);
  const [localPageContent, setLocalPageContent] = useState<GalleryPageContent>(defaultPageContent);

  useEffect(() => {
    if (galleryItems) {
      setLocalItems(galleryItems);
    }
  }, [galleryItems]);

  useEffect(() => {
    if (pageContent) {
      setLocalPageContent(pageContent);
    }
  }, [pageContent]);

  const handlePageContentChange = (lang: 'en' | 'ml', field: 'title' | 'subtitle', value: string) => {
    setLocalPageContent(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }));
  };

  const handleItemChange = (id: string, field: keyof GalleryItem, value: string | number) => {
    setLocalItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addNewItem = (type: 'image' | 'video') => {
    const newItem: GalleryItem = {
      id: uuidv4(),
      type,
      url: '',
      descriptionEn: '',
      descriptionMl: '',
      order: localItems.length,
      year: new Date().getFullYear(),
    };
    setLocalItems(prev => [...prev, newItem]);
  };

  const removeItem = async (id: string) => {
    if (firestore && galleryItems?.some(item => item.id === id)) {
      try {
        await deleteDoc(doc(firestore, 'gallery', id));
        toast({ title: "Item removed from database." });
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error removing item", description: error.message });
      }
    }
    setLocalItems(prev => prev.filter(item => item.id !== id).map((item, index) => ({ ...item, order: index })));
  };

  const handleSave = async () => {
    if (!firestore || !pageContentRef) return;
    try {
      await setDoc(pageContentRef, localPageContent, { merge: true });

      for (const item of localItems) {
        if (!item.url) {
          toast({ variant: 'destructive', title: 'Validation Error', description: 'URL cannot be empty for any gallery item.' });
          return;
        }
        if (!item.year) {
          toast({ variant: 'destructive', title: 'Validation Error', description: 'Year cannot be empty for any gallery item.' });
          return;
        }
        const itemRef = doc(firestore, 'gallery', item.id);
        await setDoc(itemRef, item, { merge: true });
      }

      toast({
        title: 'Gallery Updated',
        description: 'The gallery page has been successfully updated.',
      });
      router.push('/gallery');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving content',
        description: error.message,
      });
    }
  };

  const isLoading = galleryLoading || contentLoading || userLoading;

  if (userLoading) return null;
  if (!isAdmin && !isManager) return <div className="container py-20 text-center">Unauthorized Access</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Gallery</CardTitle>
          <CardDescription>Manage the page headings and the list of images and videos in your gallery.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="space-y-6 p-4 border rounded-lg mb-8">
                <h3 className="text-lg font-semibold">Page Headings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">English</h4>
                    <div>
                      <Label htmlFor="heading-en">Title</Label>
                      <Input id="heading-en" value={localPageContent.en.title} onChange={(e) => handlePageContentChange('en', 'title', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="subheading-en">Subtitle</Label>
                      <Input id="subheading-en" value={localPageContent.en.subtitle} onChange={(e) => handlePageContentChange('en', 'subtitle', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Malayalam (മലയാളം)</h4>
                    <div>
                      <Label htmlFor="heading-ml">Title (തലക്കെട്ട്)</Label>
                      <Input id="heading-ml" value={localPageContent.ml.title} onChange={(e) => handlePageContentChange('ml', 'title', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="subheading-ml">Subtitle (ഉപശീർഷകം)</Label>
                      <Input id="subheading-ml" value={localPageContent.ml.subtitle} onChange={(e) => handlePageContentChange('ml', 'subtitle', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-6">
                <h3 className="text-lg font-semibold">Gallery Items</h3>
                {localItems.map((item) => (
                  <GalleryItemEditor
                    key={item.id}
                    item={item}
                    onUpdate={handleItemChange}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              <div className="flex gap-4 mb-8">
                <Button variant="outline" onClick={() => addNewItem('image')}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Image
                </Button>
                <Button variant="outline" onClick={() => addNewItem('video')}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Video
                </Button>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.push('/gallery')}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
