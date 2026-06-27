'use client';

import React, { useState, useMemo } from 'react';
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
import { EXPENDITURE_CATEGORIES } from '@/lib/finance-categories';

export default function ExpenditurePage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const firestore = useFirestore();
  const { user, loading: authLoading, isAdmin, isManager } = useUser();
  const canManage = isAdmin || isManager;

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const expenditureQuery = useMemo(() => {
    if (!firestore || !user || !canManage) return null;
    return query(collection(firestore, 'expenditures'), orderBy('date', 'desc'));
  }, [firestore, user, canManage]);

  const { data: expendituresList, loading } = useCollection<Expenditure>(expenditureQuery);

  const formSchema = z.object({
    categoryId: z.string().min(1, 'Category is required'),
    subCategoryIndex: z.string().min(1, 'Sub-category is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    date: z.string().min(1, 'Date is required'),
    descriptionEn: z.string().min(3, 'English description is required'),
    descriptionMl: z.string().optional(),
    paymentMethod: z.string().default('Cash'),
    voucherNo: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      subCategoryIndex: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      descriptionEn: '',
      descriptionMl: '',
      paymentMethod: 'Cash',
      voucherNo: '',
    },
  });

  const selectedCatId = form.watch('categoryId');
  const selectedCategory = EXPENDITURE_CATEGORIES.find(c => c.id === selectedCatId);

  // Handle new expenditure submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !canManage) return;

    try {
      const cat = EXPENDITURE_CATEGORIES.find(c => c.id === values.categoryId);
      if (!cat) throw new Error('Invalid category');
      
      const subCat = cat.subcategories[parseInt(values.subCategoryIndex)];
      if (!subCat) throw new Error('Invalid sub-category');

      const expenditureData = {
        categoryEn: cat.nameEn,
        categoryMl: cat.nameMl,
        subCategoryEn: subCat.nameEn,
        subCategoryMl: subCat.nameMl,
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
        categoryId: '',
        subCategoryIndex: '',
        amount: 0,
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
    if (!firestore || !canManage) return;
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

  // Beautiful Ledger Print/Representation View
  const handlePrintLedger = () => {
    window.print();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const list = expendituresList || [];
    const total = list.reduce((acc, curr) => acc + curr.amount, 0);
    const categoryMap: { [key: string]: { value: number; nameEn: string; nameMl: string } } = {};

    list.forEach((exp) => {
      if (!categoryMap[exp.categoryEn]) {
        categoryMap[exp.categoryEn] = { value: 0, nameEn: exp.categoryEn, nameMl: exp.categoryMl };
      }
      categoryMap[exp.categoryEn].value += exp.amount;
    });

    const sortedCategories = Object.values(categoryMap).sort((a, b) => b.value - a.value);

    return { total, sortedCategories };
  }, [expendituresList]);

  // Chart data
  const pieChartData = useMemo(() => {
    return stats.sortedCategories.map((cat) => ({
      name: language === 'en' ? cat.nameEn : cat.nameMl,
      value: cat.value
    }));
  }, [stats, language]);

  // Filter list
  const filteredExpenditures = useMemo(() => {
    return (expendituresList || []).filter((exp) => {
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

  if (authLoading || loading) {
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

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-slate-50/50 pb-12">
        <section className="bg-primary/5 border-b border-primary/10 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <Badge variant="secondary" className="mb-3 border-accent/30 text-accent">
                  {language === 'en' ? 'Temple Transparency Ledger' : 'ക്ഷേത്ര ധനകാര്യ കണക്ക്'}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-wide">
                  {language === 'en' ? 'Expenditures & Audit Statement' : 'ക്ഷേത്ര ചെലവുകളും ഓഡിറ്റ് റിപ്പോർട്ടും'}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                  {language === 'en'
                    ? 'Explore live, auditable accounting reports of temple maintenance, administration, religious festivals, and charitable distributions.'
                    : 'ക്ഷേത്രത്തിന്റെ നടത്തിപ്പ് ചെലവുകൾ, ആചാര കർമ്മങ്ങൾ, കാരുണ്യ സഹായ വിതരണം എന്നിവ ഇവിടെ സുതാര്യമായി പരിശോധിക്കാം.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrintLedger}
                  className="bg-white border-accent/30 hover:bg-accent/5 flex items-center gap-2"
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
                            : 'പൂജാ ചിലവുകളോ മറ്റ് ബില്ലുകളോ ഇവിടെ ചേർക്കുക.'}
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="categoryId"
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
                                      {EXPENDITURE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
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
                              name="subCategoryIndex"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sub-category</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                    disabled={!selectedCategory}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Sub-category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {selectedCategory?.subcategories.map((sub, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>
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
                                  <FormLabel>Amount (INR)</FormLabel>
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
                                  <Textarea placeholder="Describe the purpose..." {...field} />
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

        <section className="container mx-auto px-4 max-w-6xl -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-md border-none bg-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    {language === 'en' ? 'Total Expenditures' : 'ആകെ ചെലവഴിച്ചത്'}
                  </p>
                  <h3 className="text-3xl font-bold text-primary mt-1">₹{stats.total.toLocaleString()}</h3>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl text-rose-500">
                  <TrendingDown className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-white col-span-1 md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">{language === 'en' ? 'Category Wise Breakdown' : 'വിഭാഗം തിരിച്ചുള്ള കണക്ക്'}</h3>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{language === 'en' ? 'Transaction History' : 'ചിലവ് വിവരങ്ങൾ'}</CardTitle>
                  <CardDescription>{language === 'en' ? 'Recent financial outflows from the temple fund.' : 'ക്ഷേത്ര ഫണ്ടിൽ നിന്നുള്ള ചിലവ് വിവരങ്ങൾ.'}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search ledger..." 
                      className="pl-8 w-full sm:w-[200px]" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENDITURE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.nameEn}>{language === 'en' ? cat.nameEn : cat.nameMl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Voucher</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {canManage && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenditures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenditures.map((exp) => (
                        <TableRow key={exp.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(exp.date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                {language === 'en' ? exp.categoryEn : exp.categoryMl}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {language === 'en' ? exp.subCategoryEn : exp.subCategoryMl}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2">
                              {language === 'en' ? exp.descriptionEn : exp.descriptionMl}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{exp.voucherNo}</TableCell>
                          <TableCell className="text-right font-bold text-rose-600 whitespace-nowrap">
                            ₹{exp.amount.toLocaleString()}
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(exp.id)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// Helper to format date safely
function format(date: Date, pattern: string) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    if (pattern === 'dd MMM yyyy') return `${day} ${month} ${year}`;
    return d.toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}
