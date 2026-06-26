'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ShieldAlert, Loader2, Search, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Coins,
  HeartHandshake,
  CalendarCheck,
  Building,
  Flame,
  PartyPopper,
  UserCheck,
  Activity,
} from 'lucide-react';

import { 
  INCOME_CATEGORIES, 
  EXPENDITURE_CATEGORIES, 
  type FinanceCategory, 
  type SubCategory 
} from '@/lib/finance-data';

export default function CategoryPage() {
  const { language } = useLanguage();
  const { user, isAdmin, isManager, loading } = useUser();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('inc-vazhipadu');

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Flame':
        return <Flame className="h-6 w-6 text-amber-500" />;
      case 'HeartHandshake':
        return <HeartHandshake className="h-6 w-6 text-rose-500" />;
      case 'PartyPopper':
        return <PartyPopper className="h-6 w-6 text-purple-500" />;
      case 'Building':
        return <Building className="h-6 w-6 text-sky-500" />;
      case 'UserCheck':
        return <UserCheck className="h-6 w-6 text-emerald-500" />;
      case 'Activity':
        return <Activity className="h-6 w-6 text-indigo-500" />;
      default:
        return <Coins className="h-6 w-6 text-amber-500" />;
    }
  };

  // Filter categories and subcategories based on search input
  const filterCategories = (categories: FinanceCategory[]) => {
    if (!searchQuery) return categories;

    const queryLower = searchQuery.toLowerCase();
    return categories
      .map((cat) => {
        const matchesCategory =
          cat.nameEn.toLowerCase().includes(queryLower) ||
          cat.nameMl.includes(searchQuery) ||
          cat.descriptionEn.toLowerCase().includes(queryLower) ||
          cat.descriptionMl.includes(searchQuery);

        const filteredSub = cat.subcategories.filter(
          (sub) =>
            sub.nameEn.toLowerCase().includes(queryLower) ||
            sub.nameMl.includes(searchQuery) ||
            sub.descriptionEn.toLowerCase().includes(queryLower) ||
            sub.descriptionMl.includes(searchQuery)
        );

        if (matchesCategory || filteredSub.length > 0) {
          return {
            ...cat,
            subcategories: filteredSub.length > 0 ? filteredSub : cat.subcategories,
          };
        }
        return null;
      })
      .filter((cat): cat is FinanceCategory => cat !== null);
  };

  const filteredIncome = useMemo(() => filterCategories(INCOME_CATEGORIES), [searchQuery]);
  const filteredExpenditure = useMemo(() => filterCategories(EXPENDITURE_CATEGORIES), [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthorized = user && (isAdmin || isManager);

  if (!isAuthorized) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 bg-background flex flex-col items-center justify-center py-20 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md p-8 bg-card border border-border rounded-xl shadow-lg"
          >
            <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-headline font-bold text-foreground mb-2">
              {language === 'en' ? 'Access Restricted' : 'പ്രവേശനം പരിമിതപ്പെടുത്തിയിരിക്കുന്നു'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === 'en' 
                ? 'Only registered temple administrators or committee managers can access the accounts categories schema.'
                : 'രജിസ്റ്റർ ചെയ്ത ക്ഷേത്ര അഡ്മിനിസ്ട്രേറ്റർമാർക്കോ കമ്മിറ്റി മാനേജർമാർക്കോ മാത്രമേ ധനകാര്യ വിഭാഗങ്ങളുടെ വിവരങ്ങൾ കാണാൻ സാധിക്കൂ.'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-2">
                Login
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                {language === 'en' ? 'Back to Home' : 'പ്രധാന പേജിലേക്ക്'}
              </Button>
            </div>
          </motion.div>
          <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-b from-amber-50/20 via-background to-amber-50/10 py-8 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-wide">
              {language === 'en' ? 'Accounts & Finance Categories' : 'ധനകാര്യ വിഭാഗങ്ങളും ഉപവിഭാഗങ്ങളും'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
              {language === 'en'
                ? 'Explore the structured accounting scheme of Indilayappan Kshetram. Our categorizations promote transparent financial auditing for all offerings, donations, and administrative expenditures.'
                : 'ഇണ്ടിളയപ്പൻ ക്ഷേത്രത്തിലെ ധനകാര്യ വിഭാഗങ്ങൾ ഇവിടെ പരിശോധിക്കാം. ഞങ്ങളുടെ വർഗ്ഗീകരണം വരവ്-ചെലവ് കണക്കുകളിൽ പൂർണ്ണമായ സുതാര്യത ഉറപ്പാക്കുന്നു.'}
            </p>
          </div>

          {/* Interactive Search */}
          <div className="relative max-w-md mx-auto mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={language === 'en' ? 'Search categories or subcategories...' : 'വിഭാഗങ്ങളോ ഉപവിഭാഗങ്ങളോ തിരയുക...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-accent/30 focus-visible:ring-accent bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-primary/10 mb-8 border border-accent/20">
              <TabsTrigger
                value="income"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-2"
              >
                <Coins className="h-4 w-4" />
                {language === 'en' ? 'Income Categories' : 'വരവ് വിഭാഗങ്ങൾ'}
              </TabsTrigger>
              <TabsTrigger
                value="expenditure"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {language === 'en' ? 'Expenditure Categories' : 'ചെലവ് വിഭാഗങ്ങൾ'}
              </TabsTrigger>
            </TabsList>

            {/* Income Categories Content */}
            <TabsContent value="income" className="space-y-6">
              {filteredIncome.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {language === 'en' ? 'No income categories found matching your query.' : 'തിരഞ്ഞ വിഭാഗത്തിൽ വരവ് വിവരങ്ങളൊന്നും ലഭ്യമല്ല.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredIncome.map((category) => {
                    const isExpanded = expandedCategory === category.id;
                    return (
                      <Card
                        key={category.id}
                        className="border-accent/20 hover:border-accent/40 transition-all overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full text-left p-6 flex items-center justify-between gap-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/5 rounded-full border border-primary/10">
                              {getIcon(category.iconName)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-headline font-bold text-lg md:text-xl text-primary">
                                  {language === 'en' ? category.nameEn : category.nameMl}
                                </h3>
                                <Badge variant="outline" className="text-[10px] uppercase border-accent/30 text-accent">
                                  {language === 'en' ? 'Income' : 'വരവ്'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1 md:line-clamp-none max-w-2xl">
                                {language === 'en' ? category.descriptionEn : category.descriptionMl}
                              </p>
                            </div>
                          </div>
                          <div>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-accent/10"
                            >
                              <CardContent className="p-6 bg-background space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                  {language === 'en' ? 'Subcategories & Elements' : 'ഉപവിഭാഗങ്ങൾ'}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {category.subcategories.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="p-4 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors flex flex-col justify-between"
                                    >
                                      <div>
                                        <h5 className="font-headline font-bold text-base text-primary">
                                          {language === 'en' ? sub.nameEn : sub.nameMl}
                                        </h5>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                          {language === 'en' ? sub.descriptionEn : sub.descriptionMl}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Expenditure Categories Content */}
            <TabsContent value="expenditure" className="space-y-6">
              {filteredExpenditure.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {language === 'en' ? 'No expenditure categories found matching your query.' : 'തിരഞ്ഞ വിഭാഗത്തിൽ ചെലവ് വിവരങ്ങളൊന്നും ലഭ്യമല്ല.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredExpenditure.map((category) => {
                    const isExpanded = expandedCategory === category.id;
                    return (
                      <Card
                        key={category.id}
                        className="border-accent/20 hover:border-accent/40 transition-all overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full text-left p-6 flex items-center justify-between gap-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/5 rounded-full border border-primary/10">
                              {getIcon(category.iconName)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-headline font-bold text-lg md:text-xl text-primary">
                                  {language === 'en' ? category.nameEn : category.nameMl}
                                </h3>
                                <Badge variant="outline" className="text-[10px] uppercase border-rose-200 text-rose-500 bg-rose-50/50">
                                  {language === 'en' ? 'Expenditure' : 'ചെലവ്'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1 md:line-clamp-none max-w-2xl">
                                {language === 'en' ? category.descriptionEn : category.descriptionMl}
                              </p>
                            </div>
                          </div>
                          <div>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-accent/10"
                            >
                              <CardContent className="p-6 bg-background space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                  {language === 'en' ? 'Subcategories & Elements' : 'ഉപവിഭാഗങ്ങൾ'}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {category.subcategories.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="p-4 rounded-lg bg-rose-50/10 border border-rose-100 hover:bg-rose-50/20 transition-colors flex flex-col justify-between"
                                    >
                                      <div>
                                        <h5 className="font-headline font-bold text-base text-primary">
                                          {language === 'en' ? sub.nameEn : sub.nameMl}
                                        </h5>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                          {language === 'en' ? sub.descriptionEn : sub.descriptionMl}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
