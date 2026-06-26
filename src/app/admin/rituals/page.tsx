'use client';

import { useFirestore, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Ritual, RitualsPageContent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';

const defaultPageContent: RitualsPageContent = {
  en: { title: 'Daily Rituals', subtitle: 'Schedule of Daily Poojas' },
  ml: { title: 'ആചാരങ്ങൾ', subtitle: 'ദൈനംദിന പൂജകളുടെ സമയക്രമം' },
}

export default function EditRitualsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ritualsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dailyRituals'), orderBy('time'));
  }, [firestore]);

  const { data: rituals, loading: ritualsLoading } = useCollection<Ritual>(ritualsQuery);

  const pageContentRef = useMemo(() => firestore ? doc(firestore, 'content', 'ritualsPage') : null, [firestore]);
  const { data: pageContent, loading: pageContentLoading } = useDoc<RitualsPageContent>(pageContentRef);

  const [localRituals, setLocalRituals] = useState<Ritual[]>([]);
  const [localPageContent, setLocalPageContent] = useState<RitualsPageContent>(defaultPageContent);

  useEffect(() => {
    if (rituals) {
      setLocalRituals(rituals);
    }
  }, [rituals]);

  useEffect(() => {
    if (pageContent) {
      setLocalPageContent(pageContent);
    }
  }, [pageContent]);
  
  const handleInputChange = (id: string, field: keyof Ritual, value: string) => {
    setLocalRituals(prev => 
      prev.map(r => r.id === id ? { ...r, [field]: value } : r)
    );
  };

  const handlePageContentChange = (lang: 'en' | 'ml', field: 'title' | 'subtitle', value: string) => {
    setLocalPageContent(prev => ({
        ...prev,
        [lang]: {
            ...prev[lang],
            [field]: value
        }
    }))
  };

  const addNewRitual = () => {
    const newRitual: Ritual = {
      id: uuidv4(),
      time: '',
      name: '',
      nameEn: '',
    };
    setLocalRituals(prev => [...prev, newRitual]);
  };

  const removeRitual = async (id: string) => {
     if (firestore && rituals?.some(r => r.id === id)) {
       try {
        await deleteDoc(doc(firestore, 'dailyRituals', id));
         toast({ title: "Ritual removed from database." });
       } catch (error: any) {
         toast({ variant: 'destructive', title: "Error removing ritual", description: error.message });
       }
    }
    setLocalRituals(prev => prev.filter(r => r.id !== id));
  }

  const handleSave = async () => {
    if (!firestore || !pageContentRef) return;
    
    for (const ritual of localRituals) {
      if (!ritual.time || !ritual.nameEn || !ritual.name) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `All rituals must have a time, an English name, and a Malayalam name.`,
        });
        return;
      }
    }
    
    try {
      await setDoc(pageContentRef, localPageContent, { merge: true });

      for (const ritual of localRituals) {
        const ritualRef = doc(firestore, 'dailyRituals', ritual.id);
        await setDoc(ritualRef, ritual, { merge: true });
      }

      const currentDbIds = rituals?.map(r => r.id) || [];
      const localIds = new Set(localRituals.map(r => r.id));
      const idsToDelete = currentDbIds.filter(id => !localIds.has(id));
      for (const id of idsToDelete) {
        await deleteDoc(doc(firestore, 'dailyRituals', id));
      }

      toast({
        title: 'Success!',
        description: 'Daily rituals page has been updated.',
      });
      router.push('/rituals');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving content',
        description: error.message,
      });
    }
  };
  
  const isLoading = ritualsLoading || pageContentLoading;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Daily Rituals Page</CardTitle>
          <CardDescription>Update the headings and schedule of daily poojas and rituals.</CardDescription>
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
              
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold">Rituals Schedule</h3>
                <div className="grid grid-cols-12 gap-4 font-semibold text-muted-foreground px-2">
                    <div className="col-span-4">Pooja (English)</div>
                    <div className="col-span-4">Pooja (Malayalam)</div>
                    <div className="col-span-3">Time</div>
                    <div className="col-span-1"></div>
                </div>
                {localRituals.map((ritual) => (
                  <div key={ritual.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input 
                        value={ritual.nameEn}
                        onChange={(e) => handleInputChange(ritual.id, 'nameEn', e.target.value)}
                        placeholder="e.g., Palliyunarthal"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input 
                        value={ritual.name}
                        onChange={(e) => handleInputChange(ritual.id, 'name', e.target.value)}
                        placeholder="ഉദാ., പള്ളിയുണർത്തൽ"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        value={ritual.time}
                        onChange={(e) => handleInputChange(ritual.id, 'time', e.target.value)}
                        placeholder="eg. 5:00 AM"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeRitual(ritual.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addNewRitual} className="mb-8">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Ritual
              </Button>

              <div className="flex justify-end gap-4 mt-4">
                <Button variant="outline" onClick={() => router.push('/rituals')}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
