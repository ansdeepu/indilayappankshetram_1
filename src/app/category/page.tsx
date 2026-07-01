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
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/auth/login-dialog';
import { 
  ShieldAlert, 
  Loader2, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  PlusCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFinanceCategories, FinanceCategory, SubCategory } from '@/hooks/use-finance-categories';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AVAILABLE_ICONS = [
  { name: 'Flame', labelEn: 'Flame (Pujas/Rituals)', labelMl: 'ജ്വാല (പൂജകൾ)' },
  { name: 'HeartHandshake', labelEn: 'Heart Handshake (Donations)', labelMl: 'സംഭാവനകൾ' },
  { name: 'PartyPopper', labelEn: 'Festival', labelMl: 'ഉത്സവം' },
  { name: 'Building', labelEn: 'Temple Building/Construction', labelMl: 'നിർമ്മാണം/നവീകരണം' },
  { name: 'UserCheck', labelEn: 'Staff/Priests', labelMl: 'ജീവനക്കാർ' },
  { name: 'Activity', labelEn: 'Charity/Healthcare', labelMl: 'കാരുണ്യ പ്രവർത്തനം' },
  { name: 'Landmark', labelEn: 'Administration/Treasury', labelMl: 'ഭരണം/ഖജനാവ്' },
  { name: 'Gift', labelEn: 'Special Offerings/Prasadam', labelMl: 'പ്രസാദം/വഴിപാടുകൾ' },
  { name: 'BookOpen', labelEn: 'Education/Culture', labelMl: 'വിദ്യാഭ്യാസം/സംസ്കാരം' },
  { name: 'Coins', labelEn: 'General Finance', labelMl: 'പൊതു ധനകാര്യം' }
];

export default function CategoryPage() {
  const { language } = useLanguage();
  const { user, loading: authLoading, isAdmin, isManager } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { incomeCategories, expenditureCategories, loading: categoriesLoading } = useFinanceCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'income' | 'expenditure'>('income');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Manage Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [categoryType, setCategoryType] = useState<'income' | 'expenditure'>('income');
  const [nameEn, setNameEn] = useState('');
  const [nameMl, setNameMl] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionMl, setDescriptionMl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [categoryToDelete, setCategoryToDelete] = useState<FinanceCategory | null>(null);

  const canManage = isAdmin || isManager;

  const categories = useMemo(() => {
    return activeTab === 'income' ? incomeCategories : expenditureCategories;
  }, [activeTab, incomeCategories, expenditureCategories]);

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

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryType(activeTab);
    setNameEn('');
    setNameMl('');
    setDescriptionEn('');
    setDescriptionMl('');
    setSelectedIcon('BookOpen');
    setSubcategories([{ nameEn: '', nameMl: '', descriptionEn: '', descriptionMl: '' }]);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: FinanceCategory) => {
    setEditingCategory(cat);
    setCategoryType(cat.type);
    setNameEn(cat.nameEn);
    setNameMl(cat.nameMl);
    setDescriptionEn(cat.descriptionEn);
    setDescriptionMl(cat.descriptionMl);
    setSelectedIcon(cat.iconName || 'BookOpen');
    setSubcategories(cat.subcategories && cat.subcategories.length > 0 
      ? [...cat.subcategories] 
      : [{ nameEn: '', nameMl: '', descriptionEn: '', descriptionMl: '' }]
    );
    setIsCategoryModalOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const addSubcategoryField = () => {
    setSubcategories([
      ...subcategories,
      { nameEn: '', nameMl: '', descriptionEn: '', descriptionMl: '' }
    ]);
  };

  const updateSubcategoryField = (index: number, field: keyof SubCategory, value: string) => {
    const updated = [...subcategories];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setSubcategories(updated);
  };

  const removeSubcategoryField = (index: number) => {
    if (subcategories.length === 1) {
      setSubcategories([{ nameEn: '', nameMl: '', descriptionEn: '', descriptionMl: '' }]);
    } else {
      setSubcategories(subcategories.filter((_, i) => i !== index));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !canManage) return;

    setIsSaving(true);
    try {
      if (!nameEn.trim() || !nameMl.trim()) {
        toast({
          variant: 'destructive',
          title: language === 'en' ? 'Validation Error' : 'കൃത്യതയില്ലാത്ത വിവരങ്ങൾ',
          description: language === 'en' ? 'Category name is required in both English and Malayalam.' : 'ഇംഗ്ലീഷിലും മലയാളത്തിലും വിഭാഗത്തിന്റെ പേര് നൽകേണ്ടതുണ്ട്.',
        });
        setIsSaving(false);
        return;
      }

      // Filter out empty subcategories
      const filteredSubcats = subcategories.filter(
        sub => sub.nameEn.trim() || sub.nameMl.trim()
      ).map(sub => ({
        nameEn: sub.nameEn.trim(),
        nameMl: sub.nameMl.trim() || sub.nameEn.trim(),
        descriptionEn: sub.descriptionEn.trim(),
        descriptionMl: sub.descriptionMl.trim() || sub.descriptionEn.trim()
      }));

      const categoryData = {
        type: categoryType,
        nameEn: nameEn.trim(),
        nameMl: nameMl.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionMl: descriptionMl.trim() || descriptionEn.trim(),
        iconName: selectedIcon,
        subcategories: filteredSubcats,
      };

      if (editingCategory) {
        // Update existing category
        const categoryDocRef = doc(firestore, 'financeCategories', editingCategory.id);
        await setDoc(categoryDocRef, categoryData, { merge: true });
        toast({
          title: language === 'en' ? 'Category Updated' : 'വിഭാഗം പുതുക്കി',
          description: language === 'en' ? 'Category has been updated successfully.' : 'വിഭാഗം വിജയകരമായി പുതുക്കി.',
        });
      } else {
        // Create new category
        const customId = `cat-custom-${Date.now()}`;
        await setDoc(doc(firestore, 'financeCategories', customId), categoryData);
        toast({
          title: language === 'en' ? 'Category Created' : 'വിഭാഗം സൃഷ്ടിച്ചു',
          description: language === 'en' ? 'New category has been added successfully.' : 'പുതിയ വിഭാഗം വിജയകരമായി ചേർത്തു.',
        });
      }

      closeCategoryDialog();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save category',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!firestore || !canManage || !categoryToDelete) return;

    try {
      if (categoryToDelete.isCustom) {
        await deleteDoc(doc(firestore, 'financeCategories', categoryToDelete.id));
      } else {
        // For standard categories, mark as deleted in Firestore
        await setDoc(doc(firestore, 'financeCategories', categoryToDelete.id), {
          id: categoryToDelete.id,
          type: categoryToDelete.type,
          isDeleted: true
        });
      }
      toast({
        title: language === 'en' ? 'Category Deleted' : 'വിഭാഗം ഇല്ലാതാക്കി',
        description: language === 'en' ? 'Category has been deleted successfully.' : 'വിഭാഗം വിജയകരമായി ഇല്ലാതാക്കി.',
      });
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete category',
      });
    }
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
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'en' ? 'Search categories...' : 'തിരയുക...'}
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canManage && (
              <Button onClick={handleOpenAddCategory} className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                {language === 'en' ? 'Add Category' : 'വിഭാഗം ചേർക്കുക'}
              </Button>
            )}
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
            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => {
                    // @ts-ignore
                    const Icon = LucideIcons[category.iconName as keyof typeof LucideIcons] || LucideIcons.BookOpen;
                    const isExpanded = expandedCategoryId === category.id;

                    return (
                      <Card key={category.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-200">
                        <CardHeader className="bg-white pb-4 border-b border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl font-bold font-headline">
                                    {language === 'en' ? category.nameEn : category.nameMl}
                                  </CardTitle>
                                  {category.isCustom && (
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50 text-xxs px-1.5 py-0.5">
                                      {language === 'en' ? 'Custom' : 'മാറ്റങ്ങൾ'}
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant="outline" className="mt-1 bg-slate-50">
                                  {category.type === 'income' ? (language === 'en' ? 'Income' : 'വരവ്') : (language === 'en' ? 'Expenditure' : 'ചിലവ്')}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {canManage && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenEditCategory(category)}
                                    className="h-8 w-8 text-slate-500 hover:text-primary"
                                    title={language === 'en' ? 'Edit Category' : 'തിരുത്തുക'}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setCategoryToDelete(category)}
                                    className="h-8 w-8 text-slate-500 hover:text-destructive"
                                    title={language === 'en' ? 'Delete Category' : 'നീക്കം ചെയ്യുക'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleExpand(category.id)}
                                className={cn("transition-transform duration-300 h-8 w-8", isExpanded ? "rotate-180" : "rotate-0")}
                              >
                                <ChevronDown className="h-5 w-5" />
                              </Button>
                            </div>
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
                                  {category.subcategories && category.subcategories.length > 0 ? (
                                    category.subcategories.map((sub, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm"
                                      >
                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                        <div>
                                          <p className="font-semibold text-sm">
                                            {language === 'en' ? sub.nameEn : sub.nameMl}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {language === 'en' ? sub.descriptionEn : sub.descriptionMl}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic px-2 py-1">
                                      {language === 'en' ? 'No sub-categories defined.' : 'ഉപവിഭാഗങ്ങൾ ചേർത്തിട്ടില്ല.'}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {!isExpanded && (
                            <div className="px-6 py-3 flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {category.subcategories ? category.subcategories.length : 0} {language === 'en' ? 'Sub-categories' : 'ഉപവിഭാഗങ്ങൾ'}
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
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add / Edit Category Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-headline">
              {editingCategory 
                ? (language === 'en' ? 'Edit Category' : 'വിഭാഗം തിരുത്തുക') 
                : (language === 'en' ? 'Add Custom Category' : 'പുതിയ വിഭാഗം ചേർക്കുക')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Create a custom finance category with multilingual names and sub-categories.' 
                : 'ഇംഗ്ലീഷിലും മലയാളത്തിലും പേരുകളും ഉപവിഭാഗങ്ങളുമുള്ള ധനകാര്യ വിഭാഗം സൃഷ്ടിക്കുക.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>{language === 'en' ? 'Category Type' : 'വിഭാഗം തരം'}</Label>
                <Select 
                  value={categoryType} 
                  onValueChange={(v) => setCategoryType(v as 'income' | 'expenditure')}
                  disabled={!!editingCategory}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{language === 'en' ? 'Income' : 'വരവ്'}</SelectItem>
                    <SelectItem value="expenditure">{language === 'en' ? 'Expenditure' : 'ചിലവ്'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Icon Selection */}
              <div className="space-y-2">
                <Label>{language === 'en' ? 'Icon' : 'ചിഹ്നം'}</Label>
                <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((ico) => (
                      <SelectItem key={ico.name} value={ico.name}>
                        {language === 'en' ? ico.labelEn : ico.labelMl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Name */}
              <div className="space-y-2">
                <Label htmlFor="catNameEn">{language === 'en' ? 'Name (English) *' : 'പേര് (ഇംഗ്ലീഷ്) *'}</Label>
                <Input 
                  id="catNameEn" 
                  value={nameEn} 
                  onChange={(e) => setNameEn(e.target.value)} 
                  required 
                  className="bg-white"
                  placeholder="e.g. Auditorium Rent"
                />
              </div>

              {/* Malayalam Name */}
              <div className="space-y-2">
                <Label htmlFor="catNameMl">{language === 'en' ? 'Name (Malayalam) *' : 'പേര് (മലയാളം) *'}</Label>
                <Input 
                  id="catNameMl" 
                  value={nameMl} 
                  onChange={(e) => setNameMl(e.target.value)} 
                  required 
                  className="bg-white"
                  placeholder="ഉദാഹരണത്തിന്: ഓഡിറ്റോറിയം വാടക"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Description */}
              <div className="space-y-2">
                <Label htmlFor="catDescEn">{language === 'en' ? 'Description (English)' : 'വിവരണം (ഇംഗ്ലീഷ്)'}</Label>
                <Textarea 
                  id="catDescEn" 
                  value={descriptionEn} 
                  onChange={(e) => setDescriptionEn(e.target.value)} 
                  className="bg-white"
                  placeholder="e.g. Income received from booking temple hall and auditorium"
                />
              </div>

              {/* Malayalam Description */}
              <div className="space-y-2">
                <Label htmlFor="catDescMl">{language === 'en' ? 'Description (Malayalam)' : 'വിവരണം (മലയാളം)'}</Label>
                <Textarea 
                  id="catDescMl" 
                  value={descriptionMl} 
                  onChange={(e) => setDescriptionMl(e.target.value)} 
                  className="bg-white"
                  placeholder="ഉദാഹരണത്തിന്: ഓഡിറ്റോറിയവും ക്ഷേത്രഹാളും ബുക്ക് ചെയ്യുന്നതിൽ നിന്ന് ലഭിക്കുന്ന വരുമാനം"
                />
              </div>
            </div>

            {/* Subcategories Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">{language === 'en' ? 'Sub Categories' : 'ഉപവിഭാഗങ്ങൾ'}</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSubcategoryField}
                  className="flex items-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  {language === 'en' ? 'Add Subcategory' : 'ഉപവിഭാഗം ചേർക്കുക'}
                </Button>
              </div>

              <div className="space-y-4">
                {subcategories.map((sub, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4 relative">
                    <div className="flex justify-between items-center pr-8">
                      <span className="text-xs font-semibold text-slate-500">
                        {language === 'en' ? `Sub-category #${idx + 1}` : `ഉപവിഭാഗം #${idx + 1}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubcategoryField(idx)}
                        className="absolute right-2 top-2 h-8 w-8 text-slate-400 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">{language === 'en' ? 'Name (English)' : 'പേര് (ഇംഗ്ലീഷ്)'}</Label>
                        <Input 
                          value={sub.nameEn} 
                          onChange={(e) => updateSubcategoryField(idx, 'nameEn', e.target.value)}
                          placeholder="e.g. Hall Rent"
                          className="bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{language === 'en' ? 'Name (Malayalam)' : 'പേര് (മലയാളം)'}</Label>
                        <Input 
                          value={sub.nameMl} 
                          onChange={(e) => updateSubcategoryField(idx, 'nameMl', e.target.value)}
                          placeholder="ഉദാഹരണത്തിന്: ഹാൾ വാടക"
                          className="bg-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">{language === 'en' ? 'Description (English)' : 'വിവരണം (ഇംഗ്ലീഷ്)'}</Label>
                        <Input 
                          value={sub.descriptionEn} 
                          onChange={(e) => updateSubcategoryField(idx, 'descriptionEn', e.target.value)}
                          placeholder="Short description"
                          className="bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{language === 'en' ? 'Description (Malayalam)' : 'വിവരണം (മലയാളം)'}</Label>
                        <Input 
                          value={sub.descriptionMl} 
                          onChange={(e) => updateSubcategoryField(idx, 'descriptionMl', e.target.value)}
                          placeholder="ചെറിയ വിവരണം"
                          className="bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={closeCategoryDialog} disabled={isSaving}>
                {language === 'en' ? 'Cancel' : 'റദ്ദാക്കുക'}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'en' ? 'Saving...' : 'സംരക്ഷിക്കുന്നു...'}
                  </>
                ) : (
                  language === 'en' ? 'Save Category' : 'സംരക്ഷിക്കുക'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Are you sure you want to delete this category?' : 'ഈ വിഭാഗം ഇല്ലാതാക്കാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? `This will permanently delete the category "${categoryToDelete?.nameEn}". Existing transactions in this category will not be lost, but you will not be able to log new entries under this category.`
                : `ഇത് "${categoryToDelete?.nameMl}" എന്ന വിഭാഗത്തെ ശാശ്വതമായി ഇല്ലാതാക്കും. ഈ വിഭാഗത്തിലുള്ള നിലവിലെ ഇടപാടുകൾ നഷ്ടപ്പെടില്ല, എന്നാൽ ഇനി ഈ വിഭാഗത്തിൽ പുതിയവ ചേർക്കാൻ കഴിയില്ല.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'en' ? 'Cancel' : 'റദ്ദാക്കുക'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {language === 'en' ? 'Delete' : 'ഇല്ലാതാക്കുക'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SiteFooter />
    </div>
  );
}
