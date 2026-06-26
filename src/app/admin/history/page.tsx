'use client';

import { useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { HistoryContent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const emptyContent: HistoryContent = {
  en: { title: '', subtitle: '', paragraphs: [''] },
  ml: { title: '', subtitle: '', paragraphs: [''] },
};

export default function EditHistoryPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const historyRef = useMemo(() => 
    firestore ? doc(firestore, 'content', 'history') : null
  , [firestore]);

  const { data: historyContent, loading: historyLoading } = useDoc<HistoryContent>(historyRef);
  
  const [formData, setFormData] = useState<HistoryContent | null>(null);

  useEffect(() => {
    if (historyContent) {
      setFormData(historyContent);
    } else if (!historyLoading) {
      // If there's no content and we are not loading, initialize with empty
      setFormData(emptyContent);
    }
  }, [historyContent, historyLoading]);

  const handleInputChange = (lang: 'en' | 'ml', field: 'title' | 'subtitle', value: string) => {
    setFormData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [lang]: {
                ...prev[lang],
                [field]: value,
            },
        }
    });
  };

  const handleParagraphsChange = (lang: 'en' | 'ml', value: string) => {
    setFormData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [lang]: {
                ...prev[lang],
                paragraphs: value.split('\n\n'),
            }
        }
    });
  };

  const handleSave = async () => {
    if (!historyRef || !formData) return;
    try {
      await setDoc(historyRef, formData, { merge: true });
      toast({
        title: 'Success!',
        description: 'History content has been updated.',
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
  
  const isLoading = !formData;

  return (
    <div className="container mx-auto p-4">
      <Card>
          <CardHeader>
              <CardTitle className="text-2xl font-bold">Edit Temple History</CardTitle>
              <CardDescription>Update the content for the history section on the homepage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {isLoading ? (
              <div>Loading form...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">English Content</h3>
                        <div className="space-y-2">
                            <Label htmlFor="en-title">Title</Label>
                            <Input id="en-title" value={formData.en.title} onChange={(e) => handleInputChange('en', 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="en-subtitle">Subtitle</Label>
                            <Input id="en-subtitle" value={formData.en.subtitle} onChange={(e) => handleInputChange('en', 'subtitle', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="en-paragraphs">Paragraphs (separate with a blank line)</Label>
                            <Textarea id="en-paragraphs" value={formData.en.paragraphs.join('\n\n')} onChange={(e) => handleParagraphsChange('en', e.target.value)} rows={10} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Malayalam Content (മലയാളം)</h3>
                          <div className="space-y-2">
                            <Label htmlFor="ml-title">Title (തലക്കെട്ട്)</Label>
                            <Input id="ml-title" value={formData.ml.title} onChange={(e) => handleInputChange('ml', 'title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ml-subtitle">Subtitle (ഉപശീർഷകം)</Label>
                            <Input id="ml-subtitle" value={formData.ml.subtitle} onChange={(e) => handleInputChange('ml', 'subtitle', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ml-paragraphs">Paragraphs (ഖണ്ഡികകൾ)</Label>
                            <Textarea id="ml-paragraphs" value={formData.ml.paragraphs.join('\n\n')} onChange={(e) => handleParagraphsChange('ml', e.target.value)} rows={10} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4">
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
