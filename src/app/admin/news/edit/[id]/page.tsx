'use client';

import { useFirestore, useDoc } from '@/firebase';
import { NewsArticleForm } from '../../article-form';
import { doc } from 'firebase/firestore';
import type { NewsArticle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import React from 'react';


export default function EditNewsArticlePage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { id } = React.use(params);
  
  const articleRef = firestore ? doc(firestore, 'news', id) : null;
  const { data: article, loading: articleLoading } = useDoc<NewsArticle>(articleRef);

  if (articleLoading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }
  
  if (!article) {
    return <div className="container mx-auto p-4">Article not found.</div>
  }

  return (
    <div className="container mx-auto p-4">
        <Card>
            <CardHeader>
                <CardTitle>Edit Article</CardTitle>
                <CardDescription>
                Make changes to the news article below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <NewsArticleForm existingArticle={article} />
            </CardContent>
        </Card>
    </div>
  );
}
