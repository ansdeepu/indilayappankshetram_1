
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { collection, query, doc } from 'firebase/firestore';
import type { Ritual, RitualsPageContent } from '@/lib/types';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';

const defaultPageContent: RitualsPageContent = {
  en: { title: 'Daily Rituals', subtitle: 'Schedule of Daily Poojas' },
  ml: { title: 'ആചാരങ്ങൾ', subtitle: 'ദൈനംദിന പൂജകളുടെ സമയക്രമം' },
}

const timeToSortable = (timeStr: string): number => {
    if (!timeStr) return 24 * 60; // Push empty times to the end
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 24*60;
    
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12) {
        hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
    } else {
        if (modifier.toUpperCase() === 'PM') {
            hours = hours + 12;
        }
    }
    return hours * 60 + (minutes || 0);
};


export default function RitualsPage() {
  const { language } = useLanguage();
  const { isAdmin } = useUser();
  const firestore = useFirestore();

  const ritualsQuery = useMemo(() => {
    if (!firestore) return null;
    // We will fetch without ordering and sort on the client
    return query(collection(firestore, 'dailyRituals'));
  }, [firestore]);

  const { data: dailyRituals, loading: ritualsLoading } = useCollection<Ritual>(ritualsQuery);

  const pageContentRef = useMemo(() => firestore ? doc(firestore, 'content', 'ritualsPage') : null, [firestore]);
  const { data: pageContent, loading: pageContentLoading } = useDoc<RitualsPageContent>(pageContentRef);

  const sortedRituals = useMemo(() => {
    if (!dailyRituals) return [];
    return [...dailyRituals].sort((a, b) => timeToSortable(a.time) - timeToSortable(b.time));
  }, [dailyRituals]);
  
  const displayRituals = sortedRituals.length > 0 ? sortedRituals : [];
  const content = pageContent ? pageContent[language] : defaultPageContent[language];
  const loading = ritualsLoading || pageContentLoading;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <section id="rituals" className="container mx-auto px-4 py-8 md:py-16 scroll-mt-16 relative group">
          {isAdmin && (
            <Button asChild className="absolute top-4 right-4 z-10">
              <Link href="/admin/rituals">
                <Pencil className="mr-2 h-4 w-4" /> {language === 'en' ? 'Edit Page' : 'പേജ് തിരുത്തുക'}
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
          <div className="max-w-2xl mx-auto">
            <div className="bg-card p-4 rounded-lg border">
                {loading ? (
                    <div className="text-center p-8">Loading schedule...</div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px] font-bold text-foreground">
                            {language === 'en' ? 'Time' : 'സമയം'}
                        </TableHead>
                        <TableHead className="font-bold text-foreground">
                            {language === 'en' ? 'Pooja / Ritual' : 'പൂജ / ആചാരം'}
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayRituals.map((ritual) => (
                        <React.Fragment key={ritual.id}>
                          <TableRow>
                              <TableCell className="font-bold">{ritual.time}</TableCell>
                              <TableCell>
                              <div className="font-semibold">
                                  {language === 'en' ? ritual.nameEn : ritual.name}
                              </div>
                              </TableCell>
                          </TableRow>
                          {ritual.nameEn === 'Nada Adakkal (Night)' && (
                            <TableRow>
                              <TableCell colSpan={2} className="py-2 px-0">
                                <Separator />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                        ))}
                    </TableBody>
                    </Table>
                )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
                {language === 'en'
                    ? 'Pooja timings are subject to change on special occasions and festival days.'
                    : 'പ്രത്യേക അവസരങ്ങളിലും ഉത്സവ ദിവസങ്ങളിലും പൂജാ സമയങ്ങളിൽ മാറ്റം വരാം.'}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
