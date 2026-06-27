
'use client';

import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Offering, VazhipaduPageContent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const defaultPageContent: VazhipaduPageContent = {
  en: { title: 'Offerings Rate List', subtitle: 'List of available poojas and their rates' },
  ml: { title: 'വഴിപാടുകൾ', subtitle: 'ലഭ്യമായ പൂജകളുടെയും അവയുടെ നിരക്കുകളുടെയും പട്ടിക' },
}

export default function EditOfferingsPage() {
  const router = useRouter();
  const { user, isAdmin, isManager, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Fetch without ordering by slNo to ensure all documents are retrieved
  const offeringsQuery = useMemo(() => {
    if (!firestore || (!isAdmin && !isManager)) return null;
    return query(collection(firestore, 'offerings'));
  }, [firestore, isAdmin, isManager]);
  const { data: offerings, loading: offeringsLoading } = useCollection<Offering>(offeringsQuery);

  const pageContentRef = useMemo(() => (firestore && (isAdmin || isManager)) ? doc(firestore, 'content', 'vazhipaduPage') : null, [firestore, isAdmin, isManager]);
  const { data: pageContent, loading: pageContentLoading } = useDoc<VazhipaduPageContent>(pageContentRef);

  const [localOfferings, setLocalOfferings] = useState<Offering[]>([]);
  const [localPageContent, setLocalPageContent] = useState<VazhipaduPageContent>(defaultPageContent);

  useEffect(() => {
    if (offerings) {
      // 1. Ensure every offering has a serial number for robust editing.
      // 2. Sort on the client side.
      const sortedOfferings = offerings
        .map((o, index) => ({
          ...o,
          // Assign a fallback slNo if it doesn't exist.
          // Using a large number for fallbacks to push them to the end initially.
          slNo: o.slNo ?? offerings.length + index + 1,
        }))
        .sort((a, b) => (a.slNo || 0) - (b.slNo || 0));
      
      setLocalOfferings(sortedOfferings);
    }
  }, [offerings]);

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
  
  const handleInputChange = (id: string, field: keyof Offering, value: string | number) => {
    setLocalOfferings(prev => 
      prev.map(o => o.id === id ? { ...o, [field]: value } : o)
    );
  };

  const addNewOffering = () => {
    const newOffering: Offering = {
      id: uuidv4(),
      name: '',
      nameEn: '',
      price: 0,
      slNo: (localOfferings.length > 0 ? Math.max(...localOfferings.map(o => o.slNo || 0)) : 0) + 1,
    };
    setLocalOfferings(prev => [...prev, newOffering]);
  };

  const removeOffering = async (id: string) => {
    if (firestore && offerings?.some(o => o.id === id)) {
       try {
        await deleteDoc(doc(firestore, 'offerings', id));
         toast({ title: "Offering removed from database." });
       } catch (error: any) {
         toast({ variant: 'destructive', title: "Error removing offering", description: error.message });
       }
    }
    setLocalOfferings(prev => prev.filter(o => o.id !== id));
  };

  const handleSave = async () => {
    if (!firestore || !pageContentRef) return;
    try {
      // Save page content
      await setDoc(pageContentRef, localPageContent, { merge: true });

      // Save offerings
      for (const offering of localOfferings) {
        if (!offering.nameEn || !offering.name) {
            toast({ variant: 'destructive', title: "Validation Error", description: `Offering name cannot be empty.` });
            return;
        }
        if (offering.slNo === undefined || offering.slNo === null) {
            toast({ variant: 'destructive', title: "Validation Error", description: `Serial number for "${offering.nameEn}" cannot be empty.` });
            return;
        }
        const offeringRef = doc(firestore, 'offerings', offering.id);
        await setDoc(offeringRef, offering, { merge: true });
      }
      toast({
        title: 'Success!',
        description: 'Offerings page has been updated.',
      });
      router.push('/vazhipadu');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving content',
        description: error.message,
      });
    }
  };

  const isLoading = offeringsLoading || pageContentLoading || userLoading;

  if (userLoading) return null;
  if (!isAdmin && !isManager) return <div className="container py-20 text-center">Unauthorized Access</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Offerings (Vazhipadu) Page</CardTitle>
          <CardDescription>Manage the page headings and the list of available offerings. Use Sl. No. to control the order.</CardDescription>
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
                <h3 className="text-lg font-semibold">Offerings List</h3>
                <div className="grid grid-cols-12 gap-4 font-semibold text-muted-foreground px-2">
                    <div className="col-span-1">Sl. No.</div>
                    <div className="col-span-4">Name (English)</div>
                    <div className="col-span-4">Name (Malayalam)</div>
                    <div className="col-span-2">Price (INR)</div>
                    <div className="col-span-1"></div>
                </div>
                {localOfferings.map((offering) => (
                  <div key={offering.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                       <Input 
                        type="number"
                        value={offering.slNo || ''}
                        onChange={(e) => handleInputChange(offering.id, 'slNo', e.target.valueAsNumber)}
                        placeholder="e.g., 1"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input 
                        value={offering.nameEn}
                        onChange={(e) => handleInputChange(offering.id, 'nameEn', e.target.value)}
                        placeholder="e.g., Pushpanjali"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input 
                        value={offering.name}
                        onChange={(e) => handleInputChange(offering.id, 'name', e.target.value)}
                        placeholder="ഉദാ., പുഷ്പാഞ്ജലി"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        value={offering.price}
                        onChange={(e) => handleInputChange(offering.id, 'price', e.target.valueAsNumber)}
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeOffering(offering.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addNewOffering} className="mb-8">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Offering
              </Button>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.push('/vazhipadu')}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
