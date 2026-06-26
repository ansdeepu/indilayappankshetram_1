
'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Offering, VazhipaduPageContent } from '@/lib/types';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const defaultPageContent: VazhipaduPageContent = {
  en: { title: 'Offerings Rate List', subtitle: 'List of available poojas and their rates' },
  ml: { title: 'വഴിപാട് നിരക്കുകൾ', subtitle: 'ലഭ്യമായ പൂജകളുടെയും അവയുടെ നിരക്കുകളുടെയും പട്ടിക' },
};


function VazhipaduPage() {
  const { language } = useLanguage();
  const { isAdmin } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const offeringsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'offerings'), orderBy('slNo', 'asc'));
  }, [firestore]);
  const { data: offeringsList, loading: offeringsLoading } = useCollection<Offering>(offeringsQuery);
  
  const pageContentRef = useMemo(() => firestore ? doc(firestore, 'content', 'vazhipaduPage') : null, [firestore]);
  const { data: pageContent, loading: pageContentLoading } = useDoc<VazhipaduPageContent>(pageContentRef);

  const content = pageContent ? pageContent[language] : defaultPageContent[language];
  const loading = offeringsLoading || pageContentLoading;
  
  const filteredOfferings = useMemo(() => {
    if (!offeringsList) return [];
    if (!searchTerm) return offeringsList;

    const lowercasedFilter = searchTerm.toLowerCase();
    return offeringsList.filter(offering =>
      offering.name.toLowerCase().includes(lowercasedFilter) ||
      offering.nameEn.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, offeringsList]);

  // Logic to split offerings into two columns
  const middleIndex = Math.ceil(filteredOfferings.length / 2);
  const firstHalf = filteredOfferings.slice(0, middleIndex);
  const secondHalf = filteredOfferings.slice(middleIndex);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <section id="vazhipadu" className="container mx-auto px-4 py-8 md:py-16 scroll-mt-16 relative group">
          {isAdmin && (
            <Button asChild className="absolute top-4 right-4 z-10">
              <Link href="/admin/offerings">
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
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-end mb-4">
                 <Input
                    placeholder={language === 'en' ? "Search offerings..." : "വഴിപാടുകൾ തിരയുക..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
            </div>
            {loading ? (
                <div className="text-center p-8">Loading offerings...</div>
            ) : filteredOfferings.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:gap-x-4 border rounded-lg p-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[60px] font-bold text-foreground">{language === 'en' ? 'Sl. No.' : 'ക്രമ. നം.'}</TableHead>
                                <TableHead className="font-bold text-foreground">{language === 'en' ? 'Offering' : 'വഴിപാട്'}</TableHead>
                                <TableHead className="text-right font-bold text-foreground">{language === 'en' ? 'Rate (₹)' : 'നിരക്ക് (₹)'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {firstHalf.map((offering) => (
                                <TableRow key={offering.id}>
                                    <TableCell className="font-medium">{offering.slNo}</TableCell>
                                    <TableCell>{language === 'en' ? offering.nameEn : offering.name}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{offering.price.toFixed(0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                     <Separator orientation="vertical" className="hidden md:block h-auto" />

                    <Table>
                       <TableHeader>
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[60px] font-bold text-foreground">{language === 'en' ? 'Sl. No.' : 'ക്രമ. നം.'}</TableHead>
                                <TableHead className="font-bold text-foreground">{language === 'en' ? 'Offering' : 'വഴിപാട്'}</TableHead>
                                <TableHead className="text-right font-bold text-foreground">{language === 'en' ? 'Rate (₹)' : 'നിരക്ക് (₹)'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {secondHalf.map((offering) => (
                                <TableRow key={offering.id}>
                                    <TableCell className="font-medium">{offering.slNo}</TableCell>
                                    <TableCell>{language === 'en' ? offering.nameEn : offering.name}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{offering.price.toFixed(0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            ) : (
                <div className="text-center text-muted-foreground h-24 flex items-center justify-center border rounded-lg">
                    {language === 'en' ? 'No offerings found.' : 'വഴിപാടുകൾ ഒന്നും കണ്ടെത്തിയില്ല.'}
                </div>
            )}
             <p className="text-center text-sm text-muted-foreground mt-6">
                {language === 'en'
                ? 'For more details, please contact the temple office.'
                : 'കൂടുതൽ വിവരങ്ങൾക്ക് ക്ഷേത്രം ഓഫീസുമായി ബന്ധപ്പെടുക.'}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default VazhipaduPage;
