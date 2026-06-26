'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection } from '@/firebase';
import { collection, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import type { NewsArticle } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ManageNews() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const newsCollectionQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: news, loading: newsLoading } = useCollection<NewsArticle>(newsCollectionQuery);

  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);

  const handleDeleteClick = (article: NewsArticle) => {
    setArticleToDelete(article);
  };

  const confirmDelete = async () => {
    if (!articleToDelete || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'news', articleToDelete.id));
      toast({
        title: 'Article Deleted',
        description: `"${articleToDelete.titleEn}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Article',
        description: error.message,
      });
    } finally {
      setArticleToDelete(null);
    }
  };


  return (
    <>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Manage News & Events</CardTitle>
                <CardDescription>Create, edit, or delete news articles for the homepage.</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/news/add">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Article
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {newsLoading ? (
              <div className="text-center p-4">Loading...</div>
            ) : (
              <div className="space-y-4">
                {news && news.length > 0 ? (
                  news.map((article) => {
                    return (
                      <div key={article.id} className="p-4 border rounded-lg flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <Image
                            src={article.imageUrl || `https://picsum.photos/seed/${article.id}/100/100`}
                            alt={article.titleEn}
                            width={80}
                            height={80}
                            className="rounded-md object-cover aspect-square"
                            data-ai-hint={'news event'}
                          />
                          <div>
                            <h2 className="text-lg font-semibold">{article.titleEn} / {article.title}</h2>
                            <p className="text-sm text-muted-foreground">{article.date ? new Date(article.date).toLocaleDateString('en-CA') : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/news/edit/${article.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(article)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No news articles found.</p>
                    <Button variant="link" asChild><Link href="/admin/news/add">Create the first one!</Link></Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article titled
              <span className="font-semibold"> "{articleToDelete?.titleEn}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
