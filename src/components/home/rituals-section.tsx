
'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
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
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Ritual, RitualsPageContent } from '@/lib/types';
import { dailyRituals as fallbackRituals } from '@/lib/data';

const defaultPageContent: RitualsPageContent = {
  en: { title: 'Daily Rituals', subtitle: 'Schedule of Daily Poojas' },
  ml: { title: 'ആചാരങ്ങൾ', subtitle: 'ദൈനംദിന പൂജകളുടെ സമയക്രമം' },
}

export function RitualsSection() {
  const { language } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();

  const ritualsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dailyRituals'), orderBy('time'));
  }, [firestore]);

  const { data: dailyRituals, loading: ritualsLoading } = useCollection<Ritual>(ritualsQuery);

  const pageContentRef = useMemo(() => firestore ? doc(firestore, 'content', 'ritualsPage') : null, [firestore]);
  const { data: pageContent, loading: pageContentLoading } = useDoc<RitualsPageContent>(pageContentRef);

  const displayRituals = dailyRituals && dailyRituals.length > 0 ? dailyRituals : fallbackRituals;
  const content = pageContent ? pageContent[language] : defaultPageContent[language];
  const loading = ritualsLoading || pageContentLoading;


  return (
    <section id="rituals" className="scroll-mt-16 relative group">
      {user && (
        <Button asChild className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="max-w-4xl mx-auto bg-card p-4 rounded-lg border">
         {loading ? (
            <div className="text-center p-8">Loading schedule...</div>
         ) : (
            <Table>
            <TableCaption>
                {language === 'en'
                ? 'Pooja timings are subject to change on special occasions and festival days.'
                : 'പ്രത്യേക അവസരങ്ങളിലും ഉത്സവ ദിവസങ്ങളിലും പൂജാ സമയങ്ങളിൽ മാറ്റം വരാം.'}
            </TableCaption>
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
                <TableRow key={ritual.id}>
                    <TableCell className="font-medium">{ritual.time}</TableCell>
                    <TableCell>
                    <div className="font-semibold">
                        {language === 'en' ? ritual.nameEn : ritual.name}
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
         )}
      </div>
    </section>
  );
}
