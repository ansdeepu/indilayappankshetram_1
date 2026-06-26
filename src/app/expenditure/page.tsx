'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SiteHeader } from '@/components/layout/header';
import { SiteFooter } from '@/components/layout/footer';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { LoginDialog } from '@/components/auth/login-dialog';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingDown,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  Trash2,
  AlertCircle,
  PiggyBank,
  Heart,
  Flame,
  UserCheck,
  CheckCircle,
  Info,
  LayoutGrid,
  ChevronRight,
  ArrowDownCircle,
} from 'lucide-react';
import { Expenditure } from '@/lib/types';
import { 
  EXPENDITURE_CATEGORIES, 
  type FinanceCategory, 
  type SubCategory 
} from '@/lib/finance-data';

// Predefined realistic fallback expenditures for the user dashboard
const DEFAULT_EXPENDITURES: Expenditure[] = [
  {
    id: 'exp1',
    categoryEn: 'Daily Rituals & Pooja Expenses',
    categoryMl: 'നിത്യപൂജാ ചെലവുകൾ',
    subCategoryEn: 'Pooja Materials & Consumables',
    subCategoryMl: 'പൂജാ സാധനങ്ങൾ',
    amount: 12500,
    date: '2026-06-20',
    descriptionEn: 'Purchase of coconut oil, camphor, incense sticks, and fresh flowers for daily pujas.',
    descriptionMl: 'നിത്യപൂജകൾക്കായി വെളിച്ചെണ്ണ, കർപ്പൂരം, കുന്തിരിക്കം, പൂക്കൾ എന്നിവ വാങ്ങിയത്.',
    paymentMethod: 'Cash',
    voucherNo: 'V-2026-062',
  },
  {
    id: 'exp2',
    categoryEn: 'Administration & Maintenance',
    categoryMl: 'ഭരണച്ചെലവുകളും ശമ്പളവും',
    subCategoryEn: 'Electricity, Water & Utilities',
    subCategoryMl: 'കറന്റ്, വെള്ളം ബില്ലുകൾ',
    amount: 8400,
    date: '2026-06-18',
    descriptionEn: 'Monthly KSEB electricity bill for temple lighting and office area.',
    descriptionMl: 'ക്ഷേത്രവിളക്കുകൾക്കും ഓഫീസിനുമുള്ള പ്രതിമാസ കെ.എസ്.ഇ.ബി വൈദ്യുതി ബിൽ.',
    paymentMethod: 'Bank Transfer',
    voucherNo: 'V-2026-060',
  },
  {
    id: 'exp3',
    categoryEn: 'Charity & Community Welfare',
    categoryMl: 'കാരുണ്യ പ്രവർത്തനങ്ങൾ',
    subCategoryEn: 'Medical & Healthcare Aid',
    subCategoryMl: 'ചികിത്സാ സഹായം',
    amount: 15000,
    date: '2026-06-15',
    descriptionEn: 'Financial assistance sanctioned for heart surgery of a local devotee.',
    descriptionMl: 'പ്രാദേശിക ഭക്തന്റെ ഹൃദയശസ്ത്രക്രിയയ്ക്കായി അനുവദിച്ച അടിയന്തിര ചികിത്സാ ധനസഹായം.',
    paymentMethod: 'Bank Transfer',
    voucherNo: 'V-2026-057',
  },
  {
    id: 'exp4',
    categoryEn: 'Daily Rituals & Pooja Expenses',
    categoryMl: 'നിത്യപൂജാ ചെലവുകൾ',
    subCategoryEn: 'Prasadam & Nivedyam Preparation',
    subCategoryMl: 'പ്രസാദവും നിവേദ്യവും',
    amount: 6800,
    date: '2026-06-10',
    descriptionEn: 'Sourcing raw rice, coconut, and organic cardamom for preparation of Neypayasam prasadam.',
    descriptionMl: 'നെയ്പായസം പ്രസാദം തയ്യാറാക്കുന്നതിനായി അരി, തേങ്ങ, ഏലയ്ക്ക എന്നിവ ശേഖരിച്ചത്.',
    paymentMethod: 'Cash',
    voucherNo: 'V-2026-048',
  },
  {
    id: 'exp5',
    categoryEn: 'Festivals & Celebration Costs',
    categoryMl: 'ഉത്സവങ്ങളും വിശേഷ ദിവസങ്ങളിലെ ചെലവുകൾ',
    subCategoryEn: 'Annadanam & Sadhya Expenditures',
    subCategoryMl: 'അന്നദാന വിതരണ ചെലവുകൾ',
    amount: 45000,
    date: '2026-06-05',
    descriptionEn: 'Annadanam catering and raw materials for Pradosham Sadhya serving 600+ devotees.',
    descriptionMl: 'പ്രദോഷ സദ്യയോടനുബന്ധിച്ച് 600-ലധികം ഭക്തർക്ക് അന്നദാനം നൽകിയതിന്റെ ചെലവ്.',
    paymentMethod: 'UPI',
    voucherNo: 'V-2026-041',
  },
  {
    id: 'exp6',
    categoryEn: 'Administration & Maintenance',
    categoryMl: 'ഭരണച്ചെലവുകളും ശമ്പളവും',
    subCategoryEn: 'Office & Cleaning Staff Salaries',
    subCategoryMl: 'ജീവനക്കാരുടെ ശമ്പളം',
    amount: 28000,
    date: '2026-06-01',
    descriptionEn: 'Disbursement of wages to office keepers and cleaning staff for May 2026.',
    descriptionMl: 'ഓഫീസ് ജീവനക്കാർക്കും ശുചീകരണ തൊഴിലാളികൾക്കും മെയ് മാസത്തെ ശമ്പളം വിതരണം ചെയ്തത്.',
    paymentMethod: 'Bank Transfer',
    voucherNo: 'V-2026-033',
  }
];

// Colors for Pie chart cells
const COLORS = ['#D97706', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6', '#EC4899'];

export default function ExpenditurePage() {
  const { language } = useLanguage();
  const { user, isAdmin, isManager, loading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const canManage = isAdmin || isManager;

  // Retrieve expenditures from firestore
  const expendituresQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'expenditures'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: dbExpenditures, loading: dbLoading } = useCollection<Expenditure>(expendituresQuery);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use DB data if available, otherwise fallback to default mock data
  const expendituresList = useMemo(() => {
    if (dbExpenditures && dbExpenditures.length > 0) {
      return dbExpenditures;
    }
    return DEFAULT_EXPENDITURES;
  }, [dbExpenditures]);

  // Expenditure schema for creation form
  const formSchema = useMemo(() => z.object({
    categoryIndex: z.string().min(1, 'Please select a category'),
    subCategoryEn: z.string().min(1, 'Please select a subcategory'),
    amount: z.coerce.number().positive('Amount must be positive'),
    date: z.string().min(1, 'Please select a date'),
    descriptionEn: z.string().min(3, 'Please enter an English description'),
    descriptionMl: z.string().optional(),
    paymentMethod: z.string().min(1, 'Please select a payment method'),
    voucherNo: z.string().optional(),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryIndex: '',
      subCategoryEn: '',
      amount: '' as any,
      date: new Date().toISOString().split('T')[0],
      descriptionEn: '',
      descriptionMl: '',
      paymentMethod: 'Cash',
      voucherNo: '',
    },
  });

  // Watch selected category to filter subcategories dynamically
  const selectedCategoryIndex = form.watch('categoryIndex');
  const availableSubcategories = useMemo(() => {
    if (selectedCategoryIndex === '') return [];
    const idx = parseInt(selectedCategoryIndex);
    return EXPENDITURE_CATEGORIES[idx]?.subcategories || [];
  }, [selectedCategoryIndex]);

  // Statistics calculation
  const stats = useMemo(() => {
    let total = 0;
    const categoryMap: { [key: string]: number } = {};
    const subcategoryMap: { [key: string]: { amount: number, category: string } } = {};

    expendituresList.forEach((exp) => {
      const amount = Number(exp.amount) || 0;
      total += amount;
      
      const catKey = exp.categoryEn;
      categoryMap[catKey] = (categoryMap[catKey] || 0) + amount;
      
      const subKey = exp.subCategoryEn;
      if (!subcategoryMap[subKey]) {
        subcategoryMap[subKey] = { amount: 0, category: catKey };
      }
      subcategoryMap[subKey].amount += amount;
    });

    const average = expendituresList.length > 0 ? Math.round(total / expendituresList.length) : 0;
    
    const sortedCategories = Object.entries(categoryMap)
      .map(([nameEn, value]) => {
        const cat = EXPENDITURE_CATEGORIES.find(c => c.nameEn === nameEn);
        return {
          nameEn,
          nameMl: cat?.nameMl || nameEn,
          value
        };
      })
      .sort((a, b) => b.value - a.value);

    const sortedSubcategories = Object.entries(subcategoryMap)
      .map(([nameEn, data]) => {
        const cat = EXPENDITURE_CATEGORIES.find(c => c.nameEn === data.category);
        const sub = cat?.subcategories.find(s => s.nameEn === nameEn);
        return {
          nameEn,
          nameMl: sub?.nameMl || nameEn,
          categoryEn: data.category,
          categoryMl: cat?.nameMl || data.category,
          value: data.amount
        };
      })
      .sort((a, b) => b.value - a.value);

    return { total, average, sortedCategories, sortedSubcategories };
  }, [expendituresList]);

  // Pie chart structured data
  const pieChartData = useMemo(() => {
    return stats.sortedCategories.map(cat => ({
      name: language === 'en' ? cat.nameEn : cat.nameMl,
      value: cat.value
    }));
  }, [stats, language]);

  // Bar chart monthly comparison
  const barChartData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const dataMap: { [key: string]: number } = {};
    months.forEach(m => { dataMap[m] = 0; });

    expendituresList.forEach(exp => {
      const d = new Date(exp.date);
      if (!isNaN(d.getTime())) {
        const mName = months[d.getMonth()];
        dataMap[mName] += exp.amount;
      }
    });

    return months.map(m => ({
      month: m,
      [language === 'en' ? 'Expenditure' : 'ചെലവ്']: dataMap[m],
    }));
  }, [expendituresList, language]);

  // Filter lists based on search/filters
  const filteredExpenditures = useMemo(() => {
    return expendituresList.filter((exp) => {
      const matchSearch =
        exp.descriptionEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.descriptionMl?.includes(searchQuery) ||
        exp.subCategoryEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.subCategoryMl?.includes(searchQuery) ||
        exp.voucherNo?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' || exp.categoryEn === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [expendituresList, searchQuery, categoryFilter]);

  // Submits a newly created expenditure to Firestore
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firestore not available',
        description: 'Please try again later.',
      });
      return;
    }

    try {
      const catIdx = parseInt(values.categoryIndex);
      const selectedCat = EXPENDITURE_CATEGORIES[catIdx];
      const subCat = selectedCat.subcategories.find(s => s.nameEn === values.subCategoryEn);

      const expenditureData = {
        categoryEn: selectedCat.nameEn,
        categoryMl: selectedCat.nameMl,
        subCategoryEn: values.subCategoryEn,
        subCategoryMl: subCat ? subCat.nameMl : values.subCategoryEn,
        amount: values.amount,
        date: values.date,
        descriptionEn: values.descriptionEn,
        descriptionMl: values.descriptionMl || values.descriptionEn,
        paymentMethod: values.paymentMethod,
        voucherNo: values.voucherNo || `V-${Date.now().toString().slice(-6)}`,
        createdByUser: user?.email || 'admin',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'expenditures'), expenditureData);

      toast({
        title: language === 'en' ? 'Expenditure Logged' : 'ചെലവ് വിജയകരമായി രേഖപ്പെടുത്തി',
        description: language === 'en' ? 'The record has been written to the accounts book.' : 'വരവ് ചിലവ് പുസ്തകത്തിലേക്ക് വിവരം ചേർത്തിട്ടുണ്ട്.',
      });

      setIsAddDialogOpen(false);
      form.reset({
        categoryIndex: '',
        subCategoryEn: '',
        amount: '' as any,
        date: new Date().toISOString().split('T')[0],
        descriptionEn: '',
        descriptionMl: '',
        paymentMethod: 'Cash',
        voucherNo: '',
      });
    } catch (error: any) {
      console.error('Error adding expenditure:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to log expenditure',
        description: error.message || String(error),
      });
    }
  }

  // Deletes an expenditure from Firestore
  async function handleDelete(id: string) {
    if (!firestore) return;
    if (!confirm(language === 'en' ? 'Are you sure you want to delete this expenditure?' : 'ഈ ചെലവ് നീക്കംചെയ്യാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?')) return;

    try {
      await deleteDoc(doc(firestore, 'expenditures', id));
      toast({
        title: language === 'en' ? 'Record Deleted' : 'രേഖ ഇല്ലാതാക്കി',
      });
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting record',
        description: error.message || String(error),
      });
    }
  }

  // Function to seed initial dummy data for transparency view demonstration
  async function handleSeedData() {
    if (!firestore || !canManage) return;

    try {
      const promises = DEFAULT_EXPENDITURES.map((exp) => {
        const { id, ...dataWithoutId } = exp;
        return addDoc(collection(firestore, 'expenditures'), {
          ...dataWithoutId,
          createdAt: new Date().toISOString(),
          createdByUser: 'admin-seeder'
        });
      });

      await Promise.all(promises);
      toast({
        title: 'Success',
        description: 'Loaded 6 sample temple expenditures into the live database.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Seeding failed',
        description: e.message || String(e),
      });
    }
  }

  // Beautiful Ledger Print/Representation View
  const handlePrintLedger = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
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
                ? 'Only registered devotees with account credentials can view expenditures and financial records.'
                : 'അക്കൗണ്ട് വിവരങ്ങളുള്ള രജിസ്റ്റർ ചെയ്ത ഭക്തർക്ക് മാത്രമേ ചെലവ് കണക്കുകളും രേഖകളും കാണാൻ സാധിക്കൂ.'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsLoginOpen(true)} className="flex items-center gap-2">
                Login / Register
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
      <main className="flex-1 bg-background pb-12">
        {/* Banner Section */}
        <section className="bg-primary/5 border-b border-primary/10 py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <Badge variant="secondary" className="mb-3 border-accent/30 text-accent">
                  {language === 'en' ? 'Temple Transparency Ledger' : 'ക്ഷേത്ര ധനകാര്യ കണക്ക്'}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-wide">
                  {language === 'en' ? 'Expenditures & Audit Statement' : 'ക്ഷേത്ര ചെലവുകളും ഓഡിറ്റ് റിപ്പോർട്ടും'}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
                  {language === 'en'
                    ? 'Explore live, auditable accounting reports of temple maintenance, administration, religious festivals, and charitable distributions.'
                    : 'ക്ഷേത്രത്തിന്റെ നടത്തിപ്പ് ചെലവുകൾ, ആചാര കർമ്മങ്ങൾ, കാരുണ്യ സഹായ വിതരണം എന്നിവ ഇവിടെ സുതാര്യമായി പരിശോധിക്കാം.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrintLedger}
                  className="border-accent/30 hover:bg-accent/5 flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {language === 'en' ? 'Print Statement' : 'റിപ്പോർട്ട് പ്രിന്റ് ചെയ്യുക'}
                </Button>

                {canManage && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        {language === 'en' ? 'Log Expenditure' : 'ചെലവ് ചേർക്കുക'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {language === 'en' ? 'Log New Expenditure' : 'പുതിയ ചെലവ് രേഖപ്പെടുത്തുക'}
                        </DialogTitle>
                        <DialogDescription>
                          {language === 'en'
                            ? 'Record cash outflow or bills. All information is written immediately to the audited public book.'
                            : 'പൂജാ ചിലവുകളോ മറ്റ് ബില്ലുകളോ ഇവിടെ ചേർക്കുക. ഈ വിവരങ്ങൾ പൊതു ഓഡിറ്റ് പുസ്തകത്തിൽ ഉൾപ്പെടുത്തും.'}
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="categoryIndex"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {EXPENDITURE_CATEGORIES.map((cat, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>
                                          {language === 'en' ? cat.nameEn : cat.nameMl}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="subCategoryEn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Subcategory</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={selectedCategoryIndex === ''}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Subcategory" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {availableSubcategories.map((sub, idx) => (
                                        <SelectItem key={idx} value={sub.nameEn}>
                                          {language === 'en' ? sub.nameEn : sub.nameMl}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{language === 'en' ? 'Amount (INR)' : 'തുക (INR)'}</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="₹ Amount" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Method" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Cash">Cash</SelectItem>
                                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                      <SelectItem value="UPI">UPI</SelectItem>
                                      <SelectItem value="Cheque">Cheque</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="voucherNo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Voucher / Ref Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. V-2026-104" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="descriptionEn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (English)</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe the purpose of the expense..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="descriptionMl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Malayalam) - Optional</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="വിശദീകരണം മലയാളത്തിൽ..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter className="mt-4 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Log Transaction</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Analytics & Statistics Section */}
        <section className="container mx-auto px-4 max-w-6xl -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-sm border-accent/20 bg-background/90 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {language === 'en' ? 'Total Expenditures' : 'ആകെ ചെലവഴിച്ചത്'}
                  </p>
                  <h3 className="text-2xl font-bold text-primary mt-1">₹{stats.total.toLocaleString()}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Logged in accounts book</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-full text-rose-500">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-accent/20 bg-background/90 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {language === 'en' ? 'Rituals & Pooja' : 'നിത്യപൂജ ചിലവുകൾ'}
                  </p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">
                    ₹{(stats.sortedCategories.find(c => c.nameEn.includes('Daily Rituals'))?.value || 0).toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Consumables & Ritual materials</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-full text-amber-500">
                  <Flame className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-accent/20 bg-background/90 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {language === 'en' ? 'Charity & Welfare' : 'ജീവകാരുണ്യ സഹായങ്ങൾ'}
                  </p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                    ₹{(stats.sortedCategories.find(c => c.nameEn.includes('Charity'))?.value || 0).toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Medical & Educational relief</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-500">
                  <Heart className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-accent/20 bg-background/90 backdrop-blur-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {language === 'en' ? 'Average Expense' : 'ശരാശരി ചിലവ്'}
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-600 mt-1">₹{stats.average.toLocaleString()}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Per transaction average</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-500">
                  <PiggyBank className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Charts Row */}
          {isMounted && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 print:hidden">
              {/* Pie Chart Distribution (3/12 cols) */}
              <Card className="lg:col-span-4 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    {language === 'en' ? 'Expense Apportionment' : 'ചിലവ് വിഭജനം'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Percentage breakdown by major departments' : 'പ്രധാന മേഖലകളിലെ ചിലവുകളുടെ ശതമാനം'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] flex items-center justify-center">
                  {pieChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data recorded</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Subcategory Breakdown List (4/12 cols) */}
              <Card className="lg:col-span-4 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    {language === 'en' ? 'Subcategory Breakdown' : 'വിഭാഗം തിരിച്ചുള്ള കണക്ക്'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Detailed spending by individual heads' : 'ഓരോ വിഭാഗത്തിലും ചിലവഴിച്ച തുക'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-4">
                    {stats.sortedSubcategories.map((sub, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground/80 truncate pr-2">
                              {language === 'en' ? sub.nameEn : sub.nameMl}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase">
                              {language === 'en' ? sub.categoryEn : sub.categoryMl}
                            </span>
                          </div>
                          <span className="font-bold text-primary font-mono whitespace-nowrap">₹{sub.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(sub.value / stats.total) * 100}%` }}
                            className="bg-primary/60 h-full rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{((sub.value / stats.total) * 100).toFixed(1)}% of total</span>
                        </div>
                      </div>
                    ))}
                    {stats.sortedSubcategories.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50">
                        <LayoutGrid className="h-10 w-10 mb-2" />
                        <p className="text-xs">No subcategory data</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart Monthly Comparison (4/12 cols) */}
              <Card className="lg:col-span-4 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    {language === 'en' ? 'Expenditure Trends' : 'പ്രതിമാസ ചിലവുകൾ'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' ? 'Audit year 2026 expense timeline' : 'ഈ വർഷത്തെ ചെലവുകളുടെ കാലാനുക്രമം'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Bar dataKey={language === 'en' ? 'Expenditure' : 'ചെലവ്'} fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Interactive Ledger Table */}
          <Card className="border-accent/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary font-headline flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-accent" />
                    {language === 'en' ? 'Auditable Financial Ledger' : 'പ്രമാണീകൃത ധനകാര്യ പുസ്തകം'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === 'en' ? 'Verification records for temple audit. Scroll or search using controls.' : 'പരിശോധനയ്ക്കായുള്ള ധനകാര്യ വിവരങ്ങൾ.'}
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                    <Input
                      type="text"
                      placeholder={language === 'en' ? 'Search Ledger...' : 'തിരയുക...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs w-[180px] bg-background border-accent/20"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 text-xs w-[180px] bg-background border-accent/20">
                      <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENDITURE_CATEGORIES.map((cat, idx) => (
                        <SelectItem key={idx} value={cat.nameEn}>
                          {language === 'en' ? cat.nameEn : cat.nameMl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {canManage && dbExpenditures && dbExpenditures.length === 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSeedData}
                      className="text-xs flex items-center gap-1.5 border border-dashed border-primary/20 hover:bg-primary/5"
                      title="Load high quality realistic expenditures into Firestore database"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Seed DB Data
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="w-[110px] font-semibold">{language === 'en' ? 'Voucher No' : 'വൗച്ചർ നമ്പർ'}</TableHead>
                    <TableHead className="w-[110px] font-semibold">{language === 'en' ? 'Date' : 'തീയതി'}</TableHead>
                    <TableHead className="font-semibold">{language === 'en' ? 'Description & Category' : 'വിശദാംശവും വിഭാഗവും'}</TableHead>
                    <TableHead className="w-[120px] font-semibold">{language === 'en' ? 'Method' : 'പേയ്മെന്റ് രീതി'}</TableHead>
                    <TableHead className="w-[120px] text-right font-semibold">{language === 'en' ? 'Amount' : 'തുക'}</TableHead>
                    {canManage && <TableHead className="w-[80px] text-center print:hidden font-semibold">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenditures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 6 : 5} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                          <p>{language === 'en' ? 'No transactions match filters.' : 'കണക്കുകൾ ഒന്നും ലഭ്യമല്ല.'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenditures.map((exp) => (
                      <TableRow key={exp.id} className="hover:bg-muted/5 transition-colors group">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{exp.voucherNo || 'N/A'}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">
                              {new Date(exp.date).toLocaleDateString(language === 'en' ? 'en-GB' : 'ml-IN', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{new Date(exp.date).getFullYear()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <p className="font-medium text-sm text-foreground leading-tight">
                              {language === 'en' ? exp.descriptionEn : exp.descriptionMl || exp.descriptionEn}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/10">
                                {language === 'en' ? exp.categoryEn : exp.categoryMl || exp.categoryEn}
                              </Badge>
                              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {language === 'en' ? exp.subCategoryEn : exp.subCategoryMl || exp.subCategoryEn}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="ghost" className="text-[10px] border h-5 bg-background shadow-sm">
                            {exp.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary text-sm">
                          ₹{exp.amount.toLocaleString()}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(exp.id)}
                              className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
