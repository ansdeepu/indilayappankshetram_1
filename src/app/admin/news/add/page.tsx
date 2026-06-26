'use client';

import { NewsArticleForm } from '../article-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AddNewsArticlePage() {
  return (
    <div className="container mx-auto p-4">
       <Card>
        <CardHeader>
            <CardTitle>Create New Article</CardTitle>
            <CardDescription>
            Fill in the details for the news article below. Both English and Malayalam content is required.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <NewsArticleForm />
        </CardContent>
      </Card>
    </div>
  );
}
