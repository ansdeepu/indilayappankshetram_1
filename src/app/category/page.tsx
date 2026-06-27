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
import { ShieldAlert, Loader2, Search, BookOpen, ChevronDown, ChevronRight, Flame } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

import { INCOME_CATEGORIES, EXPENDITURE_CATEGORIES, FinanceCategory } from '@/lib/finance-categories';

export default function CategoryPage() {
  const { language } = useLanguage();
  const { user, loading: authLoading, isAdmin, isManager } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'income' | 'expenditure'>('income');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const categories = useMemo(() => {
    return activeTab === 'income' ? INCOME_CATEGORIES : EXPENDITURE_CATEGORIES;
  }, [activeTab]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.nameEn.toLowerCase().includes(query) || 
      cat.nameMl.toLowerCase().includes(query) ||
      cat.descriptionEn.toLowerCase().includes(query) ||
      cat.descriptionMl.toLowerCase().includes(query) ||
      cat.subcategories.some(sub => 
        sub.nameEn.toLowerCase().includes(query) || 
        sub.nameMl.toLowerCase().includes(query)
      )
    );
  }, [categories, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedCategoryId(expandedCategoryId === id ? null : id);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <ShieldAlert className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <CardTitle>{language === 'en' ? 'Access Restricted' : 'പ്രവേശനം നിയന്ത്രിച്ചിരിക്കുന്നു'}</CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Please login to view temple financial categories and structure.' 
                  : 'ക്ഷേത്രത്തിലെ സാമ്പത്തിക വിഭാഗങ്ങളും ഘടനയും കാണുന്നതിന് ദയവായി ലോഗിൻ ചെയ്യുക.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <Button onClick={() => setIsLoginOpen(true)} className="w-full">
                  {language === 'en' ? 'Login Now' : 'ഇപ്പോൾ ലോഗിൻ ചെയ്യുക'}
                </Button>
              </LoginDialog>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <SiteHeader />
      
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">
              {language === 'en' ? 'Financial Categories' : 'സാമ്പത്തിക വിഭാഗങ്ങൾ'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'en' 
                ? 'Standardized classification for temple income and expenditure reporting.' 
                : 'ക്ഷേത്രത്തിലെ വരവ് ചിലവ് കണക്കുകൾ രേഖപ്പെടുത്തുന്നതിനുള്ള വിഭാഗങ്ങൾ.'}
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'en' ? 'Search categories...' : 'തിരയുക...'}
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs 
          defaultValue="income" 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as 'income' | 'expenditure')}
          className="w-full space-y-6"
        >
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
              <TabsTrigger value="income" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LucideIcons.TrendingUp className="mr-2 h-5 w-5" />
                {language === 'en' ? 'Income' : 'വരവ്'}
              </TabsTrigger>
              <TabsTrigger value="expenditure" className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LucideIcons.TrendingDown className="mr-2 h-5 w-5" />
                {language === 'en' ? 'Expenditure' : 'ചിലവ്'}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => {
                  // @ts-ignore
                  const Icon = LucideIcons[category.iconName as keyof typeof LucideIcons] || LucideIcons.BookOpen;
                  const isExpanded = expandedCategoryId === category.id;

                  return (
                    <Card key={category.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-white pb-4 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold font-headline">
                                {language === 'en' ? category.nameEn : category.nameMl}
                              </CardTitle>
                              <Badge variant="outline" className="mt-1 bg-slate-50">
                                {category.id.startsWith('inc') ? (language === 'en' ? 'Income' : 'വരവ്') : (language === 'en' ? 'Expenditure' : 'ചിലവ്')}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleExpand(category.id)}
                            className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")}
                          >
                            <ChevronDown className="h-5 w-5" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                          {language === 'en' ? category.descriptionEn : category.descriptionMl}
                        </p>
                      </CardHeader>
                      <CardContent className="p-0 bg-slate-50/30">
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                                  {language === 'en' ? 'Sub Categories' : 'ഉപവിഭാഗങ്ങൾ'}
                                </h4>
                                {category.subcategories.map((sub, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm"
                                  >
                                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    <div>
                                      <p className="font-semibold text-sm">
                                        {language === 'en' ? sub.nameEn : sub.nameMl}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {language === 'en' ? sub.descriptionEn : sub.descriptionMl}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {!isExpanded && (
                          <div className="px-6 py-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {category.subcategories.length} {language === 'en' ? 'Sub-categories' : 'ഉപവിഭാഗങ്ങൾ'}
                            </span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={() => toggleExpand(category.id)}
                              className="h-auto p-0 text-primary"
                            >
                              {language === 'en' ? 'View Details' : 'വിശദാംശങ്ങൾ'}
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="bg-white inline-flex p-6 rounded-full mb-4 shadow-sm border border-slate-100">
                    <Search className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold">{language === 'en' ? 'No Categories Found' : 'വിഭാഗങ്ങൾ കണ്ടെത്തിയില്ല'}</h3>
                  <p className="text-muted-foreground">
                    {language === 'en' 
                      ? 'Try adjusting your search query.' 
                      : 'തിരയുന്ന വാക്ക് മാറ്റി ശ്രമിക്കുക.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <SiteFooter />
    </div>
  );
}
