'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { useLanguage } from '@/context/language-context';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import type { TempleAsset } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'motion/react';
import { 
  Package, 
  Gift, 
  LandPlot, 
  Home, 
  Gem, 
  Wrench, 
  HelpCircle 
} from 'lucide-react';

export default function AssetsPage() {
  const { language } = useLanguage();
  const firestore = useFirestore();

  const assetsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'assets'), orderBy('categoryEn'));
  }, [firestore]);

  const { data: assetsList, loading } = useCollection<TempleAsset>(assetsQuery);

  const categories = [
    { en: 'Land', ml: 'ഭൂമി', icon: LandPlot },
    { en: 'Building', ml: 'കെട്ടിടം', icon: Home },
    { en: 'Ornament', ml: 'ആഭരണങ്ങൾ', icon: Gem },
    { en: 'Equipment', ml: 'ഉപകരണങ്ങൾ', icon: Wrench },
    { en: 'Other', ml: 'മറ്റുള്ളവ', icon: HelpCircle },
  ];

  const getCategoryIcon = (categoryEn: string) => {
    const cat = categories.find(c => c.en === categoryEn);
    return cat ? cat.icon : Package;
  };

  const getCategoryMl = (categoryEn: string) => {
    const cat = categories.find(c => c.en === categoryEn);
    return cat ? cat.ml : categoryEn;
  };

  const groupedAssets = useMemo(() => {
    if (!assetsList) return {};
    return assetsList.reduce((acc, asset) => {
      const category = asset.categoryEn || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(asset);
      return acc;
    }, {} as Record<string, TempleAsset[]>);
  }, [assetsList]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
          <div className="container relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-headline text-4xl font-bold tracking-tight sm:text-5xl"
            >
              {language === 'en' ? 'Temple Assets' : 'ക്ഷേത്ര സ്വത്തുക്കൾ'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80"
            >
              {language === 'en' 
                ? 'Information about the sacred properties and assets of Indilayappan Temple.'
                : 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലെ വിശുദ്ധമായ സ്വത്തുക്കളെയും ആസ്തികളെയും കുറിച്ചുള്ള വിവരങ്ങൾ.'}
            </motion.p>
          </div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        </section>

        <section className="container py-12">
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-slate-100/50">
                    <Skeleton className="h-8 w-48" />
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4 p-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !assetsList || assetsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-600">
                {language === 'en' ? 'No assets found' : 'ആസ്തികൾ ഒന്നും കണ്ടെത്തിയില്ല'}
              </h3>
              <p className="text-slate-500">
                {language === 'en' 
                  ? 'There are currently no assets listed for the temple.'
                  : 'ക്ഷേത്രത്തിനായി നിലവിൽ ആസ്തികളൊന്നും പട്ടികപ്പെടുത്തിയിട്ടില്ല.'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedAssets).map(([category, items]) => {
                const CategoryIcon = getCategoryIcon(category);
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden border-slate-200 shadow-md">
                      <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <CategoryIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">
                              {language === 'en' ? category : getCategoryMl(category)}
                            </CardTitle>
                            <CardDescription>
                              {language === 'en' 
                                ? `${items.length} items in this category`
                                : `ഈ വിഭാഗത്തിൽ ${items.length} ഇനങ്ങൾ`}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/50">
                              <TableHead className="w-[30%]">
                                {language === 'en' ? 'Asset Name' : 'ആസ്തിയുടെ പേര്'}
                              </TableHead>
                              <TableHead className="w-[10%]">
                                {language === 'en' ? 'Quantity' : 'അളവ്/എണ്ണം'}
                              </TableHead>
                              <TableHead className="w-[35%]">
                                {language === 'en' ? 'Description' : 'വിവരണം'}
                              </TableHead>
                              <TableHead className="w-[25%]">
                                {language === 'en' ? 'Source / Donated By' : 'സ്രോതസ്സ് / നൽകിയത്'}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((asset) => (
                              <TableRow key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                                <TableCell className="font-semibold">
                                  {language === 'en' ? asset.nameEn : asset.nameMl}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono">
                                    {asset.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600 text-sm italic">
                                  {language === 'en' ? asset.descriptionEn : asset.descriptionMl}
                                </TableCell>
                                <TableCell>
                                  {asset.isDonated ? (
                                    <div className="flex items-center gap-2">
                                      <Gift className="h-4 w-4 text-accent" />
                                      <span className="text-sm font-medium">
                                        {language === 'en' ? asset.donatedByEn : asset.donatedByMl}
                                      </span>
                                      {asset.donationDate && (
                                        <span className="text-[10px] text-slate-400">
                                          ({new Date(asset.donationDate).getFullYear()})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                                      {language === 'en' ? 'Temple Property' : 'ക്ഷേത്ര സ്വത്ത്'}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Donation Acknowledgement Section */}
        <section className="bg-slate-100 py-16">
          <div className="container">
            <div className="rounded-2xl bg-white p-8 shadow-xl md:p-12 border border-slate-200">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div>
                  <h2 className="font-headline text-3xl font-bold text-primary">
                    {language === 'en' ? 'Contribute to Temple Assets' : 'ക്ഷേത്ര ആസ്തികളിലേക്ക് സംഭാവന ചെയ്യുക'}
                  </h2>
                  <p className="mt-4 text-slate-600 leading-relaxed">
                    {language === 'en' 
                      ? 'Devotees are invited to donate ornaments, vessels, or other useful items for the temple ritual services and development. Your contribution will be recorded in our sacred asset register.'
                      : 'ക്ഷേത്രത്തിന്റെ ആചാരപരമായ സേവനങ്ങൾക്കും വികസനത്തിനുമായി ആഭരണങ്ങൾ, പാത്രങ്ങൾ അല്ലെങ്കിൽ മറ്റ് ഉപയോഗപ്രദമായ വസ്തുക്കൾ സംഭാവന ചെയ്യാൻ ഭക്തരെ ക്ഷണിക്കുന്നു. നിങ്ങളുടെ സംഭാവന ഞങ്ങളുടെ വിശുദ്ധ ആസ്തി രജിസ്റ്ററിൽ രേഖപ്പെടുത്തുന്നതാണ്.'}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Badge variant="outline" className="px-3 py-1 text-sm border-primary/20 text-primary">
                      {language === 'en' ? 'Ornaments' : 'സ്വർണ്ണ/വെള്ളി ആഭരണങ്ങൾ'}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-sm border-primary/20 text-primary">
                      {language === 'en' ? 'Brass Vessels' : 'ഓട്ടുപാത്രങ്ങൾ'}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-sm border-primary/20 text-primary">
                      {language === 'en' ? ' Ritual Equipment' : 'ആചാരപരമായ ഉപകരണങ്ങൾ'}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center text-center">
                   <div className="rounded-full bg-accent/20 p-4 mb-4">
                    <Gift className="h-8 w-8 text-accent" />
                   </div>
                   <h3 className="text-lg font-bold mb-2">
                     {language === 'en' ? 'Interested in Donating?' : 'സംഭാവന നൽകാൻ താൽപ്പര്യമുണ്ടോ?'}
                   </h3>
                   <p className="text-sm text-slate-500 mb-6">
                     {language === 'en' 
                       ? 'Please contact the temple office or manager for guidance on asset donation procedures.'
                       : 'ആസ്തികൾ സംഭാവന ചെയ്യുന്നതിനുള്ള നടപടിക്രമങ്ങളെക്കുറിച്ചുള്ള മാർഗനിർദ്ദേശങ്ങൾക്കായി ദയവായി ക്ഷേത്ര ഓഫീസുമായോ മാനേജരുമായോ ബന്ധപ്പെടുക.'}
                   </p>
                   <div className="space-y-2 w-full">
                     <p className="text-primary font-bold">+91 94464 63661</p>
                     <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Temple Manager</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
