
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import type { NewsArticle } from '@/lib/types';
import { format } from 'date-fns';
import { getYoutubeThumbnail } from '@/lib/utils';

const articleFormSchema = z.object({
  title: z.string().min(2, 'Title is too short.'),
  titleEn: z.string().min(2, 'English title is too short.'),
  summary: z.string().min(10, 'Summary is too short.'),
  summaryEn: z.string().min(10, 'English summary is too short.'),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  youtubeUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  date: z.string().refine((val) => val, {
    message: 'Article date is required.',
  }),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface NewsArticleFormProps {
  existingArticle?: NewsArticle;
}

export function NewsArticleForm({ existingArticle }: NewsArticleFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const defaultValues: Partial<ArticleFormValues> = existingArticle
    ? { 
        ...existingArticle,
        date: existingArticle.date ? format(new Date(existingArticle.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        imageUrl: existingArticle.imageUrl || '',
        youtubeUrl: existingArticle.youtubeUrl || '',
      }
    : {
        title: '',
        titleEn: '',
        summary: '',
        summaryEn: '',
        imageUrl: '',
        youtubeUrl: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      };

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues,
    mode: 'onBlur',
  });
  
  const imageUrlValue = form.watch('imageUrl');
  const youtubeUrlValue = form.watch('youtubeUrl');
  const youtubeThumbnail = getYoutubeThumbnail(youtubeUrlValue);

  async function onSubmit(data: ArticleFormValues) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available.' });
      return;
    }

    const articleId = existingArticle?.id || uuidv4();
    const articleRef = doc(firestore, 'news', articleId);
    
    const articleData: NewsArticle = {
      ...data,
      id: articleId,
      date: new Date(data.date).toISOString(),
      imageUrl: data.imageUrl || '',
      youtubeUrl: data.youtubeUrl || '',
    };

    try {
      await setDoc(articleRef, articleData, { merge: true });
      toast({
        title: existingArticle ? 'Article Updated' : 'Article Created',
        description: `"${data.titleEn}" has been successfully saved.`,
      });
      router.push('/admin/news');
      router.refresh(); // Refresh server components
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving article',
        description: error.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* English Fields */}
          <div className="space-y-4">
              <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Festival Announced" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summaryEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary (English)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief summary of the news article..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Malayalam Fields */}
          <div className="space-y-4">
              <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Malayalam)</FormLabel>
                  <FormControl>
                    <Input placeholder="ഉദാഹരണത്തിന്, വാർഷിക ഉത്സവം പ്രഖ്യാപിച്ചു" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary (Malayalam)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="വാർത്തയുടെ ഒരു ചെറിയ സംഗ്രഹം..." {...field} rows={5}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                   <div className="flex items-start gap-4">
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} className="flex-1" />
                    </FormControl>
                    {imageUrlValue && (
                        <div className="relative w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                           <Image 
                                src={imageUrlValue} 
                                alt="Image Preview" 
                                fill 
                                className="object-cover"
                                sizes="96px"
                            />
                        </div>
                    )}
                  </div>
                  <FormDescription>
                    Paste a link to an image for the article.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Video URL</FormLabel>
                  <div className="flex items-start gap-4">
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} className="flex-1" />
                    </FormControl>
                    {youtubeThumbnail && (
                        <div className="relative w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image 
                                src={youtubeThumbnail} 
                                alt="YouTube Preview" 
                                fill 
                                className="object-cover"
                                sizes="96px"
                             />
                        </div>
                    )}
                  </div>
                    <FormDescription>
                    Paste a link to a YouTube video.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>
                    The publication date for the article.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/news')}>
            Cancel
          </Button>
          <Button type="submit">{existingArticle ? 'Save Changes' : 'Create Article'}</Button>
        </div>
      </form>
    </Form>
  );
}
